import type { Semester } from './academic';

export type ReportPeriodStatus = 'draft' | 'open' | 'review' | 'locked' | 'published' | 'archived';
export type ReportStatus = 'Draft' | 'Perlu Diperiksa' | 'Lengkap' | 'Dikunci' | 'Diterbitkan' | 'Diarsipkan';
export type PromotionRecommendation = 'Belum ditentukan' | 'Direkomendasikan naik' | 'Direkomendasikan mengulang' | 'Ditentukan sekolah';
export type PromotionDecision = 'Naik ke Kelas' | 'Tinggal di Kelas' | 'Lulus' | 'Tidak Lulus' | 'Ditentukan sekolah';

export interface ReportPeriod {
  id?: string;
  academicYear: string;
  semester: Semester;
  reportType: 'Rapor Semester' | 'Rapor Tengah Semester' | 'Rapor Akhir';
  title?: string;
  startDate: string; // YYYY-MM-DD for attendance calculation
  endDate: string; // YYYY-MM-DD for attendance calculation
  reportDate: string; // YYYY-MM-DD
  placeDate: string; // e.g. "Pebatan, 20 Desember 2026"
  status: ReportPeriodStatus;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface ReportSubjectItem {
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  category?: 'Wajib' | 'Pilihan' | 'Muatan Lokal' | 'Agama';
  teacherId?: string;
  teacherName?: string;
  finalScore: number;
  scoreLetter?: string;
  description: string;
  hasDescription: boolean;
  kktp?: number;
  order?: number;
}

export interface ReportAttendanceData {
  sakit: number;
  izin: number;
  alpa: number;
  hadir?: number;
  totalDays?: number;
  isComplete: boolean;
}

export interface ReportExtracurricularItem {
  id?: string;
  activity: string;
  result: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang';
  description: string;
}

export interface ReportAchievementItem {
  id?: string;
  name: string;
  level: 'Sekolah' | 'Kecamatan' | 'Kabupaten' | 'Provinsi' | 'Nasional' | 'Internasional' | 'Lainnya';
  type: 'Akademik' | 'Keagamaan' | 'Seni & Budaya' | 'Olahraga' | 'Lainnya';
  year: string;
  description?: string;
}

export interface StudentGrowthAspects {
  attitude?: string;
  discipline?: string;
  responsibility?: string;
  activeness?: string;
  generalGrowthNote?: string;
}

export interface PromotionStatusData {
  status: PromotionRecommendation;
  recommendationNote?: string;
  decision?: PromotionDecision;
  nextClassId?: string;
  nextClassName?: string;
  decisionNote?: string;
  decidedBy?: string;
  decidedAt?: string;
}

export interface Report {
  id?: string;
  studentId: string;
  studentNis: string;
  studentNisn?: string;
  studentName: string;
  classId: string;
  className: string;
  homeroomTeacherId: string;
  homeroomTeacherName?: string;
  academicYear: string;
  semester: Semester;
  periodId: string;
  reportNumber?: string;
  
  status: ReportStatus;
  isLocked: boolean;
  lockedAt?: any;
  lockedBy?: string;

  subjects: ReportSubjectItem[];
  attendance: ReportAttendanceData;
  extracurriculars: ReportExtracurricularItem[];
  achievements: ReportAchievementItem[];
  homeroomNote: string;
  studentGrowth?: StudentGrowthAspects;
  promotionStatus?: PromotionStatusData;

  createdAt?: any;
  updatedAt?: any;
  generatedAt?: string;
}

export interface ReportExtracurricularRecord {
  id?: string;
  reportId: string;
  studentId: string;
  activity: string;
  result: string;
  description: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface ReportAchievementRecord {
  id?: string;
  reportId: string;
  studentId: string;
  name: string;
  level: string;
  type: string;
  year: string;
  description?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface ReportNoteRecord {
  id?: string;
  reportId: string;
  studentId: string;
  homeroomNote: string;
  growthAspects?: StudentGrowthAspects;
  createdAt?: any;
  updatedAt?: any;
}

export interface ReportArchive {
  id?: string;
  reportId: string;
  studentId: string;
  studentName: string;
  studentNis: string;
  classId: string;
  className: string;
  academicYear: string;
  semester: Semester;
  periodId: string;
  snapshotData: Report;
  archivedAt: string;
  archivedBy: string;
}

export interface GradeChangeRequest {
  id?: string;
  reportId?: string;
  gradeId?: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  academicYear: string;
  semester: Semester;
  oldValue: number;
  proposedValue: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt?: any;
}

export interface ReportTemplateConfig {
  id: string;
  name: string;
  description: string;
  layout: 'standard' | 'compact' | 'extended';
  showRank: boolean;
  showKktp: boolean;
  showGrowth: boolean;
  showExtracurriculars: boolean;
  showAchievements: boolean;
  headerStyle: 'madrasah_standard' | 'ministry_kemenag' | 'clean';
}

export interface ReportSystemSettings {
  defaultTemplateId: string;
  reportNumberFormat: string; // e.g. "MI-SYR/{YEAR}/{SEM}/{NIS}"
  enableRanking: boolean; // default false
  showKktpColumn: boolean;
  requireHomeroomNoteToLock: boolean;
  requireExtracurricularToLock: boolean;
  signatureCity: string;
}
