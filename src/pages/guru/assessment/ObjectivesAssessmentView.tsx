import React, { useState, useEffect } from 'react';
import { 
  Award, Filter, Users, CheckCircle2, AlertCircle, 
  Printer, BookOpen, ChevronRight, BarChart3 
} from 'lucide-react';
import { assessmentService } from '../../../services/assessmentService';
import { learningService } from '../../../services/learningService';
import { studentService } from '../../../services/studentService';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { Assessment, Grade } from '../../../types/assessment';
import type { LearningObjective } from '../../../types/learning';
import type { Student } from '../../../types/academic';

export const ObjectivesAssessmentView: React.FC = () => {
  const { teacherId, teacherName, subjects, classes, academicYear, semester, loading: assignLoading } = useTeacherAssignments();

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const [tps, setTps] = useState<LearningObjective[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(false);

  // Selected TP for drill-down view
  const [selectedTpId, setSelectedTpId] = useState<string | null>(null);

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [classes, subjects]);

  useEffect(() => {
    if (selectedClassId && selectedSubjectId) {
      loadData();
    }
  }, [selectedClassId, selectedSubjectId, academicYear, semester]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tpList, studentList, assessList, gradeList] = await Promise.all([
        learningService.getLearningObjectives({
          teacherId,
          subjectId: selectedSubjectId,
          academicYear,
          semester
        }),
        studentService.getByClass(selectedClassId),
        assessmentService.getAssessments({
          teacherId,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          academicYear,
          semester
        }),
        assessmentService.getGradesByClassSubject(selectedClassId, selectedSubjectId, academicYear, semester)
      ]);

      setTps(tpList);
      setStudents(studentList);
      setAssessments(assessList);
      setGrades(gradeList);
      if (tpList.length > 0 && !selectedTpId) {
        setSelectedTpId(tpList[0].id || null);
      }
    } catch (err) {
      console.error('Error loading TP assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Grade Map
  const gradesMap: { [studentId_assessmentId: string]: number } = {};
  grades.forEach(g => {
    if (g.score !== undefined && g.score !== null) {
      gradesMap[`${g.studentId}_${g.assessmentId}`] = g.score;
    }
  });

  // Calculate Student Average for a given TP
  const getStudentTpScore = (studentId: string, tpId: string): number | null => {
    const matchingAssessments = assessments.filter(a => a.objectiveIds && a.objectiveIds.includes(tpId));
    if (matchingAssessments.length === 0) return null;

    let sum = 0;
    let weightSum = 0;
    matchingAssessments.forEach(a => {
      const sc = gradesMap[`${studentId}_${a.id}`];
      if (sc !== undefined) {
        const w = a.weight || 1;
        sum += sc * w;
        weightSum += w;
      }
    });

    return weightSum > 0 ? Math.round(sum / weightSum) : null;
  };

  const currentClassName = classes.find(c => c.id === selectedClassId)?.name || 'Kelas';
  const currentSubjectName = subjects.find(s => s.id === selectedSubjectId)?.name || 'Mata Pelajaran';
  const selectedTp = tps.find(t => t.id === selectedTpId);

  return (
    <div className="space-y-6">
      {/* Top Filter Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-emerald-600" />
              <span>Analisis Nilai per Tujuan Pembelajaran (TP)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau penguasaan dan ketuntasan capaian siswa pada setiap TP Kurikulum Merdeka
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Analisis TP</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pilih Kelas / Rombel
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pilih Mata Pelajaran
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading || assignLoading ? (
        <div className="flex justify-center p-16">
          <LoadingSpinner />
        </div>
      ) : tps.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800">Belum Ada Tujuan Pembelajaran (TP)</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Buat Tujuan Pembelajaran di menu Administrasi &bull; TP untuk mata pelajaran {currentSubjectName}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: TP List */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Daftar Tujuan Pembelajaran ({tps.length} TP)
            </h2>

            <div className="space-y-2">
              {tps.map(tp => {
                const isSelected = tp.id === selectedTpId;
                const assessCount = assessments.filter(a => a.objectiveIds && a.objectiveIds.includes(tp.id || '')).length;

                return (
                  <div
                    key={tp.id}
                    onClick={() => setSelectedTpId(tp.id || null)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-md' 
                        : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        isSelected ? 'bg-emerald-950/60 text-emerald-200 border border-emerald-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {tp.code}
                      </span>
                      <span className={`text-[10px] ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>
                        {assessCount} Asesmen Terkait
                      </span>
                    </div>

                    <h3 className="font-bold text-xs line-clamp-2 leading-relaxed">
                      {tp.title}
                    </h3>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Student Mastery per TP */}
          <div className="lg:col-span-2 space-y-4">
            {selectedTp && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-black rounded-lg">
                      {selectedTp.code}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {currentSubjectName} &bull; {currentClassName}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900 mt-1.5">
                    {selectedTp.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedTp.description || 'Penguasaan kompetensi dasar dan pemahaman materi.'}
                  </p>
                </div>

                {/* Table of Students */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-2.5 px-3 w-10 text-center">No</th>
                          <th className="py-2.5 px-3">Nama Siswa</th>
                          <th className="py-2.5 px-3 w-28 text-center">Skor Rata-rata</th>
                          <th className="py-2.5 px-3 w-36 text-center">Tingkat Capaian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {students.map((student, idx) => {
                          const score = getStudentTpScore(student.id || '', selectedTp.id || '');
                          let badgeText = 'Belum Ada Nilai';
                          let badgeStyle = 'bg-slate-100 text-slate-500';

                          if (score !== null) {
                            if (score >= 85) {
                              badgeText = 'Sangat Berkembang';
                              badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                            } else if (score >= 75) {
                              badgeText = 'Tercapai Sesuai';
                              badgeStyle = 'bg-teal-100 text-teal-800 border-teal-200';
                            } else if (score >= 65) {
                              badgeText = 'Mulai Berkembang';
                              badgeStyle = 'bg-amber-100 text-amber-800 border-amber-200';
                            } else {
                              badgeText = 'Perlu Pendampingan';
                              badgeStyle = 'bg-rose-100 text-rose-800 border-rose-200';
                            }
                          }

                          return (
                            <tr key={student.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 text-center text-slate-400 font-bold">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-800">
                                {student.name}
                              </td>
                              <td className="py-2.5 px-3 text-center font-extrabold text-sm">
                                {score !== null ? score : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                                  {badgeText}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
