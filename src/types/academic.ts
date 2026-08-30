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
  npsn?: string;
  nsm?: string;
  principalName?: string;
  principalNip?: string;
  academicYear: string;
  semester: Semester;
  logoURL: string;
  address: string;
  phone: string;
  email: string;
  updatedAt: any;
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
  parallel: string; // A, B, C
  homeroomTeacherId: string;
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
  subjectId: string; // Kosong jika guru kelas dan tidak spesifik
  classId: string;
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
