import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type {
  DocumentItem,
  DocumentCategory,
  DocumentStatus,
  DocumentVisibility,
  DocumentVersion
} from '../types/document';
import type { Semester } from '../types/academic';
import { storageService } from './storageService';
import { auditService } from './auditService';

export const DEFAULT_CATEGORIES: DocumentCategory[] = [
  'Administrasi Pembelajaran',
  'Perencanaan Pembelajaran',
  'Penilaian',
  'Absensi',
  'Jurnal',
  'Kelas',
  'Surat',
  'Kegiatan',
  'Kepramukaan',
  'Keagamaan',
  'Ekstrakurikuler',
  'Rapat',
  'Lainnya'
];

export const documentService = {
  async getDocuments(filters?: {
    ownerId?: string;
    userRole?: 'admin' | 'guru';
    category?: string;
    academicYear?: string;
    semester?: Semester | 'all';
    classId?: string;
    subjectId?: string;
    fileType?: string;
    isFavorite?: boolean;
    status?: DocumentStatus | 'all';
    visibility?: DocumentVisibility;
    search?: string;
  }): Promise<DocumentItem[]> {
    try {
      const q = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      let docs = snapshot.docs.map(d => ({ id: d.id, documentId: d.id, ...d.data() } as DocumentItem));

      // Filter by status (default is active if not specified)
      const targetStatus = filters?.status !== undefined ? filters.status : 'active';
      if (targetStatus !== 'all') {
        if (targetStatus === 'trash' || targetStatus === 'deleted') {
          docs = docs.filter(d => d.status === 'deleted' || d.status === 'trash');
        } else {
          docs = docs.filter(d => (d.status || 'active') === targetStatus);
        }
      }

      // Filter by role / access
      if (filters?.userRole === 'guru' && filters?.ownerId) {
        // Teacher can see:
        // 1. Their own documents
        // 2. School-wide documents (visibility == 'school')
        // 3. Class documents if matching their class (visibility == 'class')
        docs = docs.filter(
          d =>
            d.ownerId === filters.ownerId ||
            d.visibility === 'school' ||
            (d.visibility === 'class' && (!filters.classId || d.classId === filters.classId))
        );
      } else if (filters?.ownerId && !filters?.userRole) {
        docs = docs.filter(d => d.ownerId === filters.ownerId);
      }

      if (filters?.category && filters.category !== 'all') {
        docs = docs.filter(d => d.category === filters.category);
      }

      if (filters?.academicYear && filters.academicYear !== 'all') {
        docs = docs.filter(d => d.academicYear === filters.academicYear);
      }

      if (filters?.semester && filters.semester !== 'all') {
        docs = docs.filter(d => d.semester === filters.semester);
      }

      if (filters?.classId && filters.classId !== 'all') {
        docs = docs.filter(d => d.classId === filters.classId);
      }

      if (filters?.subjectId && filters.subjectId !== 'all') {
        docs = docs.filter(d => d.subjectId === filters.subjectId);
      }

      if (filters?.fileType && filters.fileType !== 'all') {
        docs = docs.filter(d => d.fileType?.toLowerCase() === filters.fileType?.toLowerCase());
      }

      if (filters?.isFavorite !== undefined && filters.isFavorite) {
        docs = docs.filter(d => d.isFavorite === true);
      }

      if (filters?.visibility && filters.visibility !== ('all' as any)) {
        docs = docs.filter(d => d.visibility === filters.visibility);
      }

      if (filters?.search && filters.search.trim() !== '') {
        const queryTerm = filters.search.toLowerCase().trim();
        docs = docs.filter(d => {
          const matchTitle = d.title.toLowerCase().includes(queryTerm);
          const matchDesc = (d.description || '').toLowerCase().includes(queryTerm);
          const matchCategory = (d.category || '').toLowerCase().includes(queryTerm);
          const matchTags = (d.tags || []).some(t => t.toLowerCase().includes(queryTerm));
          const matchOwner = (d.ownerName || '').toLowerCase().includes(queryTerm);
          const matchFile = (d.fileName || '').toLowerCase().includes(queryTerm);
          const matchSubj = (d.subjectName || '').toLowerCase().includes(queryTerm);
          const matchClass = (d.className || '').toLowerCase().includes(queryTerm);
          return (
            matchTitle ||
            matchDesc ||
            matchCategory ||
            matchTags ||
            matchOwner ||
            matchFile ||
            matchSubj ||
            matchClass
          );
        });
      }

      return docs;
    } catch (error) {
      console.error('Error getting documents:', error);
      return [];
    }
  },

  async getDocumentById(id: string): Promise<DocumentItem | null> {
    try {
      const docRef = doc(db, 'documents', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, documentId: snap.id, ...snap.data() } as DocumentItem;
    } catch (error) {
      console.error('Error getting document by id:', error);
      return null;
    }
  },

  async createDocument(
    data: Omit<DocumentItem, 'id' | 'documentId' | 'createdAt' | 'updatedAt' | 'version' | 'status'>,
    file?: File,
    currentUser?: { uid: string; name: string }
  ): Promise<string> {
    let fileMeta = {
      fileName: data.fileName || 'Dokumen_Administrasi.pdf',
      fileSize: data.fileSize || 1024,
      fileType: data.fileType || 'pdf',
      storagePath: data.storagePath || '',
      downloadUrl: data.downloadUrl || ''
    };

    if (file) {
      const uploadRes = await storageService.uploadFile(
        file,
        data.academicYear || '2026/2027',
        data.ownerId || 'admin',
        data.category || 'Administrasi'
      );
      fileMeta = {
        fileName: uploadRes.fileName,
        fileSize: uploadRes.fileSize,
        fileType: uploadRes.fileType,
        storagePath: uploadRes.storagePath,
        downloadUrl: uploadRes.downloadUrl
      };
    }

    const timestamp = new Date().toISOString();
    const payload: Omit<DocumentItem, 'id'> = {
      ...data,
      ...fileMeta,
      status: 'active',
      isFavorite: data.isFavorite || false,
      visibility: data.visibility || 'school',
      version: 1,
      versions: [
        {
          version: 1,
          fileName: fileMeta.fileName,
          fileSize: fileMeta.fileSize,
          storagePath: fileMeta.storagePath,
          downloadUrl: fileMeta.downloadUrl,
          note: 'Versi awal dokumen',
          updatedBy: currentUser?.uid || data.ownerId,
          updatedByName: currentUser?.name || data.ownerName,
          updatedAt: timestamp
        }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const docRef = await addDoc(collection(db, 'documents'), payload);

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'CREATE',
        'DOKUMEN',
        docRef.id,
        `Mengunggah dokumen "${data.title}" (${fileMeta.fileName}) kategori ${data.category}`
      );
    }

    return docRef.id;
  },

  async updateDocument(
    id: string,
    data: Partial<DocumentItem>,
    newFile?: File,
    versionNote?: string,
    currentUser?: { uid: string; name: string }
  ): Promise<void> {
    const docRef = doc(db, 'documents', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Dokumen tidak ditemukan.');

    const currentDoc = snap.data() as DocumentItem;
    const timestamp = new Date().toISOString();

    let updatedMeta = {};
    let newVersion = currentDoc.version || 1;
    const existingVersions: DocumentVersion[] = currentDoc.versions || [];

    if (newFile) {
      const uploadRes = await storageService.uploadFile(
        newFile,
        currentDoc.academicYear || '2026/2027',
        currentUser?.uid || currentDoc.ownerId,
        data.category || currentDoc.category
      );

      newVersion += 1;
      const versionObj: DocumentVersion = {
        version: newVersion,
        fileName: uploadRes.fileName,
        fileSize: uploadRes.fileSize,
        storagePath: uploadRes.storagePath,
        downloadUrl: uploadRes.downloadUrl,
        note: versionNote || `Pembaruan file versi ${newVersion}`,
        updatedBy: currentUser?.uid || 'user',
        updatedByName: currentUser?.name || 'Pengguna',
        updatedAt: timestamp
      };

      updatedMeta = {
        fileName: uploadRes.fileName,
        fileSize: uploadRes.fileSize,
        fileType: uploadRes.fileType,
        storagePath: uploadRes.storagePath,
        downloadUrl: uploadRes.downloadUrl,
        version: newVersion,
        versions: [versionObj, ...existingVersions]
      };
    }

    const payload = {
      ...data,
      ...updatedMeta,
      updatedAt: timestamp
    };

    await updateDoc(docRef, payload);

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'UPDATE',
        'DOKUMEN',
        id,
        `Memperbarui dokumen "${currentDoc.title}" (Versi ${newVersion})`
      );
    }
  },

  async toggleFavorite(id: string, currentUser?: { uid: string; name: string }): Promise<boolean> {
    const docRef = doc(db, 'documents', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Dokumen tidak ditemukan.');

    const current = snap.data() as DocumentItem;
    const nextVal = !current.isFavorite;

    await updateDoc(docRef, {
      isFavorite: nextVal,
      updatedAt: new Date().toISOString()
    });

    return nextVal;
  },

  async moveToTrash(id: string, currentUser?: { uid: string; name: string }): Promise<void> {
    const docRef = doc(db, 'documents', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Dokumen tidak ditemukan.');

    const currentDoc = snap.data() as DocumentItem;

    await updateDoc(docRef, {
      status: 'deleted',
      deletedAt: new Date().toISOString(),
      deletedBy: currentUser?.name || 'Pengguna',
      updatedAt: new Date().toISOString()
    });

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'TRASH',
        'DOKUMEN',
        id,
        `Memindahkan dokumen "${currentDoc.title}" ke tempat sampah`
      );
    }
  },

  async restoreFromTrash(id: string, currentUser?: { uid: string; name: string }): Promise<void> {
    const docRef = doc(db, 'documents', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Dokumen tidak ditemukan.');

    const currentDoc = snap.data() as DocumentItem;

    await updateDoc(docRef, {
      status: 'active',
      deletedAt: null,
      deletedBy: null,
      updatedAt: new Date().toISOString()
    });

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'RESTORE',
        'DOKUMEN',
        id,
        `Memulihkan dokumen "${currentDoc.title}" dari tempat sampah`
      );
    }
  },

  async deletePermanently(id: string, currentUser?: { uid: string; name: string }): Promise<void> {
    const docRef = doc(db, 'documents', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const currentDoc = snap.data() as DocumentItem;
    if (currentDoc.storagePath) {
      await storageService.deleteFile(currentDoc.storagePath);
    }

    await deleteDoc(docRef);

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'DELETE_PERMANENT',
        'DOKUMEN',
        id,
        `Menghapus dokumen "${currentDoc.title}" secara permanen`
      );
    }
  },

  async permanentDelete(id: string, currentUser?: { uid: string; name: string }): Promise<void> {
    return this.deletePermanently(id, currentUser);
  },

  async duplicateDocument(
    id: string,
    targetAcademicYear?: string,
    targetSemester?: Semester,
    currentUser?: { uid: string; name: string }
  ): Promise<string> {
    const docRef = doc(db, 'documents', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Dokumen sumber tidak ditemukan.');

    const sourceDoc = snap.data() as DocumentItem;
    const timestamp = new Date().toISOString();

    const payload: Omit<DocumentItem, 'id'> = {
      ...sourceDoc,
      title: `${sourceDoc.title} (Salinan)`,
      academicYear: targetAcademicYear || sourceDoc.academicYear,
      semester: targetSemester || sourceDoc.semester,
      status: 'active',
      isFavorite: false,
      version: 1,
      versions: [
        {
          version: 1,
          fileName: sourceDoc.fileName,
          fileSize: sourceDoc.fileSize,
          storagePath: sourceDoc.storagePath,
          downloadUrl: sourceDoc.downloadUrl,
          note: `Salinan dari tahun ajaran ${sourceDoc.academicYear}`,
          updatedBy: currentUser?.uid || sourceDoc.ownerId,
          updatedByName: currentUser?.name || sourceDoc.ownerName,
          updatedAt: timestamp
        }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const newDocRef = await addDoc(collection(db, 'documents'), payload);

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'DUPLICATE',
        'DOKUMEN',
        newDocRef.id,
        `Menduplikasi dokumen "${sourceDoc.title}" ke ${payload.academicYear}`
      );
    }

    return newDocRef.id;
  },

  async getDocumentStatistics(ownerId?: string, academicYear?: string): Promise<{
    total: number;
    pdfCount: number;
    wordCount: number;
    excelCount: number;
    imageCount: number;
    pptCount: number;
    otherCount: number;
    favoriteCount: number;
    draftCount: number;
    archivedCount: number;
    trashCount: number;
  }> {
    const allDocs = await this.getDocuments({
      ownerId: ownerId || undefined,
      academicYear: academicYear || undefined,
      status: 'all'
    });

    let pdfCount = 0;
    let wordCount = 0;
    let excelCount = 0;
    let imageCount = 0;
    let pptCount = 0;
    let otherCount = 0;
    let favoriteCount = 0;
    let draftCount = 0;
    let archivedCount = 0;
    let trashCount = 0;
    let activeTotal = 0;

    for (const doc of allDocs) {
      if (doc.status === 'deleted') {
        trashCount++;
        continue;
      }
      if (doc.status === 'draft') draftCount++;
      if (doc.status === 'archived') archivedCount++;
      if (doc.isFavorite) favoriteCount++;

      activeTotal++;

      const type = (doc.fileType || '').toLowerCase();
      if (type === 'pdf') pdfCount++;
      else if (['doc', 'docx'].includes(type)) wordCount++;
      else if (['xls', 'xlsx'].includes(type)) excelCount++;
      else if (['jpg', 'jpeg', 'png', 'webp'].includes(type)) imageCount++;
      else if (['ppt', 'pptx'].includes(type)) pptCount++;
      else otherCount++;
    }

    return {
      total: activeTotal,
      pdfCount,
      wordCount,
      excelCount,
      imageCount,
      pptCount,
      otherCount,
      favoriteCount,
      draftCount,
      archivedCount,
      trashCount
    };
  }
};
