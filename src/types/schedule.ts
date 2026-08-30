import { Semester } from './academic';

export type DayOfWeek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
export type ScheduleStatus = 'active' | 'inactive';

export interface Schedule {
  id?: string;
  scheduleId?: string;
  day: DayOfWeek;
  startTime: string; // e.g. "07:30"
  endTime: string;   // e.g. "08:10"
  lessonHour: number; // e.g. 1, 2, 3...
  classId: string;   // e.g. "6A" or class document id
  subjectId: string; // e.g. "AQH"
  teacherId: string; // e.g. teacherCode "G001" or teacher doc ID
  room?: string;
  academicYear: string; // e.g. "2026/2027"
  semester: Semester;   // "Ganjil" | "Genap"
  status: ScheduleStatus;
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}

export interface ScheduleConflict {
  type: 'teacher' | 'class';
  message: string;
  details: {
    teacherName?: string;
    className?: string;
    subjectName?: string;
    day: DayOfWeek;
    lessonHour: number;
    startTime: string;
    endTime: string;
  };
}
