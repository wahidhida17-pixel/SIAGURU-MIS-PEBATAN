import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type { Teacher } from '../types/teacher';

const COLLECTION_NAME = 'teachers';

export const teacherService = {
  async getAll(): Promise<Teacher[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher));
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } catch (err) {
      console.warn('Error fetching teachers:', err);
      return [];
    }
  },

  async getActive(): Promise<Teacher[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher));
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } catch (err) {
      console.warn('Error fetching active teachers:', err);
      return [];
    }
  },

  async getById(id: string): Promise<Teacher | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as Teacher;
      }
      return null;
    } catch (err) {
      console.warn('Error fetching teacher by id:', err);
      return null;
    }
  },

  async getByUserId(userId: string): Promise<Teacher | null> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as Teacher;
      }
      return null;
    } catch (err) {
      console.warn('Error fetching teacher by userId:', err);
      return null;
    }
  },

  async create(data: Omit<Teacher, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async update(id: string, data: Partial<Teacher>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
