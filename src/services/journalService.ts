import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type { Journal } from '../types/journal';

const COLLECTION_NAME = 'journals';

export const journalService = {
  async getAll(): Promise<Journal[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Journal));
    } catch (err) {
      console.warn('Error fetching journals:', err);
      return [];
    }
  },

  async getById(id: string): Promise<Journal | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as Journal;
    } catch (err) {
      console.warn('Error fetching journal by id:', err);
      return null;
    }
  },

  async getByTeacher(teacherId: string): Promise<Journal[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('teacherId', '==', teacherId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Journal));
    } catch (err) {
      console.warn('Error fetching journals by teacher:', err);
      return [];
    }
  },

  async getByClass(classId: string): Promise<Journal[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('classId', '==', classId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Journal));
    } catch (err) {
      console.warn('Error fetching journals by class:', err);
      return [];
    }
  },

  async getByDate(date: string): Promise<Journal[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('date', '==', date));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Journal));
    } catch (err) {
      console.warn('Error fetching journals by date:', err);
      return [];
    }
  },

  async getByScheduleAndDate(scheduleId: string, date: string): Promise<Journal | null> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('scheduleId', '==', scheduleId),
        where('date', '==', date)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const docData = snapshot.docs[0];
      return { id: docData.id, ...docData.data() } as Journal;
    } catch (err) {
      console.warn('Error fetching journal by schedule and date:', err);
      return null;
    }
  },

  async create(data: Omit<Journal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // Check duplicate
    const existing = await this.getByScheduleAndDate(data.scheduleId, data.date);
    if (existing && existing.id) {
      throw new Error('Jurnal untuk jadwal dan tanggal ini sudah dibuat.');
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async update(id: string, data: Partial<Journal>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
