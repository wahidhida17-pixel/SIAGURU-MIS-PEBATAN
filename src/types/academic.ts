export type Semester = 'Ganjil' | 'Genap';
export type ActiveStatus = 'active' | 'inactive';
export type StudentStatus = 'aktif' | 'pindah' | 'lulus' | 'nonaktif';
export type SubjectCategory = 'umum' | 'agama' | 'muatan_lokal' | 'lainnya';
export type AssignmentType = 'guru_kelas' | 'guru_mapel';

export interface AcademicSettings {
  academicYear: string;
  semester: Semester;
  isActive: boolean;
  startDate: any;
  endDate: any;
}

export interface GeneralSettings {
  schoolName: string;
  schoolLevel: string;
  schoolStatus?: 'Negeri' | 'Swasta';
  foundationName?: string;
  npsn?: string;
  nsm?: string;
  nss?: string;
  accreditation?: string;
  accreditationNo?: string;
  curriculum?: string;
  kbcEnabled?: boolean;
  kbcFocusThemes?: string[];
  kbcNotes?: string;

  principalName?: string;
  principalNip?: string;
  principalSignatureURL?: string;
  signaturePlace?: string;
  vicePrincipalName?: string;
  treasurerName?: string;
  committeeHeadName?: string;

  academicYear: string;
  semester: Semester;
  semesterStartDate?: string;
  semesterEndDate?: string;
  reportDateGanjil?: string;
  reportDateGenap?: string;

  logoURL: string;
  logoFoundationURL?: string;
  stampURL?: string;
  appIconURL?: string;
  faviconURL?: string;

  address: string;
  rtRw?: string;
  village?: string;
  district?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  phone: string;
  fax?: string;
  email: string;
  website?: string;

  letterheadLine1?: string;
  letterheadLine2?: string;
  letterheadLine3?: string;
  letterheadLine4?: string;
  showDoubleLine?: boolean;
  autoStampInReports?: boolean;

  updatedAt: any;
  updatedBy?: string;
}

export interface Student {
  id?: string;
  nis: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  birthPlace: string;
  birthDate: string;
  classId: string;
  absentNumber: number;
  fatherName: string;
  motherName: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
  status: StudentStatus;
  photoURL?: string | null;
  createdAt?: any;
  updatedAt?: any;
}

export interface ClassData {
  id?: string;
  name: string; // e.g. "6A"
  gradeLevel: number; // 1-6
  level?: number; // alias for gradeLevel
  parallel: string; // A, B, C
  homeroomTeacherId: string;
  homeroomTeacherName?: string;
  academicYear: string;
  status: ActiveStatus;
  createdAt?: any;
  updatedAt?: any;
}

export type ClassInfo = ClassData;
export type Class = ClassData;
export type TeachingAssignment = Assignment;

export interface Subject {
  id?: string;
  code: string;
  name: string;
  category: SubjectCategory;
  description: string;
  status: ActiveStatus;
  createdAt?: any;
  updatedAt?: any;
}

export interface Assignment {
  id?: string;
  teacherId: string;
  teacherName?: string;
  subjectId: string; // Kosong jika guru kelas dan tidak spesifik
  subjectName?: string;
  classId: string;
  className?: string;
  academicYear: string;
  semester: Semester;
  assignmentType: AssignmentType;
  status: ActiveStatus;
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}

export interface AuditLog {
  id?: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  targetId: string;
  description: string;
  createdAt: any;
}
