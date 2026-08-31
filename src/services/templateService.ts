import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type { DocumentTemplate, DocumentCategory } from '../types/document';
import { documentService } from './documentService';
import { storageService } from './storageService';
import { auditService } from './auditService';

export const INITIAL_DEFAULT_TEMPLATES: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Template Program Tahunan (PROTA) Kurikulum Merdeka',
    category: 'Perencanaan Pembelajaran',
    description: 'Format baku program tahunan pemetaan capaian pembelajaran dan alokasi jam tatap muka setahun penuh.',
    fileName: 'Template_PROTA_Madrasah.docx',
    fileType: 'docx',
    fileSize: 45000,
    downloadUrl: '',
    storagePath: '',
    academicYear: '2026/2027',
    status: 'active',
    isDefault: true,
    createdBy: 'system',
    createdByName: 'Admin Madrasah'
  },
  {
    title: 'Template Program Semester (PROMES) Lengkap',
    category: 'Perencanaan Pembelajaran',
    description: 'Matriks alokasi waktu mingguan per tujuan pembelajaran per semester.',
    fileName: 'Template_PROMES_Semester.xlsx',
    fileType: 'xlsx',
    fileSize: 62000,
    downloadUrl: '',
    storagePath: '',
    academicYear: '2026/2027',
    status: 'active',
    isDefault: true,
    createdBy: 'system',
    createdByName: 'Admin Madrasah'
  },
  {
    title: 'Template Jurnal Mengajar Harian & Refleksi Guru',
    category: 'Jurnal',
    description: 'Format pencatatan materi harian, kehadiran, kendala belajar, dan catatan tindak lanjut.',
    fileName: 'Template_Jurnal_Harian.docx',
    fileType: 'docx',
    fileSize: 38000,
    downloadUrl: '',
    storagePath: '',
    academicYear: '2026/2027',
    status: 'active',
    isDefault: true,
    createdBy: 'system',
    createdByName: 'Admin Madrasah'
  },
  {
    title: 'Template Daftar Nilai Formatif & Sumatif',
    category: 'Penilaian',
    description: 'Buku rekap nilai harian, sumatif lingkup materi, dan sumatif akhir semester.',
    fileName: 'Template_Daftar_Nilai_Siswa.xlsx',
    fileType: 'xlsx',
    fileSize: 84000,
    downloadUrl: '',
    storagePath: '',
    academicYear: '2026/2027',
    status: 'active',
    isDefault: true,
    createdBy: 'system',
    createdByName: 'Admin Madrasah'
  },
  {
    title: 'Template Program & Jurnal Remedial / Pengayaan',
    category: 'Penilaian',
    description: 'Dokumen pelaksanaan bimbingan remedial dan pengayaan beserta instrumen dan bukti hasil.',
    fileName: 'Template_Program_Remedial_Pengayaan.docx',
    fileType: 'docx',
    fileSize: 42000,
    downloadUrl: '',
    storagePath: '',
    academicYear: '2026/2027',
    status: 'active',
    isDefault: true,
    createdBy: 'system',
    createdByName: 'Admin Madrasah'
  },
  {
    title: 'Template Notulen Rapat Dewan Guru & Komite',
    category: 'Rapat',
    description: 'Format baku pencatatan agenda, jalannya pembahasan, keputusan musyawarah, dan daftar tindak lanjut.',
    fileName: 'Template_Notulen_Rapat_Resmi.docx',
    fileType: 'docx',
    fileSize: 35000,
    downloadUrl: '',
    storagePath: '',
    academicYear: '2026/2027',
    status: 'active',
    isDefault: true,
    createdBy: 'system',
    createdByName: 'Admin Madrasah'
  },
  {
    title: 'Template Laporan Pelaksanaan Kegiatan Madrasah',
    category: 'Kegiatan',
    description: 'Format pelaporan kepanitiaan kegiatan PHBI, Jamran, Porseni, Upacara, dan lomba.',
    fileName: 'Template_Laporan_Kegiatan_Madrasah.docx',
    fileType: 'docx',
    fileSize: 52000,
    downloadUrl: '',
    storagePath: '',
    academicYear: '2026/2027',
    status: 'active',
    isDefault: true,
    createdBy: 'system',
    createdByName: 'Admin Madrasah'
  },
  {
    title: 'Template Berita Acara Pelaksanaan Asesmen / Ujian',
    category: 'Penilaian',
    description: 'Format berita acara serah terima naskah, presensi peserta, dan catatan pengawas ruang ujian.',
    fileName: 'Template_Berita_Acara_Ujian.docx',
    fileType: 'docx',
    fileSize: 31000,
    downloadUrl: '',
    storagePath: '',
    academicYear: '2026/2027',
    status: 'active',
    isDefault: true,
    createdBy: 'system',
    createdByName: 'Admin Madrasah'
  }
];

export const templateService = {
  async getTemplates(filters?: {
    category?: string;
    academicYear?: string;
    status?: 'active' | 'inactive' | 'all';
    isActive?: boolean;
    search?: string;
  }): Promise<DocumentTemplate[]> {
    try {
      const q = query(collection(db, 'documentTemplates'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      let templates = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DocumentTemplate));

      // If empty, auto-seed defaults
      if (templates.length === 0) {
        await this.seedDefaultTemplates();
        return this.getTemplates(filters);
      }

      if (filters?.isActive !== undefined) {
        templates = templates.filter(t =>
          t.isActive !== undefined
            ? t.isActive === filters.isActive
            : filters.isActive
            ? t.status === 'active'
            : t.status === 'inactive'
        );
      } else if (filters?.status && filters.status !== 'all') {
        templates = templates.filter(t => t.status === filters.status);
      } else if (!filters?.status) {
        templates = templates.filter(t => t.status === 'active' || t.isActive === true || t.isActive === undefined);
      }

      if (filters?.category && filters.category !== 'all') {
        templates = templates.filter(t => t.category === filters.category);
      }

      if (filters?.academicYear && filters.academicYear !== 'all') {
        templates = templates.filter(t => t.academicYear === filters.academicYear);
      }

      if (filters?.search && filters.search.trim() !== '') {
        const queryTerm = filters.search.toLowerCase().trim();
        templates = templates.filter(
          t =>
            t.title.toLowerCase().includes(queryTerm) ||
            t.description.toLowerCase().includes(queryTerm) ||
            t.category.toLowerCase().includes(queryTerm)
        );
      }

      return templates;
    } catch (error) {
      console.error('Error fetching document templates:', error);
      return [];
    }
  },

  async seedDefaultTemplates(): Promise<void> {
    const timestamp = new Date().toISOString();
    for (const tpl of INITIAL_DEFAULT_TEMPLATES) {
      await addDoc(collection(db, 'documentTemplates'), {
        ...tpl,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }
  },

  async getTemplateById(id: string): Promise<DocumentTemplate | null> {
    try {
      const docRef = doc(db, 'documentTemplates', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as DocumentTemplate;
    } catch (error) {
      console.error('Error getting template by id:', error);
      return null;
    }
  },

  async createTemplate(
    data: any,
    file?: File,
    currentUser?: { uid: string; name?: string; displayName?: string; [key: string]: any }
  ): Promise<string> {
    const timestamp = new Date().toISOString();
    let downloadUrl = data.downloadUrl || '';
    let storagePath = data.storagePath || '';
    let fileName = data.fileName;
    let fileSize = data.fileSize || 0;
    let fileType = data.fileType || 'docx';

    if (file) {
      const uploadRes = await storageService.uploadFile(
        file,
        data.academicYear || '2026/2027',
        currentUser?.uid || data.createdBy || 'admin',
        data.category || 'Template'
      );
      downloadUrl = uploadRes.downloadUrl;
      storagePath = uploadRes.storagePath;
      fileName = uploadRes.fileName;
      fileSize = uploadRes.fileSize;
      fileType = uploadRes.fileType;
    }

    const payload = {
      ...data,
      fileName,
      fileSize,
      fileType,
      downloadUrl,
      storagePath,
      status: data.status || (data.isActive === false ? 'inactive' : 'active'),
      isActive: data.isActive !== undefined ? data.isActive : data.status !== 'inactive',
      usageCount: data.usageCount || 0,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    const docRef = await addDoc(collection(db, 'documentTemplates'), payload);

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name || currentUser.displayName || 'Pengguna',
        'CREATE',
        'TEMPLATE_DOKUMEN',
        docRef.id,
        `Membuat template dokumen baru "${data.title}"`
      );
    }

    return docRef.id;
  },

  async updateTemplate(
    id: string,
    data: Partial<DocumentTemplate>,
    file?: File,
    currentUser?: { uid: string; name?: string; displayName?: string; [key: string]: any }
  ): Promise<void> {
    const docRef = doc(db, 'documentTemplates', id);
    let updatedFields: any = { ...data };

    if (file) {
      const uploadRes = await storageService.uploadFile(
        file,
        data.academicYear || '2026/2027',
        currentUser?.uid || 'admin',
        data.category || 'Template'
      );
      updatedFields.downloadUrl = uploadRes.downloadUrl;
      updatedFields.storagePath = uploadRes.storagePath;
      updatedFields.fileName = uploadRes.fileName;
      updatedFields.fileSize = uploadRes.fileSize;
      updatedFields.fileType = uploadRes.fileType;
    }

    if (data.isActive !== undefined) {
      updatedFields.status = data.isActive ? 'active' : 'inactive';
    }

    await updateDoc(docRef, {
      ...updatedFields,
      updatedAt: new Date().toISOString()
    });

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name || currentUser.displayName || 'Pengguna',
        'UPDATE',
        'TEMPLATE_DOKUMEN',
        id,
        `Memperbarui template dokumen ID: ${id}`
      );
    }
  },

  async deleteTemplate(id: string, currentUser?: { uid: string; name?: string; displayName?: string; [key: string]: any }): Promise<void> {
    await deleteDoc(doc(db, 'documentTemplates', id));
    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name || currentUser.displayName || 'Pengguna',
        'DELETE',
        'TEMPLATE_DOKUMEN',
        id,
        `Menghapus template dokumen ID: ${id}`
      );
    }
  },

  async useTemplate(
    templateId: string,
    userOrOptions: any,
    optionsOrUser?: any,
    customTitleOrExtra?: any
  ): Promise<string> {
    const template = await this.getTemplateById(templateId);
    if (!template) throw new Error('Template tidak ditemukan.');

    let user = { uid: 'user', name: 'Guru' };
    let options: any = {};

    if (userOrOptions?.uid) {
      user = userOrOptions;
      options = optionsOrUser || {};
    } else if (optionsOrUser?.uid) {
      user = optionsOrUser;
      options = userOrOptions || {};
    } else if (typeof userOrOptions === 'object') {
      options = userOrOptions;
    }

    if (customTitleOrExtra && typeof customTitleOrExtra === 'string') {
      options.customTitle = customTitleOrExtra;
    }

    const title = options?.customTitle || `${template.title.replace('Template ', '')} - ${user.name}`;

    const newDocId = await documentService.createDocument(
      {
        ownerId: user.uid,
        ownerName: user.name,
        title: title,
        description: `Dibuat dari template: ${template.title}`,
        category: template.category,
        fileName: template.fileName,
        fileType: template.fileType,
        fileSize: template.fileSize,
        storagePath: template.storagePath,
        downloadUrl: template.downloadUrl,
        academicYear: options?.academicYear || template.academicYear || '2026/2027',
        semester: options?.semester || 'Ganjil',
        classId: options?.classId,
        className: options?.className,
        subjectId: options?.subjectId,
        subjectName: options?.subjectName,
        tags: ['template', template.category.toLowerCase().replace(/\s+/g, '')],
        isFavorite: false,
        visibility: 'private'
      },
      undefined,
      user
    );

    // Increment template usageCount
    try {
      const docRef = doc(db, 'documentTemplates', templateId);
      await updateDoc(docRef, {
        usageCount: (template.usageCount || 0) + 1
      });
    } catch (e) {
      console.warn('Failed to increment usageCount:', e);
    }

    await auditService.log(
      user.uid,
      user.name,
      'USE_TEMPLATE',
      'DOKUMEN',
      newDocId,
      `Menggunakan template "${template.title}" menjadi dokumen pribadi "${title}"`
    );

    return newDocId;
  }
};
