import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type { Schedule, DayOfWeek, ScheduleConflict } from '../types/schedule';

const COLLECTION_NAME = 'schedules';

export const scheduleService = {
  async getAll(): Promise<Schedule[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
    } catch (err) {
      console.warn('Error fetching schedules:', err);
      return [];
    }
  },

  async getById(id: string): Promise<Schedule | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as Schedule;
    } catch (err) {
      console.warn('Error fetching schedule by id:', err);
      return null;
    }
  },

  async getByTeacher(teacherId: string): Promise<Schedule[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('teacherId', '==', teacherId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
    } catch (err) {
      console.warn('Error fetching schedules by teacher:', err);
      return [];
    }
  },

  async getByClass(classId: string): Promise<Schedule[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('classId', '==', classId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
    } catch (err) {
      console.warn('Error fetching schedules by class:', err);
      return [];
    }
  },

  async getByDay(day: DayOfWeek): Promise<Schedule[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('day', '==', day));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
    } catch (err) {
      console.warn('Error fetching schedules by day:', err);
      return [];
    }
  },

  async checkConflict(scheduleData: Partial<Schedule>, excludeId?: string): Promise<ScheduleConflict | null> {
    const allSchedules = await this.getAll();
    const activeSchedules = allSchedules.filter(s => 
      s.status === 'active' &&
      s.id !== excludeId &&
      s.academicYear === scheduleData.academicYear &&
      s.semester === scheduleData.semester &&
      s.day === scheduleData.day
    );

    // Helper to check hour / time overlap
    const isTimeOverlap = (s: Schedule) => {
      if (s.lessonHour && scheduleData.lessonHour && s.lessonHour === scheduleData.lessonHour) {
        return true;
      }
      if (s.startTime && s.endTime && scheduleData.startTime && scheduleData.endTime) {
        return (scheduleData.startTime < s.endTime && scheduleData.endTime > s.startTime);
      }
      return false;
    };

    for (const s of activeSchedules) {
      if (isTimeOverlap(s)) {
        // Check teacher conflict
        if (s.teacherId === scheduleData.teacherId) {
          return {
            type: 'teacher',
            message: `Guru sudah memiliki jadwal mengajar pada ${s.day} Jam ke-${s.lessonHour} (${s.startTime} - ${s.endTime}) di Kelas ${s.classId}.`,
            details: {
              className: s.classId,
              subjectName: s.subjectId,
              day: s.day,
              lessonHour: s.lessonHour,
              startTime: s.startTime,
              endTime: s.endTime
            }
          };
        }

        // Check class conflict
        if (s.classId === scheduleData.classId) {
          return {
            type: 'class',
            message: `Kelas ${s.classId} sudah memiliki mata pelajaran (${s.subjectId}) pada ${s.day} Jam ke-${s.lessonHour} (${s.startTime} - ${s.endTime}).`,
            details: {
              className: s.classId,
              subjectName: s.subjectId,
              day: s.day,
              lessonHour: s.lessonHour,
              startTime: s.startTime,
              endTime: s.endTime
            }
          };
        }
      }
    }

    return null;
  },

  async create(data: Omit<Schedule, 'id'>): Promise<string> {
    const conflict = await this.checkConflict(data);
    if (conflict) {
      throw new Error(`KONFLIK: ${conflict.message}`);
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async update(id: string, data: Partial<Schedule>): Promise<void> {
    const current = await this.getById(id);
    if (!current) throw new Error('Jadwal tidak ditemukan');

    const merged = { ...current, ...data };
    const conflict = await this.checkConflict(merged, id);
    if (conflict) {
      throw new Error(`KONFLIK: ${conflict.message}`);
    }

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
