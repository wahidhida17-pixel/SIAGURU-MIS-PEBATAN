import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type { Subject } from '../types/academic';

const COLLECTION_NAME = 'subjects';

export const subjectService = {
  async getAll(): Promise<Subject[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('category', 'asc'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
    } catch (err) {
      console.warn('Error fetching subjects:', err);
      return [];
    }
  },

  async getActive(): Promise<Subject[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('status', '==', 'active'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
    } catch (err) {
      console.warn('Error fetching active subjects:', err);
      return [];
    }
  },

  async getById(id: string): Promise<Subject | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as Subject;
      }
      return null;
    } catch (err) {
      console.warn('Error fetching subject by id:', err);
      return null;
    }
  },

  async create(data: Omit<Subject, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async update(id: string, data: Partial<Subject>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }
};
