import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type { TeacherAdministrativeMonitoringRow, AdministrativeChecklistConfig } from '../types/document';
import type { Semester } from '../types/academic';
import { teacherService } from './teacherService';
import { classService } from './classService';
import { subjectService } from './subjectService';
import { assignmentService } from './assignmentService';
import { learningService } from './learningService';
import { journalService } from './journalService';
import { assessmentService } from './assessmentService';
import { documentService } from './documentService';

export type TeacherAdminChecklist = TeacherAdministrativeMonitoringRow & {
  score: number;
};

export const checklistService = {
  async getChecklistConfig(academicYear: string, semester: Semester): Promise<AdministrativeChecklistConfig> {
    try {
      const docId = `config_${academicYear.replace('/', '_')}_${semester}`;
      const snap = await getDoc(doc(db, 'administrativeChecklists', docId));
      if (snap.exists()) {
        return snap.data() as AdministrativeChecklistConfig;
      }
    } catch (e) {
      console.warn('Using default checklist config:', e);
    }

    return {
      academicYear,
      semester,
      requiredItems: [
        { key: 'prota', label: 'Program Tahunan (PROTA)', category: 'Perencanaan Pembelajaran', description: 'Pemetaan capaian tahunan', isMandatory: true },
        { key: 'promes', label: 'Program Semester (PROMES)', category: 'Perencanaan Pembelajaran', description: 'Alokasi pekan efektif', isMandatory: true },
        { key: 'atp', label: 'Alur Tujuan Pembelajaran (ATP)', category: 'Perencanaan Pembelajaran', description: 'Alur TP per fase', isMandatory: true },
        { key: 'modul', label: 'Modul Ajar / RPP', category: 'Perencanaan Pembelajaran', description: 'Perangkat ajar kelas', isMandatory: true },
        { key: 'kktp', label: 'Kriteria Ketercapaian TP (KKTP)', category: 'Perencanaan Pembelajaran', description: 'Kriteria ketuntasan', isMandatory: true },
        { key: 'jurnal', label: 'Jurnal Mengajar Mingguan', category: 'Jurnal', description: 'Catatan KBM harian', isMandatory: true },
        { key: 'nilai', label: 'Rekap Penilaian & Asesmen', category: 'Penilaian', description: 'Input nilai sumatif/formatif', isMandatory: true }
      ],
      deadlineDate: '2026-09-15',
      updatedAt: new Date().toISOString()
    };
  },

  async saveChecklistConfig(config: AdministrativeChecklistConfig): Promise<void> {
    const docId = `config_${config.academicYear.replace('/', '_')}_${config.semester}`;
    await setDoc(doc(db, 'administrativeChecklists', docId), {
      ...config,
      updatedAt: new Date().toISOString()
    });
  },

  async getTeacherAdministrationMonitoring(
    academicYear: string,
    semester: Semester
  ): Promise<TeacherAdministrativeMonitoringRow[]> {
    try {
      const [teachers, classes, subjects, assignments, allDocs, journals, assessments] = await Promise.all([
        teacherService.getAll(),
        classService.getAll(),
        subjectService.getAll(),
        assignmentService.getAll(),
        documentService.getDocuments({ academicYear, semester, status: 'active' }),
        journalService.getAll(),
        assessmentService.getAssessments({ academicYear, semester })
      ]);

      const classMap = new Map(classes.map(c => [c.id!, c]));
      const subjectMap = new Map(subjects.map(s => [s.id!, s]));

      const rows: TeacherAdministrativeMonitoringRow[] = [];

      for (const teacher of teachers) {
        if (!teacher.id) continue;
        const teacherId = teacher.id;

        // Determine teacher assignments
        const teacherAssigns = assignments.filter(
          a => a.teacherId === teacherId && a.academicYear === academicYear && a.semester === semester
        );

        const assignedClassNames = Array.from(
          new Set(
            teacherAssigns
              .map(a => classMap.get(a.classId)?.name)
              .filter(Boolean) as string[]
          )
        );

        const assignedSubjectNames = Array.from(
          new Set(
            teacherAssigns
              .map(a => subjectMap.get(a.subjectId)?.name)
              .filter(Boolean) as string[]
          )
        );

        // Determine Role Type: Guru Kelas, Guru Mapel, Guru Mapel Agama
        let roleType: 'Guru Kelas' | 'Guru Mapel' | 'Guru Mapel Agama' = 'Guru Mapel';
        const isHomeroom = classes.some(c => c.homeroomTeacherId === teacherId);
        const teachesAgama = assignedSubjectNames.some(name =>
          /qur'?an|hadits|akidah|akhlak|fikih|fiqih|ski|sejarah kebudayaan islam|bahasa arab/i.test(name)
        );

        if (teachesAgama) {
          roleType = 'Guru Mapel Agama';
        } else if (isHomeroom) {
          roleType = 'Guru Kelas';
        } else {
          roleType = 'Guru Mapel';
        }

        // Count teacher uploaded documents
        const myDocs = allDocs.filter(d => d.ownerId === teacherId);
        const myJournals = journals.filter(
          j => j.teacherId === teacherId && j.academicYear === academicYear && j.semester === semester
        );
        const myAssessments = assessments.filter(a => a.teacherId === teacherId);

        // Check each criterion
        const hasProtaDoc = myDocs.some(
          d => /prota|program tahunan/i.test(d.title) || /prota|program tahunan/i.test(d.category)
        );
        const protaStatus = hasProtaDoc ? 'Lengkap' : teacherAssigns.length > 0 ? 'Sebagian' : 'Belum';

        const hasPromesDoc = myDocs.some(
          d => /promes|program semester/i.test(d.title) || /promes|program semester/i.test(d.category)
        );
        const promesStatus = hasPromesDoc ? 'Lengkap' : teacherAssigns.length > 0 ? 'Sebagian' : 'Belum';

        const hasAtpDoc = myDocs.some(
          d => /atp|alur tujuan/i.test(d.title) || d.sourceModule === 'atp'
        );
        const atpStatus = hasAtpDoc ? 'Lengkap' : teacherAssigns.length > 0 ? 'Sebagian' : 'Belum';

        const hasModulDoc = myDocs.some(
          d => /modul ajar|rpp/i.test(d.title) || d.sourceModule === 'modul_ajar'
        );
        const modulStatus = hasModulDoc ? 'Lengkap' : teacherAssigns.length > 0 ? 'Sebagian' : 'Belum';

        const hasKktpDoc = myDocs.some(
          d => /kktp|kriteria ketercapaian/i.test(d.title) || d.sourceModule === 'kktp'
        );
        const kktpStatus = hasKktpDoc ? 'Lengkap' : teacherAssigns.length > 0 ? 'Sebagian' : 'Belum';

        const jurnalStatus = myJournals.length >= 8 ? 'Lengkap' : myJournals.length > 0 ? 'Sebagian' : 'Belum';
        const nilaiStatus = myAssessments.length >= 2 ? 'Lengkap' : myAssessments.length > 0 ? 'Sebagian' : 'Belum';

        // Calculate score
        const statuses = [protaStatus, promesStatus, atpStatus, modulStatus, kktpStatus, jurnalStatus, nilaiStatus];
        const lengkapCount = statuses.filter(s => s === 'Lengkap').length;
        const sebagianCount = statuses.filter(s => s === 'Sebagian').length;
        const overallScorePercentage = Math.round(((lengkapCount * 100 + sebagianCount * 50) / (statuses.length * 100)) * 100);

        rows.push({
          teacherId,
          teacherName: teacher.name,
          nip: teacher.nip || '-',
          roleType,
          classNames: assignedClassNames.length > 0 ? assignedClassNames : ['-'],
          subjectNames: assignedSubjectNames.length > 0 ? assignedSubjectNames : ['-'],
          protaStatus,
          promesStatus,
          atpStatus,
          modulStatus,
          kktpStatus,
          jurnalStatus,
          nilaiStatus,
          totalDocumentsCount: myDocs.length,
          overallScorePercentage,
          score: overallScorePercentage
        });
      }

      // Sort by score descending
      rows.sort((a, b) => b.overallScorePercentage - a.overallScorePercentage);

      return rows as TeacherAdminChecklist[];
    } catch (error) {
      console.error('Error fetching teacher administrative monitoring:', error);
      return [];
    }
  },

  async getTeachersChecklist(academicYear: string, semester: Semester): Promise<TeacherAdminChecklist[]> {
    return this.getTeacherAdministrationMonitoring(academicYear, semester) as Promise<TeacherAdminChecklist[]>;
  }
};
