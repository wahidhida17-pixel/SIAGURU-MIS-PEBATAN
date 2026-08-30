import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, setDoc, writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type { 
  Assessment, Grade, AssessmentConfig, StudentDescription, 
  AssessmentFollowUp, FinalScore, TeacherAssessmentProgress 
} from '../types/assessment';
import type { Semester } from '../types/academic';
import { auditService } from './auditService';
import { assignmentService } from './assignmentService';
import { studentService } from './studentService';
import { subjectService } from './subjectService';
import { classService } from './classService';
import { teacherService } from './teacherService';

export const DEFAULT_ASSESSMENT_TYPES = [
  'Asesmen Formatif',
  'Asesmen Sumatif',
  'Asesmen Diagnostik',
  'Tugas Harian',
  'Proyek (P5-PPRA)',
  'Praktik / Unjuk Kerja',
  'Portofolio',
  'Penilaian Tengah Semester (PTS)',
  'Penilaian Akhir Semester (PAS)',
  'Penilaian Akhir Tahun (PAT)',
  'Ujian Madrasah',
  'Lainnya'
];

export const DEFAULT_ASSESSMENT_CONFIG: AssessmentConfig = {
  academicYear: '2026/2027',
  semester: 'Ganjil',
  gradingScale: { min: 0, max: 100 },
  rounding: '1',
  calculationMethod: 'weighted_average',
  categories: [
    { id: 'cat_tugas', name: 'Tugas / Praktik', code: 'TUGAS', weight: 20, description: 'Rata-rata tugas dan unjuk kerja' },
    { id: 'cat_formatif', name: 'Asesmen Formatif', code: 'FORMATIF', weight: 30, description: 'Formatif per lingkup materi' },
    { id: 'cat_sumatif', name: 'Asesmen Sumatif', code: 'SUMATIF', weight: 30, description: 'Sumatif akhir materi / TP' },
    { id: 'cat_pas', name: 'PTS / PAS / PAT', code: 'PAS', weight: 20, description: 'Asesmen tengah dan akhir semester' }
  ],
  customAssessmentTypes: DEFAULT_ASSESSMENT_TYPES,
  status: 'active'
};

export const assessmentService = {
  // ==========================================
  // 1. ASSESSMENTS CRUD
  // ==========================================
  async getAssessments(filters?: {
    teacherId?: string;
    subjectId?: string;
    classId?: string;
    academicYear?: string;
    semester?: Semester;
    status?: string;
  }): Promise<Assessment[]> {
    try {
      let q = query(collection(db, 'assessments'));
      if (filters?.teacherId) {
        q = query(collection(db, 'assessments'), where('teacherId', '==', filters.teacherId));
      }
      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Assessment));

      if (filters?.subjectId && filters.subjectId !== 'all') {
        results = results.filter(r => r.subjectId === filters.subjectId);
      }
      if (filters?.classId && filters.classId !== 'all') {
        results = results.filter(r => r.classId === filters.classId);
      }
      if (filters?.academicYear) {
        results = results.filter(r => r.academicYear === filters.academicYear);
      }
      if (filters?.semester) {
        results = results.filter(r => r.semester === filters.semester);
      }
      if (filters?.status && filters.status !== 'all') {
        results = results.filter(r => r.status === filters.status);
      }
      return results.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } catch (err) {
      console.warn('Error fetching assessments:', err);
      return [];
    }
  },

  async getAssessmentById(id: string): Promise<Assessment | null> {
    try {
      const docRef = doc(db, 'assessments', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Assessment;
    } catch (err) {
      console.warn('Error fetching assessment by id:', err);
      return null;
    }
  },

  async createAssessment(
    data: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>,
    userContext?: { uid: string; name: string }
  ): Promise<string> {
    const docRef = await addDoc(collection(db, 'assessments'), {
      ...data,
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    if (userContext) {
      await auditService.log(
        userContext.uid,
        userContext.name,
        'CREATE_ASSESSMENT',
        'Penilaian',
        docRef.id,
        `Membuat asesmen "${data.title}" untuk kelas ${data.className || data.classId} mapel ${data.subjectName || data.subjectId}`
      );
    }

    return docRef.id;
  },

  async updateAssessment(
    id: string,
    data: Partial<Assessment>,
    userContext?: { uid: string; name: string }
  ): Promise<void> {
    const docRef = doc(db, 'assessments', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });

    if (userContext) {
      await auditService.log(
        userContext.uid,
        userContext.name,
        'UPDATE_ASSESSMENT',
        'Penilaian',
        id,
        `Memperbarui asesmen "${data.title || id}"`
      );
    }
  },

  async deleteAssessment(id: string, userContext?: { uid: string; name: string }): Promise<void> {
    // Delete associated grades
    const gradesQ = query(collection(db, 'grades'), where('assessmentId', '==', id));
    const gradesSnap = await getDocs(gradesQ);
    const batch = writeBatch(db);
    gradesSnap.docs.forEach(d => {
      batch.delete(d.ref);
    });
    batch.delete(doc(db, 'assessments', id));
    await batch.commit();

    if (userContext) {
      await auditService.log(
        userContext.uid,
        userContext.name,
        'DELETE_ASSESSMENT',
        'Penilaian',
        id,
        `Menghapus asesmen ID ${id} beserta seluruh nilai siswa di dalamnya`
      );
    }
  },

  async toggleLockAssessment(
    id: string,
    isLocked: boolean,
    userContext: { uid: string; name: string }
  ): Promise<void> {
    const docRef = doc(db, 'assessments', id);
    await updateDoc(docRef, {
      isLocked,
      lockedAt: isLocked ? new Date().toISOString() : null,
      lockedBy: isLocked ? userContext.name : null,
      updatedAt: new Date().toISOString()
    });

    // Also update lock status on grades
    const gradesQ = query(collection(db, 'grades'), where('assessmentId', '==', id));
    const gradesSnap = await getDocs(gradesQ);
    const batch = writeBatch(db);
    gradesSnap.docs.forEach(d => {
      batch.update(d.ref, { isLocked });
    });
    await batch.commit();

    await auditService.log(
      userContext.uid,
      userContext.name,
      isLocked ? 'LOCK_ASSESSMENT' : 'UNLOCK_ASSESSMENT',
      'Penilaian',
      id,
      `${isLocked ? 'Mengunci' : 'Membuka kunci'} asesmen ID ${id}`
    );
  },

  // ==========================================
  // 2. GRADES MANAGEMENT
  // ==========================================
  async getGradesByAssessment(assessmentId: string): Promise<Grade[]> {
    const q = query(collection(db, 'grades'), where('assessmentId', '==', assessmentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Grade));
  },

  async getGradesByStudent(studentId: string, academicYear?: string, semester?: Semester): Promise<Grade[]> {
    let q = query(collection(db, 'grades'), where('studentId', '==', studentId));
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Grade));
    if (academicYear) {
      results = results.filter(r => r.academicYear === academicYear);
    }
    if (semester) {
      results = results.filter(r => r.semester === semester);
    }
    return results;
  },

  async getGradesByClassSubject(
    classId: string,
    subjectId: string,
    academicYear: string,
    semester: Semester
  ): Promise<Grade[]> {
    const q = query(
      collection(db, 'grades'),
      where('classId', '==', classId),
      where('subjectId', '==', subjectId)
    );
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Grade));
    return results.filter(r => r.academicYear === academicYear && r.semester === semester);
  },

  async saveSingleGrade(
    gradeData: Omit<Grade, 'id' | 'createdAt' | 'updatedAt'>,
    userContext?: { uid: string; name: string }
  ): Promise<void> {
    // Unique deterministic document ID: `${assessmentId}_${studentId}`
    const docId = `${gradeData.assessmentId}_${gradeData.studentId}`;
    const docRef = doc(db, 'grades', docId);

    await setDoc(docRef, {
      ...gradeData,
      updatedAt: new Date().toISOString(),
      updatedBy: userContext?.name || gradeData.teacherId
    }, { merge: true });
  },

  async saveGradesBatch(
    grades: Array<Omit<Grade, 'id' | 'createdAt' | 'updatedAt'>>,
    userContext?: { uid: string; name: string },
    isBulkImport: boolean = false
  ): Promise<void> {
    if (grades.length === 0) return;

    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (const g of grades) {
      const docId = `${g.assessmentId}_${g.studentId}`;
      const docRef = doc(db, 'grades', docId);
      batch.set(docRef, {
        ...g,
        updatedAt: now,
        updatedBy: userContext?.name || g.teacherId
      }, { merge: true });
    }

    await batch.commit();

    if (userContext) {
      await auditService.log(
        userContext.uid,
        userContext.name,
        isBulkImport ? 'IMPORT_GRADES' : 'SAVE_GRADES_BATCH',
        'Penilaian',
        grades[0]?.assessmentId || 'batch',
        `${isBulkImport ? 'Import Excel' : 'Menyimpan'} ${grades.length} nilai siswa untuk asesmen ${grades[0]?.assessmentId}`
      );
    }
  },

  async lockGradesBatch(
    classId: string,
    subjectId: string,
    academicYear: string,
    semester: Semester,
    isLocked: boolean,
    userContext: { uid: string; name: string }
  ): Promise<void> {
    // Lock all assessments matching this class & subject
    const assessQ = query(
      collection(db, 'assessments'),
      where('classId', '==', classId),
      where('subjectId', '==', subjectId)
    );
    const assessSnap = await getDocs(assessQ);
    const batch = writeBatch(db);

    assessSnap.docs.forEach(d => {
      const assessData = d.data() as Assessment;
      if (assessData.academicYear === academicYear && assessData.semester === semester) {
        batch.update(d.ref, {
          isLocked,
          lockedAt: isLocked ? new Date().toISOString() : null,
          lockedBy: isLocked ? userContext.name : null
        });
      }
    });

    // Also lock all grades
    const gradesQ = query(
      collection(db, 'grades'),
      where('classId', '==', classId),
      where('subjectId', '==', subjectId)
    );
    const gradesSnap = await getDocs(gradesQ);
    gradesSnap.docs.forEach(d => {
      const g = d.data() as Grade;
      if (g.academicYear === academicYear && g.semester === semester) {
        batch.update(d.ref, { isLocked });
      }
    });

    await batch.commit();

    await auditService.log(
      userContext.uid,
      userContext.name,
      isLocked ? 'LOCK_CLASS_SUBJECT_GRADES' : 'UNLOCK_CLASS_SUBJECT_GRADES',
      'Penilaian',
      `${classId}_${subjectId}`,
      `${isLocked ? 'Mengunci' : 'Membuka kunci'} seluruh nilai kelas ${classId} mapel ${subjectId} (${academicYear} - ${semester})`
    );
  },

  // ==========================================
  // 3. ASSESSMENT CONFIG
  // ==========================================
  async getAssessmentConfig(academicYear: string, semester: Semester): Promise<AssessmentConfig> {
    const q = query(
      collection(db, 'assessmentConfigs'),
      where('academicYear', '==', academicYear),
      where('semester', '==', semester)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const first = snapshot.docs[0];
      return { id: first.id, ...first.data() } as AssessmentConfig;
    }
    return DEFAULT_ASSESSMENT_CONFIG;
  },

  async saveAssessmentConfig(
    config: Omit<AssessmentConfig, 'id' | 'createdAt' | 'updatedAt'>,
    userContext?: { uid: string; name: string }
  ): Promise<string> {
    const docId = `config_${config.academicYear.replace('/', '_')}_${config.semester}`;
    const docRef = doc(db, 'assessmentConfigs', docId);

    await setDoc(docRef, {
      ...config,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    if (userContext) {
      await auditService.log(
        userContext.uid,
        userContext.name,
        'UPDATE_ASSESSMENT_CONFIG',
        'Penilaian',
        docId,
        `Memperbarui konfigurasi penilaian, skala ${config.gradingScale.min}-${config.gradingScale.max}, pembulatan ${config.rounding} desimal`
      );
    }

    return docId;
  },

  // ==========================================
  // 4. STUDENT DESCRIPTIONS (CAPAIAN PEMBELAJARAN)
  // ==========================================
  async getStudentDescriptions(filters: {
    classId: string;
    subjectId: string;
    academicYear: string;
    semester: Semester;
  }): Promise<StudentDescription[]> {
    const q = query(
      collection(db, 'studentDescriptions'),
      where('classId', '==', filters.classId),
      where('subjectId', '==', filters.subjectId)
    );
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StudentDescription));
    return results.filter(r => r.academicYear === filters.academicYear && r.semester === filters.semester);
  },

  async getStudentDescription(
    studentId: string,
    subjectId: string,
    academicYear: string,
    semester: Semester
  ): Promise<StudentDescription | null> {
    const docId = `${studentId}_${subjectId}_${academicYear.replace('/', '_')}_${semester}`;
    const docRef = doc(db, 'studentDescriptions', docId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as StudentDescription;
  },

  async saveStudentDescription(
    data: Omit<StudentDescription, 'id' | 'createdAt' | 'updatedAt'>,
    userContext?: { uid: string; name: string }
  ): Promise<void> {
    const docId = `${data.studentId}_${data.subjectId}_${data.academicYear.replace('/', '_')}_${data.semester}`;
    const docRef = doc(db, 'studentDescriptions', docId);

    await setDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    if (userContext) {
      await auditService.log(
        userContext.uid,
        userContext.name,
        'SAVE_STUDENT_DESCRIPTION',
        'Penilaian',
        docId,
        `Menyimpan deskripsi capaian pembelajaran siswa ${data.studentName || data.studentId}`
      );
    }
  },

  /**
   * Generator deskripsi capaian berbasis data nilai TP & asesmen.
   * Menggunakan prinsip pedagogis positif tanpa label merendahkan / negatif.
   */
  generateDataDrivenDescription(
    studentName: string,
    tpScores: Array<{ tpCode: string; tpTitle: string; averageScore: number }>
  ): {
    highestScoreTp?: string;
    lowestScoreTp?: string;
    strengthsText: string;
    improvementsText: string;
    finalDescription: string;
  } {
    if (tpScores.length === 0) {
      return {
        strengthsText: 'Menunjukkan partisipasi aktif dalam kegiatan pembelajaran.',
        improvementsText: 'Perlu terus mempertahankan motivasi belajar.',
        finalDescription: `Ananda ${studentName} menunjukkan partisipasi aktif dalam kegiatan pembelajaran dan perlu terus mempertahankan motivasi belajarnya.`
      };
    }

    // Sort by averageScore descending
    const sorted = [...tpScores].sort((a, b) => b.averageScore - a.averageScore);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];

    let strengths = '';
    if (highest && highest.averageScore >= 80) {
      strengths = `menunjukkan penguasaan yang sangat baik dalam ${highest.tpTitle.toLowerCase().replace(/^(mampu|dapat)\s+/i, '')}`;
    } else if (highest && highest.averageScore >= 70) {
      strengths = `menunjukkan pemahaman yang baik dalam ${highest.tpTitle.toLowerCase().replace(/^(mampu|dapat)\s+/i, '')}`;
    } else {
      strengths = `menunjukkan perkembangan dan usaha yang baik dalam memahami ${highest.tpTitle.toLowerCase().replace(/^(mampu|dapat)\s+/i, '')}`;
    }

    let improvements = '';
    if (lowest && lowest.tpCode !== highest.tpCode && lowest.averageScore < 75) {
      improvements = `perlu meningkatkan latihan dan pendampingan dalam ${lowest.tpTitle.toLowerCase().replace(/^(mampu|dapat)\s+/i, '')}`;
    } else if (lowest && lowest.tpCode !== highest.tpCode) {
      improvements = `perlu terus memantapkan pemahaman dan pengayaan pada materi ${lowest.tpTitle.toLowerCase().replace(/^(mampu|dapat)\s+/i, '')}`;
    } else {
      improvements = `perlu mempertahankan dan meningkatkan ketekunan belajar di semester berikutnya`;
    }

    const finalDescription = `Ananda ${studentName} ${strengths}, serta ${improvements}.`;

    return {
      highestScoreTp: highest?.tpCode,
      lowestScoreTp: lowest?.tpCode,
      strengthsText: strengths,
      improvementsText: improvements,
      finalDescription
    };
  },

  // ==========================================
  // 5. ASSESSMENT FOLLOW UPS (REMEDIAL / PENGAYAAN)
  // ==========================================
  async getFollowUps(filters?: {
    teacherId?: string;
    subjectId?: string;
    classId?: string;
    studentId?: string;
    academicYear?: string;
    semester?: Semester;
  }): Promise<AssessmentFollowUp[]> {
    let q = query(collection(db, 'assessmentFollowUps'), orderBy('date', 'desc'));
    if (filters?.teacherId) {
      q = query(collection(db, 'assessmentFollowUps'), where('teacherId', '==', filters.teacherId));
    }
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AssessmentFollowUp));

    if (filters?.subjectId && filters.subjectId !== 'all') {
      results = results.filter(r => r.subjectId === filters.subjectId);
    }
    if (filters?.classId && filters.classId !== 'all') {
      results = results.filter(r => r.classId === filters.classId);
    }
    if (filters?.studentId) {
      results = results.filter(r => r.studentId === filters.studentId);
    }
    if (filters?.academicYear) {
      results = results.filter(r => r.academicYear === filters.academicYear);
    }
    if (filters?.semester) {
      results = results.filter(r => r.semester === filters.semester);
    }
    return results;
  },

  async createFollowUp(
    data: Omit<AssessmentFollowUp, 'id' | 'createdAt' | 'updatedAt'>,
    userContext?: { uid: string; name: string }
  ): Promise<string> {
    const docRef = await addDoc(collection(db, 'assessmentFollowUps'), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    if (userContext) {
      await auditService.log(
        userContext.uid,
        userContext.name,
        'CREATE_ASSESSMENT_FOLLOW_UP',
        'Penilaian',
        docRef.id,
        `Mencatat tindak lanjut (${data.type}) untuk siswa ${data.studentName || data.studentId}`
      );
    }

    return docRef.id;
  },

  async updateFollowUp(
    id: string,
    data: Partial<AssessmentFollowUp>,
    userContext?: { uid: string; name: string }
  ): Promise<void> {
    const docRef = doc(db, 'assessmentFollowUps', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });

    if (userContext) {
      await auditService.log(
        userContext.uid,
        userContext.name,
        'UPDATE_ASSESSMENT_FOLLOW_UP',
        'Penilaian',
        id,
        `Memperbarui tindak lanjut ID ${id}`
      );
    }
  },

  async deleteFollowUp(id: string, userContext?: { uid: string; name: string }): Promise<void> {
    await deleteDoc(doc(db, 'assessmentFollowUps', id));

    if (userContext) {
      await auditService.log(
        userContext.uid,
        userContext.name,
        'DELETE_ASSESSMENT_FOLLOW_UP',
        'Penilaian',
        id,
        `Menghapus data tindak lanjut ID ${id}`
      );
    }
  },

  // ==========================================
  // 6. ADMIN SUPERVISION & MONITORING
  // ==========================================
  async getTeacherAssessmentMonitoring(
    academicYear: string,
    semester: Semester
  ): Promise<TeacherAssessmentProgress[]> {
    const [assignments, allStudents, allAssessments, allGrades, allTeachers, allSubjects, allClasses] = await Promise.all([
      assignmentService.getAll(),
      studentService.getAll(),
      assessmentService.getAssessments({ academicYear, semester }),
      getDocs(query(collection(db, 'grades'), where('academicYear', '==', academicYear))),
      teacherService.getAll(),
      subjectService.getAll(),
      classService.getAll()
    ]);

    const activeAssignments = assignments.filter(a => a.academicYear === academicYear && a.semester === semester);
    const gradesList = allGrades.docs.map(d => ({ id: d.id, ...d.data() } as Grade)).filter(g => g.semester === semester);

    const progressList: TeacherAssessmentProgress[] = [];

    for (const assign of activeAssignments) {
      const teacherObj = allTeachers.find(t => t.id === assign.teacherId);
      const subjectObj = allSubjects.find(s => s.id === assign.subjectId);
      const classObj = allClasses.find(c => c.id === assign.classId);

      const classStudents = allStudents.filter(s => s.classId === assign.classId && s.status === 'aktif');
      const subjectAssessments = allAssessments.filter(
        a => a.teacherId === assign.teacherId && a.subjectId === assign.subjectId && a.classId === assign.classId
      );

      const assessCount = subjectAssessments.length;
      const totalStudents = classStudents.length;
      const expectedGrades = assessCount * totalStudents;

      // Count existing grades
      const assessIds = new Set(subjectAssessments.map(a => a.id));
      const enteredGrades = gradesList.filter(g => assessIds.has(g.assessmentId) && g.score !== undefined && g.score !== null).length;

      const completionPercentage = expectedGrades > 0 
        ? Math.min(100, Math.round((enteredGrades / expectedGrades) * 100))
        : 0;

      const isLocked = subjectAssessments.length > 0 && subjectAssessments.every(a => a.isLocked);

      let status: 'Belum dimulai' | 'Draft' | 'Sedang diisi' | 'Lengkap' | 'Dikunci' = 'Belum dimulai';
      if (isLocked) {
        status = 'Dikunci';
      } else if (completionPercentage === 100 && assessCount > 0) {
        status = 'Lengkap';
      } else if (enteredGrades > 0) {
        status = 'Sedang diisi';
      } else if (assessCount > 0) {
        status = 'Draft';
      }

      progressList.push({
        teacherId: assign.teacherId,
        teacherName: teacherObj?.name || 'Guru',
        subjectId: assign.subjectId,
        subjectName: subjectObj?.name || 'Mapel',
        classId: assign.classId,
        className: classObj?.name || 'Kelas',
        academicYear,
        semester,
        assessmentCount: assessCount,
        totalStudents,
        gradesEntered: enteredGrades,
        gradesExpected: expectedGrades,
        completionPercentage,
        isLocked,
        status
      });
    }

    return progressList;
  }
};
