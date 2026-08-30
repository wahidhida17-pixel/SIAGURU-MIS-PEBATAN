import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type { AttendanceSession, AttendanceRecord, StudentAttendanceRecap } from '../types/attendance';
import { studentService } from './studentService';

const COLLECTION_NAME = 'attendance';

export const attendanceService = {
  async getAll(): Promise<AttendanceSession[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceSession));
    } catch (err) {
      console.warn('Error fetching attendance:', err);
      return [];
    }
  },

  async getById(id: string): Promise<AttendanceSession | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as AttendanceSession;
    } catch (err) {
      console.warn('Error fetching attendance by id:', err);
      return null;
    }
  },

  async getByTeacher(teacherId: string): Promise<AttendanceSession[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('teacherId', '==', teacherId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceSession));
    } catch (err) {
      console.warn('Error fetching attendance by teacher:', err);
      return [];
    }
  },

  async getByClass(classId: string): Promise<AttendanceSession[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('classId', '==', classId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceSession));
    } catch (err) {
      console.warn('Error fetching attendance by class:', err);
      return [];
    }
  },

  async getByDate(date: string): Promise<AttendanceSession[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('date', '==', date));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceSession));
    } catch (err) {
      console.warn('Error fetching attendance by date:', err);
      return [];
    }
  },

  async getByScheduleAndDate(scheduleId: string, date: string): Promise<AttendanceSession | null> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('scheduleId', '==', scheduleId),
        where('date', '==', date)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const docData = snapshot.docs[0];
      return { id: docData.id, ...docData.data() } as AttendanceSession;
    } catch (err) {
      console.warn('Error fetching attendance by schedule and date:', err);
      return null;
    }
  },

  async saveAttendance(
    sessionData: Omit<AttendanceSession, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ): Promise<string> {
    // Calculate totals from records
    const recordsList = Object.values(sessionData.records || {});
    const totalStudents = recordsList.length;
    const presentCount = recordsList.filter(r => r.status === 'hadir').length;
    const sickCount = recordsList.filter(r => r.status === 'sakit').length;
    const permissionCount = recordsList.filter(r => r.status === 'izin').length;
    const absentCount = recordsList.filter(r => r.status === 'alpa').length;

    const payload = {
      ...sessionData,
      totalStudents,
      presentCount,
      sickCount,
      permissionCount,
      absentCount,
      updatedAt: new Date().toISOString()
    };

    if (existingId) {
      const docRef = doc(db, COLLECTION_NAME, existingId);
      await updateDoc(docRef, payload);
      return existingId;
    }

    // Check duplicate if not specified existingId
    const existing = await this.getByScheduleAndDate(sessionData.scheduleId, sessionData.date);
    if (existing && existing.id) {
      const docRef = doc(db, COLLECTION_NAME, existing.id);
      await updateDoc(docRef, payload);
      return existing.id;
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...payload,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async getRecapByClass(classId: string, academicYear?: string, semester?: string): Promise<StudentAttendanceRecap[]> {
    const students = await studentService.getByClass(classId);
    const q = query(collection(db, COLLECTION_NAME), where('classId', '==', classId));
    const snapshot = await getDocs(q);
    
    let sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceSession));
    if (academicYear) {
      sessions = sessions.filter(s => s.academicYear === academicYear);
    }
    if (semester) {
      sessions = sessions.filter(s => s.semester === semester);
    }

    const totalSessions = sessions.length;

    return students.map(student => {
      const sId = student.id || student.nis;
      let hadir = 0;
      let sakit = 0;
      let izin = 0;
      let alpa = 0;

      sessions.forEach(session => {
        const record = session.records?.[sId] || session.records?.[student.nis] || Object.values(session.records || {}).find(r => r.studentId === sId || r.nis === student.nis);
        if (record) {
          if (record.status === 'hadir') hadir++;
          else if (record.status === 'sakit') sakit++;
          else if (record.status === 'izin') izin++;
          else if (record.status === 'alpa') alpa++;
        }
      });

      const percentage = totalSessions > 0 ? Number(((hadir / totalSessions) * 100).toFixed(1)) : 100;

      return {
        studentId: sId,
        name: student.name,
        nis: student.nis,
        gender: student.gender,
        hadir,
        sakit,
        izin,
        alpa,
        totalSessions,
        percentage
      };
    });
  }
};
