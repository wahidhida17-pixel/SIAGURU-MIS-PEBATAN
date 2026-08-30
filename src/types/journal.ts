import { Semester } from './academic';

export type JournalStatus = 'Lengkap' | 'Draft';

export interface Journal {
  id?: string;
  teacherId: string;
  scheduleId: string;
  classId: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  day?: string;
  lessonHour: number;
  duration?: number; // minutes, e.g. 40 or 70
  
  material: string;
  objectives?: string;
  method?: string;
  media?: string;
  activities: string;
  assessment?: string;
  
  totalStudents?: number;
  present?: number;
  sick?: number;
  permission?: number;
  absent?: number;
  
  reflection?: string;
  followUp?: string;
  status: JournalStatus;
  
  academicYear: string;
  semester: Semester;
  
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
  updatedBy?: string;
}
