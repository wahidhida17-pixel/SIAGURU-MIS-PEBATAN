import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileCheck2, CheckCircle2, AlertCircle, ArrowRight, 
  BookOpen, Sparkles, Activity, ShieldCheck, Lock 
} from 'lucide-react';
import { assessmentService } from '../../../services/assessmentService';
import { studentService } from '../../../services/studentService';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { Assessment, Grade, StudentDescription } from '../../../types/assessment';

interface SubjectPrepStatus {
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  totalStudents: number;
  assessmentsCount: number;
  gradesEntered: number;
  gradesExpected: number;
  gradesComplete: boolean;
  descriptionsEntered: number;
  descriptionsComplete: boolean;
  isReady: boolean;
}

export const GuruRaporPrepView: React.FC = () => {
  const { teacherId, teacherName, assignments, academicYear, semester, loading: assignLoading } = useTeacherAssignments();

  const [prepStatuses, setPrepStatuses] = useState<SubjectPrepStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrepData();
  }, [teacherId, assignments, academicYear, semester]);

  const loadPrepData = async () => {
    try {
      setLoading(true);
      const [allAssessments, allGrades, allStudents] = await Promise.all([
        assessmentService.getAssessments({ teacherId, academicYear, semester }),
        assessmentService.getGradesByStudent('all', academicYear, semester).catch(() => []),
        studentService.getAll()
      ]);

      const list: SubjectPrepStatus[] = [];

      for (const assign of assignments) {
        const classStudents = allStudents.filter(s => s.classId === assign.classId);
        const subjectAssessments = allAssessments.filter(
          a => a.subjectId === assign.subjectId && a.classId === assign.classId
        );

        const descs = await assessmentService.getStudentDescriptions({
          classId: assign.classId,
          subjectId: assign.subjectId,
          academicYear,
          semester
        });

        const assessCount = subjectAssessments.length;
        const totalStudents = classStudents.length;
        const gradesExpected = assessCount * totalStudents;

        // Fetch actual grades for this subject-class
        const subjectGrades = await assessmentService.getGradesByClassSubject(
          assign.classId,
          assign.subjectId,
          academicYear,
          semester
        );

        const gradesEntered = subjectGrades.filter(g => g.score !== undefined && g.score !== null).length;
        const gradesComplete = gradesExpected > 0 && gradesEntered >= gradesExpected;
        const descriptionsEntered = descs.filter(d => d.finalDescription && d.finalDescription.trim() !== '').length;
        const descriptionsComplete = totalStudents > 0 && descriptionsEntered >= totalStudents;

        const isReady = gradesComplete && descriptionsComplete;

        list.push({
          subjectId: assign.subjectId,
          subjectName: assign.subjectName || 'Mata Pelajaran',
          classId: assign.classId,
          className: assign.className || 'Kelas',
          totalStudents,
          assessmentsCount: assessCount,
          gradesEntered,
          gradesExpected,
          gradesComplete,
          descriptionsEntered,
          descriptionsComplete,
          isReady
        });
      }

      setPrepStatuses(list);
    } catch (err) {
      console.error('Error loading prep statuses:', err);
    } finally {
      setLoading(false);
    }
  };

  const allReady = prepStatuses.length > 0 && prepStatuses.every(s => s.isReady);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-emerald-600" />
              <span>Persiapan Rapor Hasil Belajar</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verifikasi kelengkapan nilai asesmen dan deskripsi capaian sebelum sinkronisasi rapor &bull; TP {academicYear} ({semester})
            </p>
          </div>

          <div className="flex items-center gap-2">
            {allReady ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Semua Kelas Siap Cetak Rapor</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Masih Ada Isian Belum Lengkap</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Cards per Assignment */}
      {loading || assignLoading ? (
        <div className="flex justify-center p-16">
          <LoadingSpinner />
        </div>
      ) : prepStatuses.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800">Tidak ada data penugasan mengajar</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {prepStatuses.map((item, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs space-y-4 transition-all ${
                item.isReady ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-md">
                      {item.className}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{item.totalStudents} Siswa Terdaftar</span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base mt-1">
                    {item.subjectName}
                  </h3>
                </div>

                <div>
                  {item.isReady ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" /> Siap Rapor
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200">
                      <AlertCircle className="w-4 h-4" /> Perlu Dilengkapi
                    </span>
                  )}
                </div>
              </div>

              {/* Checklist Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* 1. Asesmen */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Jumlah Asesmen</span>
                    <span className="font-extrabold text-emerald-700">{item.assessmentsCount}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {item.assessmentsCount > 0 ? 'Asesmen telah dibuat' : 'Belum membuat asesmen'}
                  </p>
                </div>

                {/* 2. Nilai Siswa */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Keterisian Nilai</span>
                    <span className={`font-extrabold ${item.gradesComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {item.gradesEntered} / {item.gradesExpected}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {item.gradesComplete ? 'Seluruh nilai terisi lengkap' : 'Ada nilai siswa yang kosong'}
                  </p>
                </div>

                {/* 3. Deskripsi Capaian */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Deskripsi Capaian</span>
                    <span className={`font-extrabold ${item.descriptionsComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {item.descriptionsEntered} / {item.totalStudents}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {item.descriptionsComplete ? 'Deskripsi rapor lengkap' : 'Belum diisi / belum digenerate'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-2 text-xs">
                <Link
                  to="/guru/assessment/list"
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Kelola Asesmen
                </Link>

                <Link
                  to="/guru/assessment/descriptions"
                  className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold rounded-xl transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Isi Deskripsi</span>
                </Link>

                <Link
                  to="/guru/assessment/recap"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-colors shadow-xs"
                >
                  Lihat Rekap
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
