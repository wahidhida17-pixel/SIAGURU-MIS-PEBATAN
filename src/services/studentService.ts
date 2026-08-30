import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type { Student } from '../types/academic';

const COLLECTION_NAME = 'students';

export const studentService = {
  async getAll(): Promise<Student[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } catch (err) {
      console.warn('Error fetching students:', err);
      return [];
    }
  },

  async getByClass(classId: string): Promise<Student[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('classId', '==', classId));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      return list.sort((a, b) => (Number(a.absentNumber) || 0) - (Number(b.absentNumber) || 0));
    } catch (err) {
      console.warn('Error fetching students by class:', err);
      return [];
    }
  },

  async getById(id: string): Promise<Student | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as Student;
      }
      return null;
    } catch (err) {
      console.warn('Error fetching student by id:', err);
      return null;
    }
  },

  async create(data: Omit<Student, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async update(id: string, data: Partial<Student>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }
};
