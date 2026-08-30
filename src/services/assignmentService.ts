import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type { Assignment } from '../types/academic';

const COLLECTION_NAME = 'assignments';

export const assignmentService = {
  async getAll(): Promise<Assignment[]> {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
  },

  async getByTeacher(teacherId: string): Promise<Assignment[]> {
    const q = query(collection(db, COLLECTION_NAME), where('teacherId', '==', teacherId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
  },

  async getByClass(classId: string): Promise<Assignment[]> {
    const q = query(collection(db, COLLECTION_NAME), where('classId', '==', classId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
  },
  
  async checkDuplicate(teacherId: string, subjectId: string, classId: string, academicYear: string, semester: string): Promise<boolean> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('teacherId', '==', teacherId),
      where('subjectId', '==', subjectId),
      where('classId', '==', classId),
      where('academicYear', '==', academicYear),
      where('semester', '==', semester)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  },

  async create(data: Omit<Assignment, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  },
  
  async createBulk(dataArray: Omit<Assignment, 'id'>[]): Promise<void> {
    const batch = writeBatch(db);
    for (const data of dataArray) {
      const docRef = doc(collection(db, COLLECTION_NAME));
      batch.set(docRef, {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    await batch.commit();
  },

  async update(id: string, data: Partial<Assignment>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }
};
