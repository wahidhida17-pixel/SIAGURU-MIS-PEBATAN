import type { Semester } from './academic';

export type AssessmentStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface Assessment {
  id?: string;
  title: string;
  type: string; // e.g., "Asesmen Formatif", "Asesmen Sumatif", "Tugas", "Proyek", "Praktik", "PTS", "PAS", "PAT", etc.
  teacherId: string;
  teacherName?: string;
  subjectId: string;
  subjectName?: string;
  classId: string;
  className?: string;
  objectiveIds: string[]; // List of TP IDs
  objectiveCodes?: string[]; // e.g., ["TP-01", "TP-02"]
  date: string; // YYYY-MM-DD
  material: string;
  weight: number; // e.g., 1 or percentage
  maxScore?: number; // default 100
  academicYear: string;
  semester: Semester;
  description?: string;
  status: AssessmentStatus;
  isLocked?: boolean;
  lockedAt?: any;
  lockedBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Grade {
  id?: string;
  assessmentId: string;
  studentId: string;
  studentNis?: string;
  studentName?: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  score: number; // 0 - 100
  note?: string;
  academicYear: string;
  semester: Semester;
  isLocked?: boolean;
  createdAt?: any;
  updatedAt?: any;
  updatedBy?: string;
}

export interface AssessmentCategoryConfig {
  id: string;
  name: string;
  code: string;
  weight: number; // e.g., 20, 30, 50
  description?: string;
}

export interface AssessmentConfig {
  id?: string;
  academicYear: string;
  semester: Semester;
  subjectId?: string; // Optional: specific to subject or global
  classId?: string; // Optional: specific to class or global
  gradingScale?: {
    min: number;
    max: number;
  };
  scaleMin?: number;
  scaleMax?: number;
  passThreshold?: number;
  rounding: '0' | '1' | '2'; // decimal places
  calculationMethod?: 'weighted_average' | 'simple_average' | 'custom';
  categories?: AssessmentCategoryConfig[];
  weightCategories?: {
    formatif?: number;
    sumatifMateri?: number;
    sumatifAkhir?: number;
  };
  customAssessmentTypes?: string[];
  activeAssessmentTypes?: string[];
  status?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface StudentTPDescription {
  tpId: string;
  tpCode: string;
  tpTitle?: string;
  averageScore?: number;
  achievementLevel: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Peningkatan';
  strength?: string;
  improvement?: string;
  customText?: string;
}

export interface StudentDescription {
  id?: string;
  studentId: string;
  studentName?: string;
  studentNis?: string;
  classId: string;
  className?: string;
  subjectId: string;
  subjectName?: string;
  teacherId: string;
  academicYear: string;
  semester: Semester;
  tpDescriptions: StudentTPDescription[];
  highestScoreTp?: string;
  lowestScoreTp?: string;
  strengthsText: string;
  improvementsText: string;
  finalDescription: string;
  status: 'draft' | 'completed';
  createdAt?: any;
  updatedAt?: any;
}

export type FollowUpType = 'Remedial' | 'Pengayaan' | 'Pendampingan' | 'Latihan tambahan' | 'Lainnya';

export interface AssessmentFollowUp {
  id?: string;
  studentId: string;
  studentName?: string;
  studentNis?: string;
  teacherId: string;
  teacherName?: string;
  subjectId: string;
  subjectName?: string;
  classId: string;
  className?: string;
  objectiveId?: string;
  objectiveCode?: string;
  objectiveTitle?: string;
  assessmentId?: string;
  assessmentTitle?: string;
  type: FollowUpType;
  date: string;
  initialScore?: number;
  finalScore?: number;
  description: string;
  result: string;
  academicYear: string;
  semester: Semester;
  createdAt?: any;
  updatedAt?: any;
}

export interface FinalScore {
  id?: string;
  studentId: string;
  studentName?: string;
  studentNis?: string;
  classId: string;
  className?: string;
  subjectId: string;
  subjectName?: string;
  teacherId: string;
  academicYear: string;
  semester: Semester;
  categoryAverages: { [categoryIdOrType: string]: number };
  formatifAverage?: number;
  sumatifAverage?: number;
  tugasAverage?: number;
  ptsScore?: number;
  pasScore?: number;
  finalScore: number;
  finalScoreRounded: number;
  predicate?: string;
  isLocked?: boolean;
  updatedAt?: any;
}

export interface TeacherAssessmentProgress {
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  academicYear: string;
  semester: Semester;
  assessmentCount: number;
  totalStudents: number;
  gradesEntered: number;
  gradesExpected: number;
  completionPercentage: number;
  percentage?: number; // alias for completionPercentage
  isLocked: boolean;
  isComplete?: boolean;
  status: 'Belum dimulai' | 'Draft' | 'Sedang diisi' | 'Lengkap' | 'Dikunci';
}
