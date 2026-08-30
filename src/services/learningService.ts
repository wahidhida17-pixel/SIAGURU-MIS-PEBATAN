import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, setDoc 
} from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type { 
  LearningPlan, LearningObjective, ATP, Prota, Promes, ModuleAjar, KKTP, 
  AcademicCalendar, DocumentTemplate, TeacherAdministrationChecklist 
} from '../types/learning';
import type { Semester } from '../types/academic';
import { assignmentService } from './assignmentService';
import { subjectService } from './subjectService';
import { classService } from './classService';
import { teacherService } from './teacherService';

export const learningService = {
  // ==========================================
  // 1. CAPAIAN PEMBELAJARAN (CP)
  // ==========================================
  async getLearningPlans(filters?: { 
    teacherId?: string; 
    subjectId?: string; 
    classId?: string | null; 
    academicYear?: string; 
    semester?: Semester 
  }): Promise<LearningPlan[]> {
    try {
      let q = query(collection(db, 'learningPlans'));
      if (filters?.teacherId) {
        q = query(collection(db, 'learningPlans'), where('teacherId', '==', filters.teacherId));
      }
      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LearningPlan));

      if (filters?.subjectId) {
        results = results.filter(r => r.subjectId === filters.subjectId);
      }
      if (filters?.classId !== undefined) {
        results = results.filter(r => (filters.classId === null ? !r.classId : r.classId === filters.classId));
      }
      if (filters?.academicYear) {
        results = results.filter(r => r.academicYear === filters.academicYear);
      }
      if (filters?.semester) {
        results = results.filter(r => r.semester === filters.semester);
      }
      return results;
    } catch (err) {
      console.warn('Error fetching learning plans:', err);
      return [];
    }
  },

  async getLearningPlanById(id: string): Promise<LearningPlan | null> {
    try {
      const docRef = doc(db, 'learningPlans', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as LearningPlan;
    } catch (err) {
      console.warn('Error fetching learning plan by id:', err);
      return null;
    }
  },

  async createLearningPlan(data: Omit<LearningPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'learningPlans'), {
      ...data,
      version: data.version || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async updateLearningPlan(id: string, data: Partial<LearningPlan>): Promise<void> {
    const docRef = doc(db, 'learningPlans', id);
    const current = await this.getLearningPlanById(id);
    const newVersion = (current?.version || 1) + 1;
    await updateDoc(docRef, {
      ...data,
      version: newVersion,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteLearningPlan(id: string): Promise<void> {
    const docRef = doc(db, 'learningPlans', id);
    await deleteDoc(docRef);
  },

  // ==========================================
  // 2. TUJUAN PEMBELAJARAN (TP)
  // ==========================================
  async getLearningObjectives(filters?: { 
    cpId?: string;
    teacherId?: string; 
    subjectId?: string; 
    classId?: string | null; 
    academicYear?: string; 
    semester?: Semester 
  }): Promise<LearningObjective[]> {
    try {
      let q = query(collection(db, 'learningObjectives'));
      if (filters?.teacherId) {
        q = query(collection(db, 'learningObjectives'), where('teacherId', '==', filters.teacherId));
      }
      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LearningObjective));

      if (filters?.cpId) {
        results = results.filter(r => r.cpId === filters.cpId);
      }
      if (filters?.subjectId) {
        results = results.filter(r => r.subjectId === filters.subjectId);
      }
      if (filters?.classId !== undefined) {
        results = results.filter(r => (filters.classId === null ? !r.classId : r.classId === filters.classId));
      }
      if (filters?.academicYear) {
        results = results.filter(r => r.academicYear === filters.academicYear);
      }
      if (filters?.semester) {
        results = results.filter(r => r.semester === filters.semester);
      }

      return results.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
    } catch (err) {
      console.warn('Error fetching learning objectives:', err);
      return [];
    }
  },

  async getLearningObjectiveById(id: string): Promise<LearningObjective | null> {
    try {
      const docRef = doc(db, 'learningObjectives', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as LearningObjective;
    } catch (err) {
      console.warn('Error fetching learning objective by id:', err);
      return null;
    }
  },

  async createLearningObjective(data: Omit<LearningObjective, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'learningObjectives'), {
      ...data,
      version: data.version || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async updateLearningObjective(id: string, data: Partial<LearningObjective>): Promise<void> {
    const docRef = doc(db, 'learningObjectives', id);
    const current = await this.getLearningObjectiveById(id);
    const newVersion = (current?.version || 1) + 1;
    await updateDoc(docRef, {
      ...data,
      version: newVersion,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteLearningObjective(id: string): Promise<void> {
    const docRef = doc(db, 'learningObjectives', id);
    await deleteDoc(docRef);
  },

  // ==========================================
  // 3. ALUR TUJUAN PEMBELAJARAN (ATP)
  // ==========================================
  async getATPs(filters?: { 
    teacherId?: string; 
    subjectId?: string; 
    classId?: string | null; 
    academicYear?: string; 
    semester?: Semester 
  }): Promise<ATP[]> {
    try {
      let q = query(collection(db, 'atp'));
      if (filters?.teacherId) {
        q = query(collection(db, 'atp'), where('teacherId', '==', filters.teacherId));
      }
      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ATP));

      if (filters?.subjectId) {
        results = results.filter(r => r.subjectId === filters.subjectId);
      }
      if (filters?.classId !== undefined) {
        results = results.filter(r => (filters.classId === null ? !r.classId : r.classId === filters.classId));
      }
      if (filters?.academicYear) {
        results = results.filter(r => r.academicYear === filters.academicYear);
      }
      if (filters?.semester) {
        results = results.filter(r => r.semester === filters.semester);
      }
      return results;
    } catch (err) {
      console.warn('Error fetching ATPs:', err);
      return [];
    }
  },

  async getATPById(id: string): Promise<ATP | null> {
    try {
      const docRef = doc(db, 'atp', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as ATP;
    } catch (err) {
      console.warn('Error fetching ATP by id:', err);
      return null;
    }
  },

  async createATP(data: Omit<ATP, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'atp'), {
      ...data,
      version: data.version || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async updateATP(id: string, data: Partial<ATP>): Promise<void> {
    const docRef = doc(db, 'atp', id);
    const current = await this.getATPById(id);
    const newVersion = (current?.version || 1) + 1;
    await updateDoc(docRef, {
      ...data,
      version: newVersion,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteATP(id: string): Promise<void> {
    const docRef = doc(db, 'atp', id);
    await deleteDoc(docRef);
  },

  // ==========================================
  // 4. PROGRAM TAHUNAN (PROTA)
  // ==========================================
  async getProtas(filters?: { 
    teacherId?: string; 
    subjectId?: string; 
    classId?: string | null; 
    academicYear?: string; 
  }): Promise<Prota[]> {
    try {
      let q = query(collection(db, 'prota'));
      if (filters?.teacherId) {
        q = query(collection(db, 'prota'), where('teacherId', '==', filters.teacherId));
      }
      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Prota));

      if (filters?.subjectId) {
        results = results.filter(r => r.subjectId === filters.subjectId);
      }
      if (filters?.classId !== undefined) {
        results = results.filter(r => (filters.classId === null ? !r.classId : r.classId === filters.classId));
      }
      if (filters?.academicYear) {
        results = results.filter(r => r.academicYear === filters.academicYear);
      }
      return results;
    } catch (err) {
      console.warn('Error fetching Protas:', err);
      return [];
    }
  },

  async getProtaById(id: string): Promise<Prota | null> {
    try {
      const docRef = doc(db, 'prota', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Prota;
    } catch (err) {
      console.warn('Error fetching Prota by id:', err);
      return null;
    }
  },

  async createProta(data: Omit<Prota, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'prota'), {
      ...data,
      version: data.version || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async updateProta(id: string, data: Partial<Prota>): Promise<void> {
    const docRef = doc(db, 'prota', id);
    const current = await this.getProtaById(id);
    const newVersion = (current?.version || 1) + 1;
    await updateDoc(docRef, {
      ...data,
      version: newVersion,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteProta(id: string): Promise<void> {
    const docRef = doc(db, 'prota', id);
    await deleteDoc(docRef);
  },

  // ==========================================
  // 5. PROGRAM SEMESTER (PROMES)
  // ==========================================
  async getPromesList(filters?: { 
    teacherId?: string; 
    subjectId?: string; 
    classId?: string | null; 
    academicYear?: string; 
    semester?: Semester 
  }): Promise<Promes[]> {
    try {
      let q = query(collection(db, 'promes'));
      if (filters?.teacherId) {
        q = query(collection(db, 'promes'), where('teacherId', '==', filters.teacherId));
      }
      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Promes));

      if (filters?.subjectId) {
        results = results.filter(r => r.subjectId === filters.subjectId);
      }
      if (filters?.classId !== undefined) {
        results = results.filter(r => (filters.classId === null ? !r.classId : r.classId === filters.classId));
      }
      if (filters?.academicYear) {
        results = results.filter(r => r.academicYear === filters.academicYear);
      }
      if (filters?.semester) {
        results = results.filter(r => r.semester === filters.semester);
      }
      return results;
    } catch (err) {
      console.warn('Error fetching Promes:', err);
      return [];
    }
  },

  async getPromesById(id: string): Promise<Promes | null> {
    try {
      const docRef = doc(db, 'promes', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Promes;
    } catch (err) {
      console.warn('Error fetching Promes by id:', err);
      return null;
    }
  },

  async createPromes(data: Omit<Promes, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'promes'), {
      ...data,
      version: data.version || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async updatePromes(id: string, data: Partial<Promes>): Promise<void> {
    const docRef = doc(db, 'promes', id);
    const current = await this.getPromesById(id);
    const newVersion = (current?.version || 1) + 1;
    await updateDoc(docRef, {
      ...data,
      version: newVersion,
      updatedAt: new Date().toISOString()
    });
  },

  async deletePromes(id: string): Promise<void> {
    const docRef = doc(db, 'promes', id);
    await deleteDoc(docRef);
  },

  // ==========================================
  // 6. MODUL AJAR (MODULES)
  // ==========================================
  async getModules(filters?: { 
    teacherId?: string; 
    subjectId?: string; 
    classId?: string; 
    academicYear?: string; 
    semester?: Semester 
  }): Promise<ModuleAjar[]> {
    try {
      let q = query(collection(db, 'modules'));
      if (filters?.teacherId) {
        q = query(collection(db, 'modules'), where('teacherId', '==', filters.teacherId));
      }
      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ModuleAjar));

      if (filters?.subjectId) {
        results = results.filter(r => r.subjectId === filters.subjectId);
      }
      if (filters?.classId) {
        results = results.filter(r => r.classId === filters.classId);
      }
      if (filters?.academicYear) {
        results = results.filter(r => r.academicYear === filters.academicYear);
      }
      if (filters?.semester) {
        results = results.filter(r => r.semester === filters.semester);
      }
      return results;
    } catch (err) {
      console.warn('Error fetching Modules:', err);
      return [];
    }
  },

  async getModuleById(id: string): Promise<ModuleAjar | null> {
    try {
      const docRef = doc(db, 'modules', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as ModuleAjar;
    } catch (err) {
      console.warn('Error fetching Module by id:', err);
      return null;
    }
  },

  async createModule(data: Omit<ModuleAjar, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'modules'), {
      ...data,
      version: data.version || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async updateModule(id: string, data: Partial<ModuleAjar>): Promise<void> {
    const docRef = doc(db, 'modules', id);
    const current = await this.getModuleById(id);
    const newVersion = (current?.version || 1) + 1;
    await updateDoc(docRef, {
      ...data,
      version: newVersion,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteModule(id: string): Promise<void> {
    const docRef = doc(db, 'modules', id);
    await deleteDoc(docRef);
  },

  // ==========================================
  // 7. KKTP
  // ==========================================
  async getKKTPs(filters?: { 
    teacherId?: string; 
    subjectId?: string; 
    classId?: string | null; 
    academicYear?: string; 
    semester?: Semester 
  }): Promise<KKTP[]> {
    try {
      let q = query(collection(db, 'kktp'));
      if (filters?.teacherId) {
        q = query(collection(db, 'kktp'), where('teacherId', '==', filters.teacherId));
      }
      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as KKTP));

      if (filters?.subjectId) {
        results = results.filter(r => r.subjectId === filters.subjectId);
      }
      if (filters?.classId !== undefined) {
        results = results.filter(r => (filters.classId === null ? !r.classId : r.classId === filters.classId));
      }
      if (filters?.academicYear) {
        results = results.filter(r => r.academicYear === filters.academicYear);
      }
      if (filters?.semester) {
        results = results.filter(r => r.semester === filters.semester);
      }
      return results;
    } catch (err) {
      console.warn('Error fetching KKTPs:', err);
      return [];
    }
  },

  async getKKTPById(id: string): Promise<KKTP | null> {
    try {
      const docRef = doc(db, 'kktp', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as KKTP;
    } catch (err) {
      console.warn('Error fetching KKTP by id:', err);
      return null;
    }
  },

  async createKKTP(data: Omit<KKTP, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'kktp'), {
      ...data,
      version: data.version || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async updateKKTP(id: string, data: Partial<KKTP>): Promise<void> {
    const docRef = doc(db, 'kktp', id);
    const current = await this.getKKTPById(id);
    const newVersion = (current?.version || 1) + 1;
    await updateDoc(docRef, {
      ...data,
      version: newVersion,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteKKTP(id: string): Promise<void> {
    const docRef = doc(db, 'kktp', id);
    await deleteDoc(docRef);
  },

  // ==========================================
  // 8. KALENDER AKADEMIK & TEMPLATES
  // ==========================================
  async getAcademicCalendar(academicYear: string, semester: Semester): Promise<AcademicCalendar | null> {
    const docId = `${academicYear.replace('/', '-')}_${semester}`;
    const docRef = doc(db, 'academicCalendar', docId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      // Default fallback months based on semester
      const isGanjil = semester === 'Ganjil';
      const months = isGanjil 
        ? ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
        : ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
      
      const defaultCalendar: AcademicCalendar = {
        id: docId,
        academicYear,
        semester,
        months: months.map(m => ({
          monthName: m,
          effectiveWeeks: 4,
          effectiveDays: 20,
          holidayDays: 4,
          notes: ''
        })),
        events: [
          { date: `${isGanjil ? '2026-07-15' : '2027-01-05'}`, title: 'Hari Pertama Masuk Sekolah / Matsama', type: 'kegiatan' },
          { date: `${isGanjil ? '2026-08-17' : '2027-04-21'}`, title: 'Peringatan Hari Besar', type: 'libur' },
          { date: `${isGanjil ? '2026-09-20' : '2027-03-15'}`, title: 'Asesmen Tengah Semester (STS)', type: 'asesmen' },
          { date: `${isGanjil ? '2026-12-05' : '2027-06-05'}`, title: 'Asesmen Akhir Semester (SAS) / PAT', type: 'ujian' }
        ],
        totalEffectiveWeeks: 20,
        totalEffectiveDays: 100,
        updatedAt: new Date().toISOString()
      };
      return defaultCalendar;
    }
    return { id: snap.id, ...snap.data() } as AcademicCalendar;
  },

  async saveAcademicCalendar(data: AcademicCalendar): Promise<void> {
    const docId = `${data.academicYear.replace('/', '-')}_${data.semester}`;
    const docRef = doc(db, 'academicCalendar', docId);
    await setDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  },

  // ==========================================
  // 9. CHECKLIST & ANALYTICS
  // ==========================================
  async getTeacherAdministrationChecklist(
    teacherId: string, 
    academicYear: string, 
    semester: Semester
  ): Promise<TeacherAdministrationChecklist[]> {
    // 1. Fetch teacher assignments
    const assignments = await assignmentService.getByTeacher(teacherId);
    const activeAssignments = assignments.filter(a => a.status === 'active' && a.academicYear === academicYear && a.semester === semester);
    
    // 2. Fetch all learning docs for teacher
    const [cps, tps, atps, protas, promeses, modules, kktps, subjects, classes, teacher] = await Promise.all([
      this.getLearningPlans({ teacherId, academicYear, semester }),
      this.getLearningObjectives({ teacherId, academicYear, semester }),
      this.getATPs({ teacherId, academicYear, semester }),
      this.getProtas({ teacherId, academicYear }),
      this.getPromesList({ teacherId, academicYear, semester }),
      this.getModules({ teacherId, academicYear, semester }),
      this.getKKTPs({ teacherId, academicYear, semester }),
      subjectService.getAll(),
      classService.getAll(),
      teacherService.getById(teacherId)
    ]);

    const subjectMap = new Map(subjects.map(s => [s.id!, s.name]));
    const classMap = new Map(classes.map(c => [c.id!, c.name]));

    const checklists: TeacherAdministrationChecklist[] = [];

    for (const assign of activeAssignments) {
      const sName = subjectMap.get(assign.subjectId) || 'Mata Pelajaran';
      const cName = classMap.get(assign.classId) || 'Semua Kelas';

      // Check existence
      const hasCP = cps.some(c => c.subjectId === assign.subjectId && (!c.classId || c.classId === assign.classId));
      const hasTP = tps.some(t => t.subjectId === assign.subjectId && (!t.classId || t.classId === assign.classId));
      const hasATP = atps.some(a => a.subjectId === assign.subjectId && (!a.classId || a.classId === assign.classId));
      const hasProta = protas.some(p => p.subjectId === assign.subjectId && (!p.classId || p.classId === assign.classId));
      const hasPromes = promeses.some(pr => pr.subjectId === assign.subjectId && (!pr.classId || pr.classId === assign.classId));
      const hasModule = modules.some(m => m.subjectId === assign.subjectId && m.classId === assign.classId);
      const hasKKTP = kktps.some(k => k.subjectId === assign.subjectId && (!k.classId || k.classId === assign.classId));

      const itemsChecked = [hasCP, hasTP, hasATP, hasProta, hasPromes, hasModule, hasKKTP];
      const completedCount = itemsChecked.filter(Boolean).length;
      const completionPercentage = Math.round((completedCount / 7) * 100);

      checklists.push({
        assignmentId: assign.id || `${assign.teacherId}_${assign.subjectId}_${assign.classId}`,
        teacherId,
        teacherName: teacher?.name || 'Guru',
        subjectId: assign.subjectId,
        subjectName: sName,
        classId: assign.classId,
        className: cName,
        academicYear,
        semester,
        hasCP,
        hasTP,
        hasATP,
        hasProta,
        hasPromes,
        hasModule,
        hasKKTP,
        completionPercentage
      });
    }

    return checklists;
  },

  async getGlobalAdministrationStats(academicYear: string, semester: Semester) {
    const [cps, tps, atps, protas, promeses, modules, kktps, teachers, assignments] = await Promise.all([
      this.getLearningPlans({ academicYear, semester }),
      this.getLearningObjectives({ academicYear, semester }),
      this.getATPs({ academicYear, semester }),
      this.getProtas({ academicYear }),
      this.getPromesList({ academicYear, semester }),
      this.getModules({ academicYear, semester }),
      this.getKKTPs({ academicYear, semester }),
      teacherService.getAll(),
      assignmentService.getAll()
    ]);

    const activeAssignments = assignments.filter(a => a.status === 'active' && a.academicYear === academicYear && a.semester === semester);
    
    // Total documents
    const stats = {
      totalCP: cps.length,
      totalTP: tps.length,
      totalATP: atps.length,
      totalProta: protas.length,
      totalPromes: promeses.length,
      totalModule: modules.length,
      totalKKTP: kktps.length,
      totalTeachers: teachers.length,
      incompleteTeachersCount: 0,
      teachersProgress: [] as { teacher: any; percent: number; incompleteCount: number }[]
    };

    // Calculate teacher progress
    for (const t of teachers) {
      const tAssigns = activeAssignments.filter(a => a.teacherId === t.id);
      if (tAssigns.length === 0) continue;

      let totalTasks = tAssigns.length * 7;
      let finishedTasks = 0;

      for (const assign of tAssigns) {
        if (cps.some(c => c.teacherId === t.id && c.subjectId === assign.subjectId)) finishedTasks++;
        if (tps.some(tp => tp.teacherId === t.id && tp.subjectId === assign.subjectId)) finishedTasks++;
        if (atps.some(a => a.teacherId === t.id && a.subjectId === assign.subjectId)) finishedTasks++;
        if (protas.some(p => p.teacherId === t.id && p.subjectId === assign.subjectId)) finishedTasks++;
        if (promeses.some(pr => pr.teacherId === t.id && pr.subjectId === assign.subjectId)) finishedTasks++;
        if (modules.some(m => m.teacherId === t.id && m.subjectId === assign.subjectId && m.classId === assign.classId)) finishedTasks++;
        if (kktps.some(k => k.teacherId === t.id && k.subjectId === assign.subjectId)) finishedTasks++;
      }

      const percent = totalTasks > 0 ? Math.round((finishedTasks / totalTasks) * 100) : 0;
      if (percent < 100) {
        stats.incompleteTeachersCount++;
      }
      stats.teachersProgress.push({
        teacher: t,
        percent,
        incompleteCount: totalTasks - finishedTasks
      });
    }

    return stats;
  },

  // ==========================================
  // 9. DOCUMENT TEMPLATES & BANK
  // ==========================================
  async getTemplates(filters?: { type?: string; subjectCategory?: string }): Promise<DocumentTemplate[]> {
    try {
      const q = query(collection(db, 'documentTemplates'));
      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DocumentTemplate));

      if (filters?.type && filters.type !== 'all') {
        results = results.filter(r => r.type === filters.type);
      }
      if (filters?.subjectCategory && filters.subjectCategory !== 'all') {
        results = results.filter(r => r.subjectCategory === filters.subjectCategory);
      }
      return results;
    } catch (err) {
      console.warn('Error fetching templates:', err);
      return [];
    }
  },

  async getTemplateById(id: string): Promise<DocumentTemplate | null> {
    try {
      const docRef = doc(db, 'documentTemplates', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as DocumentTemplate;
    } catch (err) {
      console.warn('Error fetching template by id:', err);
      return null;
    }
  },

  async createTemplate(data: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'documentTemplates'), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async updateTemplate(id: string, data: Partial<DocumentTemplate>): Promise<void> {
    const docRef = doc(db, 'documentTemplates', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteTemplate(id: string): Promise<void> {
    const docRef = doc(db, 'documentTemplates', id);
    await deleteDoc(docRef);
  }
};
