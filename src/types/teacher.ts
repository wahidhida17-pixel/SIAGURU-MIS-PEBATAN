export type TeacherType = 'guru_kelas' | 'guru_mapel' | 'guru_agama';
export type TeacherStatus = 'active' | 'inactive';

export interface Teacher {
  id: string;
  userId: string | null;
  teacherCode: string;
  nip: string;
  nuptk: string;
  name: string;
  email: string;
  phone: string;
  gender: 'L' | 'P';
  teacherType: TeacherType;
  employmentStatus?: string;
  status: TeacherStatus;
  photoURL: string | null;
  createdAt: any;
  updatedAt: any;
}
