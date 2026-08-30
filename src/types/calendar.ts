import type { Semester } from './academic';

export type CalendarEventType =
  | 'Kegiatan Madrasah'
  | 'Kegiatan Kelas'
  | 'Kegiatan Guru'
  | 'Rapat'
  | 'Ujian'
  | 'PTS'
  | 'PAS'
  | 'PAT'
  | 'Keagamaan'
  | 'Pramuka'
  | 'Olahraga'
  | 'Seni'
  | 'Libur'
  | 'Lainnya';

export type TargetAudience = 'Semua' | 'Guru' | 'Siswa' | 'Kelas Tertentu' | 'Wali Murid';

export interface CalendarEvent {
  id?: string;
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  type: CalendarEventType;
  academicYear: string;
  semester: Semester;
  location?: string;
  targetAudience: TargetAudience;
  classId?: string;
  className?: string;
  isHoliday?: boolean;
  color?: string;
  documentIds?: string[];
  reportData?: {
    type?: 'laporan' | 'notulen' | 'presensi';
    results?: string;
    attendees?: string[];
    decisions?: string;
    followUp?: string;
    recordedAt?: string;
    recordedBy?: string;
  };
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export type AgendaCategory = 'Mengajar' | 'Rapat' | 'Penilaian' | 'Kegiatan' | 'Pribadi Terkait Pekerjaan';

export interface AgendaItem {
  id?: string;
  title: string;
  category: AgendaCategory;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm - HH:mm
  startTime?: string;
  endTime?: string;
  location?: string;
  description?: string;
  notes?: string;
  isCompleted: boolean;
  teacherId: string;
  teacherName: string;
  academicYear: string;
  semester: Semester;
  linkedEventId?: string;
  linkedScheduleId?: string;
  attachmentDocumentId?: string;
  attachmentTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export type DeadlineType = 'nilai' | 'rpp' | 'rapor' | 'rapat' | 'umum';
export type ReminderPriority = 'low' | 'medium' | 'high';

export interface ReminderItem {
  id?: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
  targetUserId: string; // specific user ID or 'all' or 'teachers'
  targetUserName?: string;
  isDismissed: boolean;
  priority: ReminderPriority;
  deadlineType?: DeadlineType;
  academicYear?: string;
  semester?: Semester;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface AppNotification {
  id?: string;
  title: string;
  message: string;
  date: string; // ISO String
  type: 'info' | 'warning' | 'reminder' | 'deadline';
  isRead: boolean;
  link?: string;
  targetUserId?: string; // 'all' or specific user
  createdAt: string;
}
