import type { Semester } from './academic';

export type DocStatus = 'draft' | 'completed' | 'archived';
export type TemplateType = 'ringkas' | 'lengkap' | 'madrasah';

export interface LearningPlan {
  id?: string;
  teacherId: string;
  teacherName?: string;
  subjectId: string;
  subjectName?: string;
  classId?: string | null;
  className?: string;
  phase: string; // e.g. "Fase A", "Fase B", "Fase C"
  gradeLevel?: number; // 1-6
  academicYear: string;
  semester?: Semester;
  elements: { name: string; description: string }[];
  description: string;
  source: string; // e.g., "Keputusan BSKAP No. 033/H/KR/2022 / Kemenag"
  status: DocStatus;
  version: number;
  createdAt?: any;
  updatedAt?: any;
  updatedBy?: string;
}

export interface LearningObjective {
  id?: string;
  cpId: string;
  teacherId: string;
  teacherName?: string;
  subjectId: string;
  subjectName?: string;
  classId?: string | null;
  className?: string;
  phase: string;
  code: string; // e.g., "TP-01"
  title: string;
  description: string;
  competency?: string;
  scope?: string;
  sequence: number;
  allocationHours: number; // JP
  academicYear: string;
  semester: Semester;
  status: DocStatus;
  version: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface ATPItem {
  tpId?: string;
  tpCode: string;
  tpTitle?: string;
  sequence?: number;
  material?: string;
  materialScope?: string;
  chapterTitle?: string;
  semester?: Semester;
  allocationHours: number; // JP
  activities?: string;
  assessment?: string;
  assessmentMethod?: string;
  learningResources?: string;
  p5ppra?: string[];
  notes?: string;
}

export interface ATP {
  id?: string;
  teacherId: string;
  teacherName?: string;
  subjectId: string;
  subjectName?: string;
  classId?: string | null;
  className?: string;
  phase: string;
  academicYear: string;
  semester: Semester;
  totalHours: number;
  items: ATPItem[];
  notes?: string;
  status: DocStatus;
  version: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface ProtaItem {
  sequence?: number;
  tpId?: string;
  tpCode?: string;
  chapterTitle?: string;
  material?: string;
  materialScope?: string;
  semester: Semester;
  allocationHours: number;
  notes?: string;
}

export interface Prota {
  id?: string;
  teacherId: string;
  teacherName?: string;
  subjectId: string;
  subjectName?: string;
  classId?: string | null;
  className?: string;
  phase: string;
  academicYear: string;
  totalHoursGanjil?: number;
  totalHoursGenap?: number;
  totalHours: number;
  items: ProtaItem[];
  notes?: string;
  status: DocStatus;
  version: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface PromesItem {
  sequence?: number;
  tpId?: string;
  tpCode?: string;
  material?: string;
  materialScope?: string;
  allocationHours: number;
  // Weekly map e.g. { "Juli_1": 4, "Juli_2": 4 }
  weeklySchedule?: { [weekKey: string]: number };
  distribution?: { [month: string]: number[] };
  notes?: string;
}

export interface Promes {
  id?: string;
  teacherId: string;
  teacherName?: string;
  subjectId: string;
  subjectName?: string;
  classId?: string | null;
  className?: string;
  phase: string;
  academicYear: string;
  semester: Semester;
  months: string[]; // List bulan sesuai semester (misal: Juli-Desember atau Januari-Juni)
  totalHours: number;
  items: PromesItem[];
  notes?: string;
  status: DocStatus;
  version: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface ModuleAjar {
  id?: string;
  teacherId: string;
  teacherName?: string;
  subjectId: string;
  subjectName?: string;
  classId: string;
  className?: string;
  academicYear: string;
  semester: Semester;
  title: string;
  phase: string;
  duration?: string; // e.g., "2 JP (2 x 35 Menit)"
  meetingCount?: number;
  templateType?: TemplateType;

  // Informasi Umum
  initialCompetence?: string;
  pancasilaProfiles?: string[];
  p5ppra?: string[]; // Profil Pelajar Pancasila & Rahmatan Lil Alamin
  facilities?: string; // Sarana & Prasarana
  targetStudents?: string; // Target Peserta Didik
  learningModel?: string; // Model Pembelajaran (PBL, Discovery Learning, dsb)
  methods?: string[]; // Ceramah, Diskusi, Tanya Jawab, dsb

  // Komponen Inti
  atpId?: string;
  cpId?: string;
  tpIds?: string[];
  cpText?: string;
  tpText?: string;
  material?: string;
  meaningfulUnderstanding?: string; // Pemahaman Bermakna
  triggerQuestions?: string; // Pertanyaan Pemantik

  // Kegiatan Pembelajaran
  openingActivity?: string; // Pendahuluan
  coreActivity?: string; // Inti
  closingActivity?: string; // Penutup

  // Asesmen & Tindak Lanjut
  diagnosticAssessment?: string;
  formativeAssessment?: string;
  summativeAssessment?: string;
  assessment?: string; // Rangkuman asesmen
  enrichment?: string; // Pengayaan
  remediation?: string; // Remedial

  // Refleksi
  teacherReflection?: string;
  studentReflection?: string;

  // Meta
  status: DocStatus;
  version: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface KKTPItem {
  tpId?: string;
  tpCode: string;
  tpTitle: string;
  indicator?: string;
  criteria?: string;
  description?: string;
  interval0_60?: string;
  interval61_75?: string;
  interval76_85?: string;
  interval86_100?: string;
  notes?: string;
}

export interface KKTP {
  id?: string;
  teacherId: string;
  teacherName?: string;
  subjectId: string;
  subjectName?: string;
  classId?: string | null;
  className?: string;
  phase: string;
  academicYear: string;
  semester: Semester;
  items: KKTPItem[];
  notes?: string;
  status: DocStatus;
  version: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface AcademicCalendarMonth {
  monthName: string;
  effectiveWeeks: number;
  effectiveDays: number;
  holidayDays: number;
  notes: string;
}

export interface AcademicCalendar {
  id?: string;
  academicYear: string;
  semester: Semester;
  months: AcademicCalendarMonth[];
  events: { date: string; title: string; type: 'libur' | 'kegiatan' | 'ujian' | 'asesmen' }[];
  totalEffectiveWeeks: number;
  totalEffectiveDays: number;
  updatedAt?: any;
}

export interface DocumentTemplate {
  id?: string;
  type: 'cp' | 'tp' | 'atp' | 'prota' | 'promes' | 'module' | 'kktp';
  title?: string;
  name?: string;
  description: string;
  phase?: string;
  subjectCategory?: string;
  content?: any;
  isPublic?: boolean;
  isActive?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface TeacherAdministrationChecklist {
  assignmentId: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  academicYear: string;
  semester: Semester;
  hasCP: boolean;
  hasTP: boolean;
  hasATP: boolean;
  hasProta: boolean;
  hasPromes: boolean;
  hasModule: boolean;
  hasKKTP: boolean;
  completionPercentage: number;
}
