import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type { ClassData } from '../types/academic';

const COLLECTION_NAME = 'classes';

export const classService = {
  async getAll(): Promise<ClassData[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData));
      return list.sort((a, b) => {
        if (a.gradeLevel !== b.gradeLevel) return String(a.gradeLevel).localeCompare(String(b.gradeLevel));
        return (a.parallel || '').localeCompare(b.parallel || '');
      });
    } catch (err) {
      console.warn('Error fetching classes:', err);
      return [];
    }
  },

  async getActive(): Promise<ClassData[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData));
      const activeList = list.filter(c => c.status === 'active');
      return activeList.sort((a, b) => {
        if (a.gradeLevel !== b.gradeLevel) return String(a.gradeLevel).localeCompare(String(b.gradeLevel));
        return (a.parallel || '').localeCompare(b.parallel || '');
      });
    } catch (err) {
      console.warn('Error fetching active classes:', err);
      return [];
    }
  },

  async getById(id: string): Promise<ClassData | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as ClassData;
      }
      return null;
    } catch (err) {
      console.warn('Error fetching class by id:', err);
      return null;
    }
  },

  async create(data: Omit<ClassData, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async update(id: string, data: Partial<ClassData>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }
};
