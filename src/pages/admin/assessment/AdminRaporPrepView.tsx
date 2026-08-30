import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, CheckCircle2, AlertCircle, Lock, 
  Unlock, BookOpen, Users, ArrowRight, ShieldCheck, Printer 
} from 'lucide-react';
import { assessmentService } from '../../../services/assessmentService';
import { classService } from '../../../services/classService';
import { subjectService } from '../../../services/subjectService';
import { studentService } from '../../../services/studentService';
import { assignmentService } from '../../../services/assignmentService';
import { useAuth } from '../../../hooks/useAuth';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { Class, Subject, Student, Assignment } from '../../../types/academic';
import type { Assessment, Grade } from '../../../types/assessment';

interface ClassRaporStatus {
  classId: string;
  className: string;
  totalStudents: number;
  totalSubjects: number;
  completedSubjects: number;
  isAllGradesFilled: boolean;
  isAllDescriptionsFilled: boolean;
  isLocked: boolean;
  isReady: boolean;
}

export const AdminRaporPrepView: React.FC = () => {
  const { userProfile } = useAuth();

  const [classStatuses, setClassStatuses] = useState<ClassRaporStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lockingAll, setLockingAll] = useState(false);

  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  useEffect(() => {
    loadRaporPrep();
  }, [academicYear, semester]);

  const loadRaporPrep = async () => {
    try {
      setLoading(true);
      const [classes, allAssignments, students, assessments] = await Promise.all([
        classService.getAll(),
        assignmentService.getAll(),
        studentService.getAll(),
        assessmentService.getAssessments({ academicYear, semester })
      ]);

      const assignments = allAssignments.filter(
        a => a.academicYear === academicYear && a.semester === semester
      );

      const list: ClassRaporStatus[] = [];

      for (const cls of classes) {
        const classStudents = students.filter(s => s.classId === cls.id);
        const classAssigns = assignments.filter(a => a.classId === cls.id);
        const classAssessments = assessments.filter(a => a.classId === cls.id);

        let completedSubjects = 0;

        for (const assign of classAssigns) {
          const subAssess = classAssessments.filter(a => a.subjectId === assign.subjectId);
          if (subAssess.length > 0) {
            completedSubjects++;
          }
        }

        const isAllLocked = classAssessments.length > 0 && classAssessments.every(a => a.isLocked);
        const isReady = classAssigns.length > 0 && completedSubjects >= classAssigns.length;

        list.push({
          classId: cls.id || '',
          className: cls.name,
          totalStudents: classStudents.length,
          totalSubjects: classAssigns.length,
          completedSubjects,
          isAllGradesFilled: completedSubjects >= classAssigns.length,
          isAllDescriptionsFilled: completedSubjects >= classAssigns.length,
          isLocked: isAllLocked,
          isReady
        });
      }

      setClassStatuses(list);
    } catch (err) {
      console.error('Error loading admin rapor prep:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFreezeAll = async (lock: boolean) => {
    const actionName = lock ? 'KUNCI (FREEZE)' : 'BUKA KUNCI';
    if (window.confirm(`Apakah Anda yakin ingin ${actionName} seluruh nilai asesmen di madrasah untuk semester ${semester} TP ${academicYear}?`)) {
      try {
        setLockingAll(true);
        const allAssess = await assessmentService.getAssessments({ academicYear, semester });
        for (const a of allAssess) {
          if (a.id) {
            await assessmentService.toggleLockAssessment(a.id, lock, {
              uid: userProfile?.uid || 'admin',
              name: userProfile?.displayName || 'Administrator'
            });
          }
        }
        alert(`Seluruh asesmen berhasil di-${lock ? 'kunci' : 'buka'}.`);
        loadRaporPrep();
      } catch (err: any) {
        alert('Gagal: ' + (err?.message || 'Error'));
      } finally {
        setLockingAll(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-emerald-600" />
            <span>Verifikasi & Kesiapan Rapor Madrasah</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit kesiapan data nilai dan deskripsi seluruh rombel sebelum finalisasi rapor &bull; TP {academicYear} ({semester})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleToggleFreezeAll(true)}
            disabled={lockingAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            <Lock className="w-4 h-4 text-amber-700" />
            <span>{lockingAll ? 'Memproses...' : 'Kunci Seluruh Nilai (Freeze)'}</span>
          </button>

          <button
            onClick={() => handleToggleFreezeAll(false)}
            disabled={lockingAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            <Unlock className="w-4 h-4 text-slate-600" />
            <span>Buka Kunci</span>
          </button>
        </div>
      </div>

      {/* Class Readiness Cards */}
      {loading ? (
        <div className="flex justify-center p-16">
          <LoadingSpinner />
        </div>
      ) : classStatuses.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800">Belum ada data kelas</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classStatuses.map((cls, idx) => (
            <div
              key={cls.classId || idx}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all ${
                cls.isReady ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{cls.className}</h3>
                    <p className="text-[11px] text-slate-500 font-medium">{cls.totalStudents} Siswa Terdaftar</p>
                  </div>
                  {cls.isReady ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Siap Cetak
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Belum Lengkap
                    </span>
                  )}
                </div>

                <div className="space-y-2 pt-3 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Mata Pelajaran Aktif:</span>
                    <strong className="text-slate-800">{cls.totalSubjects} Mapel</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Mapel Selesai Dinilai:</span>
                    <strong className={cls.completedSubjects >= cls.totalSubjects && cls.totalSubjects > 0 ? 'text-emerald-700' : 'text-amber-700'}>
                      {cls.completedSubjects} / {cls.totalSubjects} Mapel
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Status Nilai:</span>
                    {cls.isLocked ? (
                      <span className="text-amber-700 font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Dikunci
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Unlock className="w-3 h-3" /> Terbuka
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs flex justify-between items-center">
                <span className="text-[11px] text-slate-400">Verifikasi Tahap 5</span>
                <span className="text-emerald-700 font-bold text-[11px]">Terverifikasi Sistem &bull; OK</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
