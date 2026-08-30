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
import type { AgendaItem, AgendaCategory } from '../types/calendar';
import type { Semester } from '../types/academic';
import { auditService } from './auditService';

export const agendaService = {
  async getAgendas(filters?: {
    teacherId?: string;
    category?: AgendaCategory | 'all';
    academicYear?: string;
    semester?: Semester | 'all';
    date?: string; // YYYY-MM-DD
    isCompleted?: boolean;
    search?: string;
  }): Promise<AgendaItem[]> {
    try {
      const q = query(collection(db, 'agendas'), orderBy('date', 'asc'));
      const snapshot = await getDocs(q);
      let agendas = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AgendaItem));

      if (filters?.teacherId && filters.teacherId !== 'all') {
        agendas = agendas.filter(a => a.teacherId === filters.teacherId);
      }

      if (filters?.category && filters.category !== 'all') {
        agendas = agendas.filter(a => a.category === filters.category);
      }

      if (filters?.academicYear && filters.academicYear !== 'all') {
        agendas = agendas.filter(a => a.academicYear === filters.academicYear);
      }

      if (filters?.semester && filters.semester !== 'all') {
        agendas = agendas.filter(a => a.semester === filters.semester);
      }

      if (filters?.date) {
        agendas = agendas.filter(a => a.date === filters.date);
      }

      if (filters?.isCompleted !== undefined) {
        agendas = agendas.filter(a => a.isCompleted === filters.isCompleted);
      }

      if (filters?.search && filters.search.trim() !== '') {
        const queryTerm = filters.search.toLowerCase().trim();
        agendas = agendas.filter(
          a =>
            a.title.toLowerCase().includes(queryTerm) ||
            (a.description || '').toLowerCase().includes(queryTerm) ||
            (a.location || '').toLowerCase().includes(queryTerm)
        );
      }

      return agendas;
    } catch (error) {
      console.error('Error fetching agendas:', error);
      return [];
    }
  },

  async createAgenda(
    data: Omit<AgendaItem, 'id' | 'createdAt' | 'updatedAt'>,
    currentUser?: { uid: string; name: string }
  ): Promise<string> {
    const timestamp = new Date().toISOString();
    const payload = {
      ...data,
      isCompleted: data.isCompleted || false,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    const docRef = await addDoc(collection(db, 'agendas'), payload);

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'CREATE',
        'AGENDA',
        docRef.id,
        `Membuat agenda "${data.title}" tanggal ${data.date}`
      );
    }

    return docRef.id;
  },

  async toggleAgendaComplete(id: string, currentUser?: { uid: string; name: string }): Promise<boolean> {
    const docRef = doc(db, 'agendas', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Agenda tidak ditemukan.');

    const current = snap.data() as AgendaItem;
    const nextVal = !current.isCompleted;

    await updateDoc(docRef, {
      isCompleted: nextVal,
      updatedAt: new Date().toISOString()
    });

    return nextVal;
  },

  async toggleComplete(id: string, isCompletedOrUser?: any, user?: any): Promise<boolean> {
    const currentUser = typeof isCompletedOrUser === 'object' ? isCompletedOrUser : user;
    return this.toggleAgendaComplete(id, currentUser);
  },

  async updateAgenda(
    id: string,
    data: Partial<AgendaItem>,
    currentUser?: { uid: string; name: string }
  ): Promise<void> {
    const docRef = doc(db, 'agendas', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'UPDATE',
        'AGENDA',
        id,
        `Memperbarui agenda ID: ${id}`
      );
    }
  },

  async deleteAgenda(id: string, currentUser?: { uid: string; name: string }): Promise<void> {
    await deleteDoc(doc(db, 'agendas', id));
    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'DELETE',
        'AGENDA',
        id,
        `Menghapus agenda ID: ${id}`
      );
    }
  }
};
