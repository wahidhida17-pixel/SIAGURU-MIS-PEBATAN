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
import type { Letter, LetterType, LetterStatus, OfficialLetter, OfficialLetterType } from '../types/document';
import { auditService } from './auditService';
import { storageService } from './storageService';

export const letterService = {
  async getLetters(filters?: {
    type?: LetterType | OfficialLetterType | string;
    status?: LetterStatus | 'all';
    academicYear?: string;
    targetUserId?: string;
    search?: string;
  }): Promise<OfficialLetter[]> {
    try {
      const q = query(collection(db, 'letters'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      let letters = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          letterId: d.id,
          letterNumber: data.letterNumber || data.number || '',
          title: data.title || data.subject || '',
          type: data.type || 'Surat Tugas',
          regarding: data.regarding || data.subject || data.description || '',
          letterDate: data.letterDate || data.date || '',
          signedByName: data.signedByName || data.sender || 'Kepala Madrasah',
          signedByNip: data.signedByNip || '',
          content: data.content || data.description || '',
          targetUserId: data.targetUserId,
          targetUserName: data.targetUserName || data.recipient,
          attachmentUrl: data.attachmentUrl,
          attachmentFileName: data.attachmentFileName,
          academicYear: data.academicYear || '2026/2027',
          semester: data.semester,
          createdBy: data.createdBy || '',
          createdByName: data.createdByName || '',
          createdAt: data.createdAt || '',
          updatedAt: data.updatedAt || '',
          ...data
        } as OfficialLetter;
      });

      if (filters?.type && filters.type !== 'all') {
        letters = letters.filter(l => l.type === filters.type);
      }

      if (filters?.targetUserId) {
        letters = letters.filter(
          l => !l.targetUserId || l.targetUserId === 'all' || l.targetUserId === filters.targetUserId
        );
      }

      if (filters?.academicYear && filters.academicYear !== 'all') {
        letters = letters.filter(l => l.academicYear === filters.academicYear);
      }

      if (filters?.search && filters.search.trim() !== '') {
        const queryTerm = filters.search.toLowerCase().trim();
        letters = letters.filter(
          l =>
            (l.letterNumber || '').toLowerCase().includes(queryTerm) ||
            (l.title || '').toLowerCase().includes(queryTerm) ||
            (l.regarding || '').toLowerCase().includes(queryTerm) ||
            (l.targetUserName || '').toLowerCase().includes(queryTerm)
        );
      }

      return letters;
    } catch (error) {
      console.error('Error fetching letters:', error);
      return [];
    }
  },

  async getLetterById(id: string): Promise<OfficialLetter | null> {
    try {
      const docRef = doc(db, 'letters', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        id: snap.id,
        letterId: snap.id,
        letterNumber: data.letterNumber || data.number || '',
        title: data.title || data.subject || '',
        type: data.type || 'Surat Tugas',
        regarding: data.regarding || data.subject || data.description || '',
        letterDate: data.letterDate || data.date || '',
        signedByName: data.signedByName || data.sender || '',
        signedByNip: data.signedByNip || '',
        content: data.content || data.description || '',
        targetUserId: data.targetUserId,
        targetUserName: data.targetUserName || data.recipient,
        attachmentUrl: data.attachmentUrl,
        attachmentFileName: data.attachmentFileName,
        academicYear: data.academicYear || '2026/2027',
        semester: data.semester,
        createdBy: data.createdBy || '',
        createdByName: data.createdByName || '',
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || '',
        ...data
      } as OfficialLetter;
    } catch (error) {
      console.error('Error getting letter by id:', error);
      return null;
    }
  },

  generateLetterNumber(
    type: OfficialLetterType | LetterType,
    index: number = 1,
    academicYear: string = '2026/2027',
    prefixFormat?: string
  ): string {
    const yearCode = academicYear.split('/')[0] || '2026';
    const monthRomawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][
      new Date().getMonth()
    ];
    const padIndex = String(index).padStart(3, '0');

    let codeType = 'MI-SYU';
    if (type === 'Surat Tugas' || type === 'tugas') codeType = 'ST/MI-SYU';
    else if (type === 'Surat Undangan Rapat' || type === 'undangan') codeType = 'UND/MI-SYU';
    else if (type === 'Surat Keterangan Aktif Mengajar' || type === 'keterangan') codeType = 'SKET/MI-SYU';
    else if (type === 'Surat Keputusan (SK)') codeType = 'SK/MI-SYU';
    else if (type === 'Surat Dinas Keluar' || type === 'keluar') codeType = 'KLR/MI-SYU';
    else if (type === 'Surat Masuk' || type === 'masuk') codeType = 'MSK/MI-SYU';

    if (prefixFormat) {
      return prefixFormat
        .replace('{NUM}', padIndex)
        .replace('{TYPE}', codeType)
        .replace('{MONTH}', monthRomawi)
        .replace('{YEAR}', yearCode);
    }

    return `${padIndex}/${codeType}/${monthRomawi}/${yearCode}`;
  },

  async createLetter(
    data: any,
    file?: File,
    currentUser?: { uid: string; name: string }
  ): Promise<string> {
    const timestamp = new Date().toISOString();
    let attachmentUrl = data.attachmentUrl;
    let attachmentFileName = data.attachmentFileName;

    if (file) {
      const uploadRes = await storageService.uploadFile(
        file,
        data.academicYear || '2026/2027',
        currentUser?.uid || data.createdBy || 'admin',
        'Surat'
      );
      attachmentUrl = uploadRes.downloadUrl;
      attachmentFileName = uploadRes.fileName;
    }

    const payload = {
      ...data,
      attachmentUrl: attachmentUrl || '',
      attachmentFileName: attachmentFileName || '',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const docRef = await addDoc(collection(db, 'letters'), payload);

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'CREATE',
        'SURAT',
        docRef.id,
        `Mencatat surat ${data.type || ''} nomor "${data.letterNumber || data.number || ''}" hal "${data.regarding || data.title || ''}"`
      );
    }

    return docRef.id;
  },

  async updateLetter(
    id: string,
    data: Partial<OfficialLetter | Letter>,
    currentUser?: { uid: string; name: string }
  ): Promise<void> {
    const docRef = doc(db, 'letters', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'UPDATE',
        'SURAT',
        id,
        `Memperbarui surat nomor "${(data as any).letterNumber || (data as any).number || id}"`
      );
    }
  },

  async deleteLetter(id: string, currentUser?: { uid: string; name: string }): Promise<void> {
    await deleteDoc(doc(db, 'letters', id));
    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'DELETE',
        'SURAT',
        id,
        `Menghapus arsip surat ID: ${id}`
      );
    }
  }
};
