import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type {
  Report,
  ReportPeriod,
  ReportPeriodStatus,
  ReportSubjectItem,
  ReportAttendanceData,
  ReportExtracurricularItem,
  ReportAchievementItem,
  PromotionStatusData,
  PromotionRecommendation,
  PromotionDecision,
  GradeChangeRequest,
  ReportArchive,
  ReportSystemSettings,
  ReportStatus
} from '../types/report';
import type { Semester, ClassData, Student, Subject, Assignment } from '../types/academic';
import { auditService } from './auditService';
import { classService } from './classService';
import { studentService } from './studentService';
import { subjectService } from './subjectService';
import { assignmentService } from './assignmentService';
import { teacherService } from './teacherService';
import { attendanceService } from './attendanceService';
import { assessmentService } from './assessmentService';

export const DEFAULT_REPORT_SETTINGS: ReportSystemSettings = {
  defaultTemplateId: 'template_madrasah_standard',
  reportNumberFormat: 'RAPOR/{YEAR}/{SEM}/{NIS}',
  enableRanking: false,
  showKktpColumn: true,
  requireHomeroomNoteToLock: true,
  requireExtracurricularToLock: false,
  signatureCity: 'Pebatan'
};

export const reportService = {
  // =========================================================================
  // 1. PERIODE RAPOR (Report Periods)
  // =========================================================================
  async getPeriods(): Promise<ReportPeriod[]> {
    try {
      const q = query(collection(db, 'reportPeriods'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ReportPeriod));
    } catch (error) {
      console.error('Error fetching report periods:', error);
      return [];
    }
  },

  async getPeriodById(id: string): Promise<ReportPeriod | null> {
    try {
      const docRef = doc(db, 'reportPeriods', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as ReportPeriod;
    } catch (error) {
      console.error('Error fetching period by ID:', error);
      return null;
    }
  },

  async getActivePeriod(academicYear: string, semester: Semester): Promise<ReportPeriod | null> {
    try {
      const q = query(
        collection(db, 'reportPeriods'),
        where('academicYear', '==', academicYear),
        where('semester', '==', semester)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ReportPeriod;
    } catch (error) {
      console.error('Error fetching active period:', error);
      return null;
    }
  },

  async savePeriod(
    data: Omit<ReportPeriod, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string,
    currentUser?: { uid: string; name: string }
  ): Promise<string> {
    const timestamp = new Date().toISOString();
    const payload = {
      ...data,
      updatedAt: timestamp
    };

    let periodId = existingId;
    if (existingId) {
      const docRef = doc(db, 'reportPeriods', existingId);
      await updateDoc(docRef, payload);
    } else {
      const docRef = await addDoc(collection(db, 'reportPeriods'), {
        ...payload,
        createdAt: timestamp
      });
      periodId = docRef.id;
    }

    if (currentUser && periodId) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        existingId ? 'UPDATE' : 'CREATE',
        'RAPOR_PERIODE',
        periodId,
        `${existingId ? 'Memperbarui' : 'Membuat'} periode rapor ${data.academicYear} ${data.semester}`
      );
    }

    return periodId!;
  },

  async deletePeriod(id: string, currentUser?: { uid: string; name: string }): Promise<void> {
    await deleteDoc(doc(db, 'reportPeriods', id));
    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'DELETE',
        'RAPOR_PERIODE',
        id,
        `Menghapus periode rapor ID: ${id}`
      );
    }
  },

  // =========================================================================
  // 2. GENERATE & DAPATKAN RAPOR (Reports)
  // =========================================================================
  async getReports(filter: {
    classId?: string;
    academicYear?: string;
    semester?: Semester;
    periodId?: string;
    studentId?: string;
  }): Promise<Report[]> {
    try {
      const constraints: any[] = [];

      if (filter.classId && filter.classId !== 'all') {
        constraints.push(where('classId', '==', filter.classId));
      }
      if (filter.academicYear && filter.academicYear !== 'all') {
        constraints.push(where('academicYear', '==', filter.academicYear));
      }
      if (filter.semester && filter.semester !== ('all' as any)) {
        constraints.push(where('semester', '==', filter.semester));
      }
      if (filter.periodId && filter.periodId !== 'all') {
        constraints.push(where('periodId', '==', filter.periodId));
      }
      if (filter.studentId && filter.studentId !== 'all') {
        constraints.push(where('studentId', '==', filter.studentId));
      }

      const qBuilt = query(collection(db, 'reports'), ...constraints);
      const snapshot = await getDocs(qBuilt);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Report));
    } catch (error) {
      console.error('Error getting reports:', error);
      return [];
    }
  },

  async getReportById(id: string): Promise<Report | null> {
    try {
      const snap = await getDoc(doc(db, 'reports', id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Report;
    } catch (error) {
      console.error('Error getting report by id:', error);
      return null;
    }
  },

  async generateReportsForClass(
    classId: string,
    periodId: string,
    academicYear: string,
    semester: Semester,
    currentUser?: { uid: string; name: string }
  ): Promise<{ totalGenerated: number; errors: string[] }> {
    const errors: string[] = [];

    try {
      // 1. Fetch Class, Homeroom, & Active Students
      const [classObj, allStudents, periodObj, allSubjects, allTeachers, allAssignments] = await Promise.all([
        classService.getById(classId),
        studentService.getAll(),
        this.getPeriodById(periodId),
        subjectService.getAll(),
        teacherService.getAll(),
        assignmentService.getAll()
      ]);

      if (!classObj) {
        throw new Error('Data kelas tidak ditemukan.');
      }

      const activeStudents = allStudents.filter(s => s.classId === classId && s.status === 'aktif');
      if (activeStudents.length === 0) {
        return { totalGenerated: 0, errors: ['Tidak ada siswa aktif di kelas ini.'] };
      }

      const homeroomTeacherId = classObj.homeroomTeacherId || '';
      const homeroomTeacher = allTeachers.find(t => t.id === homeroomTeacherId);
      const homeroomTeacherName = homeroomTeacher?.name || 'Wali Kelas';

      // 2. Fetch Assignments for this class and semester
      const activeAssignments = allAssignments.filter(
        a => a.classId === classId && a.academicYear === academicYear && a.semester === semester
      );

      // 3. Fetch Assessments, Grades, Descriptions
      const assessments = await assessmentService.getAssessments({
        classId,
        academicYear,
        semester
      });

      const gradesSnap = await getDocs(
        query(
          collection(db, 'grades'),
          where('classId', '==', classId),
          where('academicYear', '==', academicYear)
        )
      );
      const allGrades = gradesSnap.docs
        .map(d => d.data())
        .filter(g => (g as any).semester === semester);

      const descriptionsSnap = await getDocs(
        query(
          collection(db, 'studentDescriptions'),
          where('classId', '==', classId),
          where('academicYear', '==', academicYear)
        )
      );
      const allDescriptions = descriptionsSnap.docs
        .map(d => d.data())
        .filter(d => (d as any).semester === semester);

      // 4. Fetch Attendance Sessions
      const attendanceStartDate = periodObj?.startDate || '2000-01-01';
      const attendanceEndDate = periodObj?.endDate || '2099-12-31';

      const attSessions = await attendanceService.getByClass(classId);
      const filteredSessions = attSessions.filter(
        s => s.date >= attendanceStartDate && s.date <= attendanceEndDate
      );

      // 5. Fetch existing reports to preserve homeroom notes & locked state
      const existingReports = await this.getReports({
        classId,
        academicYear,
        semester,
        periodId
      });
      const existingMap = new Map<string, Report>(existingReports.map(r => [r.studentId, r]));

      let totalGenerated = 0;

      for (const student of activeStudents) {
        if (!student.id) continue;
        const studentId = student.id;
        const existingReport: Report | undefined = existingMap.get(studentId);

        // Attendance calculation
        let sakitCount = 0;
        let izinCount = 0;
        let alpaCount = 0;
        let hadirCount = 0;
        let sessionsCount = 0;

        for (const session of filteredSessions) {
          if (session.records && session.records[studentId]) {
            sessionsCount++;
            const st = session.records[studentId].status;
            if (st === 'sakit') sakitCount++;
            else if (st === 'izin') izinCount++;
            else if (st === 'alpa') alpaCount++;
            else if (st === 'hadir') hadirCount++;
          }
        }

        const attendanceData: ReportAttendanceData = {
          sakit: sakitCount,
          izin: izinCount,
          alpa: alpaCount,
          hadir: hadirCount,
          totalDays: sessionsCount,
          isComplete: sessionsCount > 0
        };

        // Subjects scores and descriptions
        const subjectItems: ReportSubjectItem[] = [];

        for (const assign of activeAssignments) {
          const subjectObj = allSubjects.find(s => s.id === assign.subjectId);
          if (!subjectObj) continue;

          const teacherObj = allTeachers.find(t => t.id === assign.teacherId);
          const subjAssessments = assessments.filter(a => a.subjectId === assign.subjectId);
          const assessIds = subjAssessments.map(a => a.id).filter(Boolean);

          const studentGrades = allGrades.filter(
            (g: any) => g.studentId === studentId && assessIds.includes(g.assessmentId) && g.score !== undefined
          );

          let finalScore = 0;
          if (studentGrades.length > 0) {
            const sum = studentGrades.reduce((acc, curr: any) => acc + (Number(curr.score) || 0), 0);
            finalScore = Math.round(sum / studentGrades.length);
          }

          const descObj: any = allDescriptions.find(
            (d: any) => d.studentId === studentId && d.subjectId === assign.subjectId
          );

          const description = descObj?.description || descObj?.autoGeneratedDescription || '';
          const hasDescription = !!description.trim();

          subjectItems.push({
            subjectId: assign.subjectId,
            subjectName: subjectObj.name,
            subjectCode: subjectObj.code,
            category: (subjectObj.category as any) || 'Wajib',
            teacherId: assign.teacherId,
            teacherName: teacherObj?.name || 'Guru Pengampu',
            finalScore: finalScore,
            scoreLetter: finalScore >= 88 ? 'A' : finalScore >= 75 ? 'B' : finalScore >= 60 ? 'C' : 'D',
            description: description || 'Deskripsi capaian kompetensi belum dibuat.',
            hasDescription: hasDescription,
            kktp: (subjectObj as any).kktp || 70,
            order: (subjectObj as any).order || 0
          });
        }

        subjectItems.sort((a, b) => (a.order || 0) - (b.order || 0) || a.subjectName.localeCompare(b.subjectName));

        const allSubjectsHaveScore = subjectItems.length > 0 && subjectItems.every(s => s.finalScore > 0);
        const allSubjectsHaveDesc = subjectItems.length > 0 && subjectItems.every(s => s.hasDescription);
        const hasAttendance = attendanceData.isComplete;
        const hasHomeroomNote = !!(existingReport?.homeroomNote || '').trim();

        let status: ReportStatus = 'Draft';
        if (existingReport?.isLocked) {
          status = 'Dikunci';
        } else if (allSubjectsHaveScore && allSubjectsHaveDesc && hasAttendance && hasHomeroomNote) {
          status = 'Lengkap';
        } else if (allSubjectsHaveScore || hasAttendance || hasHomeroomNote) {
          status = 'Perlu Diperiksa';
        }

        const yearClean = academicYear.replace('/', '-');
        const reportNumber =
          existingReport?.reportNumber ||
          `RAPOR/${yearClean}/${semester === 'Ganjil' ? 'I' : 'II'}/${student.nis || studentId.slice(0, 5)}`;

        const reportPayload: Omit<Report, 'id'> = {
          studentId: student.id,
          studentNis: student.nis || '-',
          studentNisn: student.nisn || '-',
          studentName: student.name,
          classId: classId,
          className: classObj.name,
          homeroomTeacherId: homeroomTeacherId,
          homeroomTeacherName: homeroomTeacherName,
          academicYear: academicYear,
          semester: semester,
          periodId: periodId,
          reportNumber: reportNumber,

          status: status,
          isLocked: existingReport?.isLocked || false,
          lockedAt: existingReport?.lockedAt || null,
          lockedBy: existingReport?.lockedBy || '',

          subjects: subjectItems,
          attendance: attendanceData,
          extracurriculars: existingReport?.extracurriculars || [
            { activity: 'Pramuka', result: 'Baik', description: 'Aktif dan disiplin mengikuti kegiatan kepramukaan.' }
          ],
          achievements: existingReport?.achievements || [],
          homeroomNote:
            existingReport?.homeroomNote ||
            'Tingkatkan terus semangat belajar dan pertahankan akhlak mulia dalam setiap aktivitas.',
          studentGrowth: existingReport?.studentGrowth || {
            attitude: 'Sangat Baik',
            discipline: 'Disiplin dan taat tata tertib madrasah',
            responsibility: 'Bertanggung jawab dalam menyelesaikan tugas mandiri dan kelompok',
            activeness: 'Aktif berpartisipasi dalam diskusi kelas',
            generalGrowthNote: 'Menunjukkan kemajuan yang membanggakan dalam aspek kognitif dan pembiasaan ibadah.'
          },
          promotionStatus: existingReport?.promotionStatus || {
            status: 'Belum ditentukan',
            recommendationNote: ''
          },

          updatedAt: new Date().toISOString(),
          generatedAt: new Date().toISOString(),
          createdAt: existingReport?.createdAt || new Date().toISOString()
        };

        if (existingReport && existingReport.id) {
          if (!existingReport.isLocked) {
            await updateDoc(doc(db, 'reports', existingReport.id), reportPayload);
          }
        } else {
          await addDoc(collection(db, 'reports'), reportPayload);
        }

        totalGenerated++;
      }

      if (currentUser) {
        await auditService.log(
          currentUser.uid,
          currentUser.name,
          'GENERATE',
          'RAPOR',
          classId,
          `Generate ${totalGenerated} rapor kelas ${classObj.name} (${academicYear} ${semester})`
        );
      }

      return { totalGenerated, errors };
    } catch (err: any) {
      console.error('Error in generateReportsForClass:', err);
      return { totalGenerated: 0, errors: [err.message || 'Gagal generate rapor.'] };
    }
  },

  async updateHomeroomInputs(
    reportId: string,
    data: {
      attendance?: { sakit: number; izin: number; alpa: number };
      homeroomNote?: string;
      extracurriculars?: any[];
      achievements?: any[];
      physicalDevelopment?: any;
      growthNotes?: string;
      promotionStatus?: Partial<PromotionStatusData>;
    },
    currentUser?: { uid: string; name: string }
  ): Promise<void> {
    const reportRef = doc(db, 'reports', reportId);
    const snap = await getDoc(reportRef);
    if (!snap.exists()) throw new Error('Rapor tidak ditemukan.');

    const current = snap.data() as Report;
    if (current.isLocked) {
      throw new Error('Rapor telah dikunci oleh Admin dan tidak dapat diubah.');
    }

    const payload: any = {
      updatedAt: new Date().toISOString()
    };

    if (data.attendance) {
      payload.attendance = {
        ...current.attendance,
        sakit: data.attendance.sakit,
        izin: data.attendance.izin,
        alpa: data.attendance.alpa,
        isComplete: true
      };
    }
    if (data.homeroomNote !== undefined) {
      payload.homeroomNote = data.homeroomNote;
    }
    if (data.extracurriculars) {
      payload.extracurriculars = data.extracurriculars.map(e => ({
        activity: e.name || e.activity || '',
        result: e.score || e.result || 'Baik',
        description: e.description || ''
      }));
    }
    if (data.achievements) {
      payload.achievements = data.achievements.map(a => ({
        name: a.name || '',
        type: a.type || 'Akademik',
        level: a.level || 'Sekolah',
        year: a.year || '2026',
        description: a.description || ''
      }));
    }
    if (data.growthNotes || data.physicalDevelopment) {
      payload.studentGrowth = {
        ...current.studentGrowth,
        generalGrowthNote: data.growthNotes || current.studentGrowth?.generalGrowthNote || ''
      };
    }
    if (data.promotionStatus) {
      payload.promotionStatus = {
        ...current.promotionStatus,
        ...data.promotionStatus
      };
    }

    await updateDoc(reportRef, payload);

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'UPDATE_HOMEROOM',
        'RAPOR',
        reportId,
        `Memperbarui catatan & kelengkapan rapor siswa ${current.studentName}`
      );
    }
  },

  async lockReport(reportId: string, currentUser?: { uid: string; name: string }): Promise<void> {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, {
      isLocked: true,
      status: 'Dikunci',
      lockedAt: new Date().toISOString(),
      lockedBy: currentUser?.name || 'Administrator',
      updatedAt: new Date().toISOString()
    });

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'LOCK',
        'RAPOR',
        reportId,
        `Mengunci rapor ID: ${reportId}`
      );
    }
  },

  async unlockReport(reportId: string, currentUser?: { uid: string; name: string }): Promise<void> {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, {
      isLocked: false,
      status: 'Lengkap',
      lockedAt: null,
      lockedBy: null,
      updatedAt: new Date().toISOString()
    });

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'UNLOCK',
        'RAPOR',
        reportId,
        `Membuka kunci rapor ID: ${reportId}`
      );
    }
  },

  async lockClassReports(
    classId: string,
    periodId: string,
    currentUser?: { uid: string; name: string }
  ): Promise<number> {
    const q = query(
      collection(db, 'reports'),
      where('classId', '==', classId),
      where('periodId', '==', periodId)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    let count = 0;
    snapshot.docs.forEach(d => {
      batch.update(d.ref, {
        isLocked: true,
        status: 'Dikunci',
        lockedAt: new Date().toISOString(),
        lockedBy: currentUser?.name || 'Administrator',
        updatedAt: new Date().toISOString()
      });
      count++;
    });

    if (count > 0) {
      await batch.commit();
      if (currentUser) {
        await auditService.log(
          currentUser.uid,
          currentUser.name,
          'LOCK_CLASS',
          'RAPOR',
          classId,
          `Mengunci ${count} rapor kelas ID ${classId}`
        );
      }
    }

    return count;
  },

  async unlockClassReports(
    classId: string,
    periodId: string,
    currentUser?: { uid: string; name: string }
  ): Promise<number> {
    const q = query(
      collection(db, 'reports'),
      where('classId', '==', classId),
      where('periodId', '==', periodId)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    let count = 0;
    snapshot.docs.forEach(d => {
      batch.update(d.ref, {
        isLocked: false,
        status: 'Lengkap',
        lockedAt: null,
        lockedBy: null,
        updatedAt: new Date().toISOString()
      });
      count++;
    });

    if (count > 0) {
      await batch.commit();
      if (currentUser) {
        await auditService.log(
          currentUser.uid,
          currentUser.name,
          'UNLOCK_CLASS',
          'RAPOR',
          classId,
          `Membuka kunci ${count} rapor kelas ID ${classId}`
        );
      }
    }

    return count;
  },

  // =========================================================================
  // 3. LEGER NILAI KELAS (Matrix calculation & stats)
  // =========================================================================
  async getLegerData(classId: string, academicYear: string, semester: Semester): Promise<any> {
    const [classObj, allStudents, allSubjects, allAssignments, reports] = await Promise.all([
      classService.getById(classId),
      studentService.getAll(),
      subjectService.getAll(),
      assignmentService.getAll(),
      this.getReports({ classId, academicYear, semester })
    ]);

    const activeStudents = allStudents.filter(s => s.classId === classId && s.status === 'aktif');
    const classAssignments = allAssignments.filter(
      a => a.classId === classId && a.academicYear === academicYear && a.semester === semester
    );

    const assignedSubjectIds = new Set(classAssignments.map(a => a.subjectId));
    const subjectsList = allSubjects.filter(s => assignedSubjectIds.has(s.id!));

    const rows: any[] = [];
    let sumTotalClass = 0;
    let studentCountWithScore = 0;
    let maxClassScore = 0;
    let minClassScore = 100;
    let missingReports = 0;

    const reportMap = new Map<string, Report>(reports.map(r => [r.studentId, r]));

    for (const student of activeStudents) {
      if (!student.id) continue;
      const rep = reportMap.get(student.id);

      const scoreObj: Record<string, number> = {};
      let total = 0;
      let count = 0;

      subjectsList.forEach(sub => {
        if (!sub.id) return;
        const subItem = rep?.subjects?.find(s => s.subjectId === sub.id);
        const score = subItem?.finalScore || 0;
        scoreObj[sub.id] = score;
        if (score > 0) {
          total += score;
          count++;
        }
      });

      const avg = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
      if (avg > 0) {
        sumTotalClass += avg;
        studentCountWithScore++;
        if (avg > maxClassScore) maxClassScore = avg;
        if (avg < minClassScore) minClassScore = avg;
      } else {
        missingReports++;
      }

      rows.push({
        studentId: student.id,
        name: student.name,
        nis: student.nis || '-',
        nisn: student.nisn || '-',
        gender: student.gender || 'L',
        scores: scoreObj,
        totalScore: total,
        avgScore: avg,
        rank: 1,
        attendance: rep?.attendance || { sakit: 0, izin: 0, alpa: 0 },
        status: rep?.status || 'Draft',
        isLocked: rep?.isLocked || false
      });
    }

    // Sort by avgScore descending to calculate ranks
    rows.sort((a, b) => b.avgScore - a.avgScore);
    rows.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    const classAvg = studentCountWithScore > 0 ? Math.round((sumTotalClass / studentCountWithScore) * 10) / 10 : 0;

    return {
      classInfo: classObj,
      subjects: subjectsList.map(s => ({
        id: s.id,
        name: s.name,
        code: s.code,
        kktp: (s as any).kktp || 70
      })),
      rows,
      stats: {
        totalStudents: activeStudents.length,
        classAvg,
        maxScore: maxClassScore,
        minScore: studentCountWithScore > 0 ? minClassScore : 0,
        missingCount: missingReports,
        isFinal: missingReports === 0 && rows.every(r => r.isLocked)
      }
    };
  },

  // =========================================================================
  // 4. KENAIKAN KELAS & KELULUSAN (Promotion Decisions & Migration)
  // =========================================================================
  async finalizePromotionDecisions(
    decisions: {
      reportId?: string;
      studentId: string;
      decision: PromotionDecision;
      nextClassId?: string;
      nextClassName?: string;
      decisionNote?: string;
    }[],
    currentUser?: { uid: string; name: string }
  ): Promise<void> {
    const batch = writeBatch(db);

    for (const item of decisions) {
      if (item.reportId) {
        const docRef = doc(db, 'reports', item.reportId);
        batch.update(docRef, {
          'promotionStatus.decision': item.decision,
          'promotionStatus.nextClassId': item.nextClassId || '',
          'promotionStatus.nextClassName': item.nextClassName || '',
          'promotionStatus.decisionNote': item.decisionNote || '',
          'promotionStatus.decidedBy': currentUser?.name || 'Administrator',
          'promotionStatus.decidedAt': new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    await batch.commit();

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'FINALIZE_PROMOTION',
        'RAPOR',
        'BATCH',
        `Menetapkan keputusan kenaikan kelas untuk ${decisions.length} siswa`
      );
    }
  },

  async executeClassMigration(
    migrations: {
      studentId: string;
      currentClassId: string;
      targetClassId: string;
      decision: PromotionDecision;
    }[],
    currentUser?: { uid: string; name: string }
  ): Promise<{ successCount: number }> {
    let successCount = 0;
    const batch = writeBatch(db);

    for (const m of migrations) {
      if (m.decision === 'Lulus') {
        const studentRef = doc(db, 'students', m.studentId);
        batch.update(studentRef, {
          status: 'lulus',
          updatedAt: new Date().toISOString()
        });
        successCount++;
      } else if (m.targetClassId && m.targetClassId !== m.currentClassId) {
        const studentRef = doc(db, 'students', m.studentId);
        batch.update(studentRef, {
          classId: m.targetClassId,
          updatedAt: new Date().toISOString()
        });
        successCount++;
      }
    }

    if (successCount > 0) {
      await batch.commit();
      if (currentUser) {
        await auditService.log(
          currentUser.uid,
          currentUser.name,
          'MIGRATE_CLASS',
          'ACADEMIC',
          'BATCH',
          `Migrasi kenaikan kelas berhasil untuk ${successCount} peserta didik`
        );
      }
    }

    return { successCount };
  },

  // =========================================================================
  // 5. PERMOHONAN PERBAIKAN NILAI (Grade Change Requests)
  // =========================================================================
  async createGradeChangeRequest(
    data: Omit<GradeChangeRequest, 'id' | 'status' | 'createdAt'>,
    currentUser?: { uid: string; name: string }
  ): Promise<string> {
    const payload = {
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'gradeChangeRequests'), payload);

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'REQUEST_GRADE_CHANGE',
        'RAPOR',
        docRef.id,
        `Pengajuan perbaikan nilai siswa ${data.studentName} mapel ${data.subjectName} (${data.oldValue} -> ${data.proposedValue})`
      );
    }

    return docRef.id;
  },

  async getGradeChangeRequests(filter?: {
    academicYear?: string;
    teacherId?: string;
    status?: string;
  }): Promise<GradeChangeRequest[]> {
    try {
      const q = query(collection(db, 'gradeChangeRequests'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as GradeChangeRequest));

      if (filter?.academicYear) {
        results = results.filter(r => r.academicYear === filter.academicYear);
      }
      if (filter?.teacherId) {
        results = results.filter(r => r.teacherId === filter.teacherId);
      }
      if (filter?.status && filter.status !== 'all') {
        results = results.filter(r => r.status === filter.status);
      }
      return results;
    } catch (error) {
      console.error('Error getting grade requests:', error);
      return [];
    }
  },

  async reviewGradeChangeRequest(
    requestId: string,
    status: 'approved' | 'rejected',
    reviewNotes: string,
    currentUser?: { uid: string; name: string }
  ): Promise<void> {
    const docRef = doc(db, 'gradeChangeRequests', requestId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Permohonan tidak ditemukan.');

    const reqData = snap.data() as GradeChangeRequest;

    await updateDoc(docRef, {
      status,
      reviewNotes,
      reviewedBy: currentUser?.uid || 'admin',
      reviewedByName: currentUser?.name || 'Administrator',
      reviewedAt: new Date().toISOString()
    });

    // If approved, update the actual report subject score
    if (status === 'approved' && reqData.reportId) {
      const reportRef = doc(db, 'reports', reqData.reportId);
      const reportSnap = await getDoc(reportRef);
      if (reportSnap.exists()) {
        const reportData = reportSnap.data() as Report;
        const updatedSubjects = (reportData.subjects || []).map(s => {
          if (s.subjectId === reqData.subjectId || s.subjectName === reqData.subjectName) {
            const finalScore = reqData.proposedValue;
            return {
              ...s,
              finalScore,
              scoreLetter: finalScore >= 88 ? 'A' : finalScore >= 75 ? 'B' : finalScore >= 60 ? 'C' : 'D'
            };
          }
          return s;
        });

        await updateDoc(reportRef, {
          subjects: updatedSubjects,
          updatedAt: new Date().toISOString()
        });
      }
    }

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        `REVIEW_${status.toUpperCase()}`,
        'RAPOR',
        requestId,
        `${status === 'approved' ? 'Menyetujui' : 'Menolak'} perbaikan nilai siswa ${reqData.studentName} mapel ${reqData.subjectName}`
      );
    }
  },

  // =========================================================================
  // 6. ARSIP RAPOR (Report Archives)
  // =========================================================================
  async archiveReport(reportId: string, currentUser?: { uid: string; name: string }): Promise<string> {
    const reportRef = doc(db, 'reports', reportId);
    const snap = await getDoc(reportRef);
    if (!snap.exists()) throw new Error('Rapor tidak ditemukan.');

    const rep = snap.data() as Report;

    const archivePayload: Omit<ReportArchive, 'id'> = {
      reportId: snap.id,
      studentId: rep.studentId,
      studentName: rep.studentName,
      studentNis: rep.studentNis,
      classId: rep.classId,
      className: rep.className,
      academicYear: rep.academicYear,
      semester: rep.semester,
      periodId: rep.periodId,
      snapshotData: rep,
      archivedAt: new Date().toISOString(),
      archivedBy: currentUser?.name || 'Administrator'
    };

    const docRef = await addDoc(collection(db, 'reportArchives'), archivePayload);

    // Update report status
    await updateDoc(reportRef, {
      status: 'Diarsipkan',
      updatedAt: new Date().toISOString()
    });

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'ARCHIVE',
        'RAPOR',
        reportId,
        `Mengarsipkan dokumen rapor siswa ${rep.studentName} (${rep.academicYear} ${rep.semester})`
      );
    }

    return docRef.id;
  },

  async getArchives(filter?: {
    academicYear?: string;
    classId?: string;
    studentId?: string;
  }): Promise<ReportArchive[]> {
    try {
      const q = query(collection(db, 'reportArchives'), orderBy('archivedAt', 'desc'));
      const snap = await getDocs(q);
      let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as ReportArchive));

      if (filter?.academicYear && filter.academicYear !== 'all') {
        results = results.filter(r => r.academicYear === filter.academicYear);
      }
      if (filter?.classId && filter.classId !== 'all') {
        results = results.filter(r => r.classId === filter.classId);
      }
      if (filter?.studentId && filter.studentId !== 'all') {
        results = results.filter(r => r.studentId === filter.studentId);
      }
      return results;
    } catch (error) {
      console.error('Error fetching archives:', error);
      return [];
    }
  },

  // =========================================================================
  // 7. PENGATURAN RAPOR (Settings)
  // =========================================================================
  async getReportSettings(): Promise<ReportSystemSettings> {
    try {
      const snap = await getDoc(doc(db, 'reportSettings', 'general'));
      if (!snap.exists()) return DEFAULT_REPORT_SETTINGS;
      return snap.data() as ReportSystemSettings;
    } catch (error) {
      console.error('Error fetching report settings:', error);
      return DEFAULT_REPORT_SETTINGS;
    }
  },

  async updateReportSettings(
    data: Partial<ReportSystemSettings>,
    currentUser?: { uid: string; name: string }
  ): Promise<void> {
    const docRef = doc(db, 'reportSettings', 'general');
    await setDoc(docRef, { ...DEFAULT_REPORT_SETTINGS, ...data }, { merge: true });

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name,
        'UPDATE_SETTINGS',
        'RAPOR',
        'general',
        'Memperbarui konfigurasi sistem rapor madrasah'
      );
    }
  }
};
