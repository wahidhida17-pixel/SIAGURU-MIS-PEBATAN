import { Semester } from './academic';

export type AttendanceStatus = 'hadir' | 'sakit' | 'izin' | 'alpa';

export interface AttendanceRecord {
  studentId: string;
  studentName?: string;
  nis?: string;
  gender?: 'L' | 'P';
  status: AttendanceStatus;
  note?: string;
  updatedAt?: any;
}

export interface AttendanceSession {
  id?: string;
  date: string; // YYYY-MM-DD
  scheduleId: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  academicYear: string;
  semester: Semester;
  notes?: string;
  totalStudents?: number;
  presentCount?: number;
  sickCount?: number;
  permissionCount?: number;
  absentCount?: number;
  records: Record<string, AttendanceRecord>; // key: studentId or student doc Id
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
  updatedBy?: string;
}

export interface StudentAttendanceRecap {
  studentId: string;
  name: string;
  nis: string;
  gender: 'L' | 'P';
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  totalSessions: number;
  percentage: number;
}
