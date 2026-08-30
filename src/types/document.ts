import type { Semester } from './academic';

export type DocumentCategory =
  | 'Administrasi Pembelajaran'
  | 'Perencanaan Pembelajaran'
  | 'Penilaian'
  | 'Absensi'
  | 'Jurnal'
  | 'Kelas'
  | 'Surat'
  | 'Kegiatan'
  | 'Kepramukaan'
  | 'Keagamaan'
  | 'Ekstrakurikuler'
  | 'Rapat'
  | 'Lainnya';

export type DocumentFileType =
  | 'pdf'
  | 'doc'
  | 'docx'
  | 'xls'
  | 'xlsx'
  | 'ppt'
  | 'pptx'
  | 'jpg'
  | 'jpeg'
  | 'png'
  | 'webp'
  | 'other';

export type DocumentStatus = 'draft' | 'active' | 'archived' | 'deleted' | 'trash';

export type DocumentVisibility = 'private' | 'class' | 'school';

export interface DocumentVersion {
  version: number;
  fileName: string;
  fileSize: number;
  storagePath: string;
  downloadUrl: string;
  note?: string;
  updatedBy: string;
  updatedByName: string;
  updatedAt: string;
}

export interface DocumentItem {
  id?: string;
  documentId?: string;
  ownerId: string;
  ownerName: string;
  ownerRole?: 'admin' | 'guru';

  title: string;
  description: string;
  category: DocumentCategory | string;

  fileName: string;
  fileType: DocumentFileType | string;
  fileSize: number;
  storagePath: string;
  downloadUrl: string;

  academicYear: string;
  semester?: Semester;

  classId?: string;
  className?: string;
  subjectId?: string;
  subjectName?: string;

  tags: string[];
  isFavorite: boolean;

  status: DocumentStatus;
  visibility: DocumentVisibility;

  sourceModule?: 'modul_ajar' | 'rapor' | 'prota' | 'promes' | 'kktp' | 'atp' | 'rekap_nilai' | 'jurnal' | 'other';
  sourceId?: string;

  version: number;
  versions?: DocumentVersion[];

  deletedAt?: string | null;
  deletedBy?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface DocumentTemplate {
  id?: string;
  title: string;
  category: DocumentCategory | string;
  description: string;
  fileName: string;
  fileType: DocumentFileType | string;
  fileSize: number;
  downloadUrl: string;
  storagePath: string;
  academicYear?: string;
  status?: 'active' | 'inactive';
  isActive?: boolean;
  usageCount?: number;
  isDefault?: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export type LetterType = 'masuk' | 'keluar' | 'tugas' | 'undangan' | 'keterangan' | 'lainnya';
export type LetterStatus = 'draft' | 'sent' | 'received' | 'archived';

export type OfficialLetterType =
  | 'Surat Tugas'
  | 'Surat Keterangan Aktif Mengajar'
  | 'Surat Undangan Rapat'
  | 'Surat Panggilan / Pemberitahuan'
  | 'Surat Keputusan (SK)'
  | 'Surat Rekomendasi'
  | 'Surat Dinas Keluar'
  | 'Surat Masuk'
  | 'Lainnya';

export interface OfficialLetter {
  id?: string;
  letterNumber: string;
  title: string;
  type: OfficialLetterType | string;
  regarding: string;
  letterDate: string;
  signedByName: string;
  signedByNip: string;
  content?: string;
  targetUserId?: string;
  targetUserName?: string;
  attachmentUrl?: string;
  attachmentFileName?: string;
  academicYear: string;
  semester?: Semester;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Letter {
  id?: string;
  letterId?: string;
  type: LetterType;
  number: string;
  date: string;
  subject: string;
  sender: string;
  recipient: string;
  description: string;
  attachmentId?: string;
  attachmentUrl?: string;
  attachmentFileName?: string;
  status: LetterStatus;
  academicYear: string;
  semester?: Semester;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdministrativeChecklistConfig {
  id?: string;
  academicYear: string;
  semester: Semester;
  requiredItems: {
    key: string;
    label: string;
    category: DocumentCategory;
    description: string;
    isMandatory: boolean;
  }[];
  deadlineDate?: string;
  updatedAt: string;
}

export interface TeacherAdministrativeMonitoringRow {
  teacherId: string;
  teacherName: string;
  nip?: string;
  roleType: 'Guru Kelas' | 'Guru Mapel' | 'Guru Mapel Agama';
  classNames: string[];
  subjectNames: string[];
  protaStatus: 'Lengkap' | 'Sebagian' | 'Belum';
  promesStatus: 'Lengkap' | 'Sebagian' | 'Belum';
  atpStatus: 'Lengkap' | 'Sebagian' | 'Belum';
  modulStatus: 'Lengkap' | 'Sebagian' | 'Belum';
  kktpStatus: 'Lengkap' | 'Sebagian' | 'Belum';
  jurnalStatus: 'Lengkap' | 'Sebagian' | 'Belum';
  nilaiStatus: 'Lengkap' | 'Sebagian' | 'Belum';
  totalDocumentsCount: number;
  overallScorePercentage: number;
  score?: number;
}
