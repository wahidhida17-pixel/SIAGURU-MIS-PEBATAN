import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, Printer, Filter, Users, 
  Award, ChevronRight, Eye, Lock, Unlock, AlertCircle, 
  HelpCircle, CheckCircle2, TrendingUp, Sparkles 
} from 'lucide-react';
import { assessmentService } from '../../../services/assessmentService';
import { studentService } from '../../../services/studentService';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';
import { excelAssessmentUtils } from '../../../utils/excelAssessmentUtils';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { Assessment, Grade, AssessmentConfig } from '../../../types/assessment';
import type { Student } from '../../../types/academic';

export const GradeRecapView: React.FC = () => {
  const { teacherId, teacherName, subjects, classes, academicYear, semester, loading: assignLoading } = useTeacherAssignments();

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [rounding, setRounding] = useState<'0' | '1' | '2'>('1');

  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [config, setConfig] = useState<AssessmentConfig | null>(null);
  const [loading, setLoading] = useState(false);

  // Student Profile Detail Modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

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
      loadRecapData();
    }
  }, [selectedClassId, selectedSubjectId, academicYear, semester]);

  const loadRecapData = async () => {
    try {
      setLoading(true);
      const [classList, assessList, gradeList, conf] = await Promise.all([
        studentService.getByClass(selectedClassId),
        assessmentService.getAssessments({
          teacherId,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          academicYear,
          semester
        }),
        assessmentService.getGradesByClassSubject(selectedClassId, selectedSubjectId, academicYear, semester),
        assessmentService.getAssessmentConfig(academicYear, semester)
      ]);

      setStudents(classList);
      setAssessments(assessList);
      setGrades(gradeList);
      setConfig(conf);
      if (conf?.rounding) {
        setRounding(conf.rounding);
      }
    } catch (err) {
      console.error('Error loading grade recap:', err);
    } finally {
      setLoading(false);
    }
  };

  // Grade Lookup Map
  const gradesMap: { [studentId_assessmentId: string]: number } = {};
  grades.forEach(g => {
    if (g.score !== undefined && g.score !== null) {
      gradesMap[`${g.studentId}_${g.assessmentId}`] = g.score;
    }
  });

  // Calculate Student Averages
  const formatNumber = (num: number, decimals: '0' | '1' | '2') => {
    if (decimals === '0') return Math.round(num).toString();
    if (decimals === '1') return (Math.round(num * 10) / 10).toFixed(1);
    return (Math.round(num * 100) / 100).toFixed(2);
  };

  const calculateStudentFinal = (studentId: string): { final: number; finalFormatted: string; formatifAvg: number; sumatifAvg: number } => {
    if (assessments.length === 0) return { final: 0, finalFormatted: '-', formatifAvg: 0, sumatifAvg: 0 };

    let formatifSum = 0;
    let formatifWeight = 0;
    let sumatifSum = 0;
    let sumatifWeight = 0;

    let totalWeightedScore = 0;
    let totalWeight = 0;

    assessments.forEach(a => {
      const score = gradesMap[`${studentId}_${a.id}`];
      if (score !== undefined) {
        const w = a.weight || 1;
        totalWeightedScore += score * w;
        totalWeight += w;

        if (a.type.toLowerCase().includes('formatif') || a.type.toLowerCase().includes('tugas')) {
          formatifSum += score * w;
          formatifWeight += w;
        } else {
          sumatifSum += score * w;
          sumatifWeight += w;
        }
      }
    });

    if (totalWeight === 0) return { final: 0, finalFormatted: '-', formatifAvg: 0, sumatifAvg: 0 };

    const final = totalWeightedScore / totalWeight;
    const formatifAvg = formatifWeight > 0 ? formatifSum / formatifWeight : 0;
    const sumatifAvg = sumatifWeight > 0 ? sumatifSum / sumatifWeight : 0;

    return {
      final,
      finalFormatted: formatNumber(final, rounding),
      formatifAvg,
      sumatifAvg
    };
  };

  // Class Summary Stats
  const studentAveragesObj: { [id: string]: number } = {};
  const studentFinalScores: number[] = [];

  students.forEach(s => {
    const res = calculateStudentFinal(s.id || '');
    if (res.finalFormatted !== '-') {
      studentAveragesObj[s.id || ''] = res.final;
      studentFinalScores.push(res.final);
    }
  });

  const classAvg = studentFinalScores.length > 0 
    ? (studentFinalScores.reduce((a, b) => a + b, 0) / studentFinalScores.length)
    : 0;
  const classHighest = studentFinalScores.length > 0 ? Math.max(...studentFinalScores) : 0;
  const classLowest = studentFinalScores.length > 0 ? Math.min(...studentFinalScores) : 0;

  const currentClassName = classes.find(c => c.id === selectedClassId)?.name || 'Kelas';
  const currentSubjectName = subjects.find(s => s.id === selectedSubjectId)?.name || 'Mata Pelajaran';

  const handleExportExcel = () => {
    excelAssessmentUtils.exportRecapMatrixToExcel(
      currentClassName,
      currentSubjectName,
      academicYear,
      semester,
      students,
      assessments,
      gradesMap,
      studentAveragesObj
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Control Panel */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
              <span>Rekapitulasi Nilai Siswa</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Matriks penilaian hasil belajar lengkap &bull; TP {academicYear} ({semester})
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekap A4</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
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

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Aturan Pembulatan Nilai
            </label>
            <select
              value={rounding}
              onChange={(e) => setRounding(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="0">0 Desimal (Bulat, cth: 85)</option>
              <option value="1">1 Desimal (cth: 84.6)</option>
              <option value="2">2 Desimal (cth: 84.62)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printable Formal Header */}
      <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider">YAYASAN PENDIDIKAN ISLAM SYURIYAH PEBATAN</h2>
        <h1 className="text-lg font-black uppercase">MADRASAH IBTIDAIYAH (MI) SYURIYAH PEBATAN</h1>
        <p className="text-xs text-slate-600">Alamat: Jl. Raya Pebatan No. 12, Kec. Pebatan, Kab. Brebes</p>
        <div className="mt-3 text-sm font-bold underline">
          REKAPITULASI NILAI ASESMEN PEMBELAJARAN
        </div>
        <div className="mt-1 flex justify-between text-xs font-medium px-4">
          <span>Mata Pelajaran: {currentSubjectName}</span>
          <span>Kelas: {currentClassName}</span>
          <span>Semester: {semester} - TP {academicYear}</span>
        </div>
      </div>

      {/* Class Statistics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Rata-Rata Kelas</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{formatNumber(classAvg, rounding)}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Nilai Tertinggi</p>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{formatNumber(classHighest, rounding)}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Nilai Terendah</p>
            <p className="text-xl font-black text-amber-700 mt-0.5">{formatNumber(classLowest, rounding)}</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Jumlah Asesmen</p>
            <p className="text-xl font-black text-blue-700 mt-0.5">{assessments.length}</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recap Table */}
      {loading || assignLoading ? (
        <div className="flex justify-center p-16">
          <LoadingSpinner />
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800">Tidak ada siswa ditemukan di kelas ini</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between print:hidden">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tabel Matriks Nilai &bull; {currentSubjectName} ({currentClassName})
            </h2>
            <span className="text-xs text-slate-500">Klik baris siswa untuk melihat detail profil</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs print:text-[10px]">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px] print:bg-slate-200">
                  <th className="py-3 px-3 w-10 text-center border-r border-slate-200">No</th>
                  <th className="py-3 px-3 w-24 border-r border-slate-200">NIS</th>
                  <th className="py-3 px-4 min-w-[180px] border-r border-slate-200">Nama Siswa</th>
                  {assessments.map((a, idx) => (
                    <th key={a.id} className="py-3 px-3 text-center border-r border-slate-200 min-w-[90px]">
                      <div className="line-clamp-1" title={a.title}>{a.title}</div>
                      <div className="text-[9px] font-normal text-slate-500">
                        {a.type} (x{a.weight})
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center bg-emerald-50/80 text-emerald-950 font-black border-r border-emerald-200 w-24">
                    Nilai Akhir
                  </th>
                  <th className="py-3 px-3 text-center w-28 print:hidden">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student, sIdx) => {
                  const finalRes = calculateStudentFinal(student.id || '');
                  return (
                    <tr
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className="hover:bg-emerald-50/50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500 border-r border-slate-100">
                        {student.absentNumber || sIdx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 border-r border-slate-100">
                        {student.nis || '-'}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-800 border-r border-slate-100">
                        {student.name}
                      </td>
                      {assessments.map((a) => {
                        const score = gradesMap[`${student.id}_${a.id}`];
                        return (
                          <td key={a.id} className="py-2.5 px-3 text-center font-semibold border-r border-slate-100">
                            {score !== undefined ? (
                              <span className={score >= 75 ? 'text-emerald-800' : score >= 65 ? 'text-amber-700' : 'text-rose-700'}>
                                {score}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3 text-center font-black text-emerald-900 bg-emerald-50/40 border-r border-emerald-200 text-sm">
                        {finalRes.finalFormatted}
                      </td>
                      <td className="py-2.5 px-3 text-center print:hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(student);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Profil</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Printable Signature Footer */}
          <div className="hidden print:grid grid-cols-2 mt-8 pt-8 text-center text-xs">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold">Kepala Madrasah</p>
              <div className="h-16"></div>
              <p className="font-bold underline">H. AHMAD ROFIQ, S.Pd.I</p>
              <p className="text-[10px]">NIP. 197804122005011002</p>
            </div>
            <div>
              <p>Pebatan, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="font-bold">Guru Mata Pelajaran</p>
              <div className="h-16"></div>
              <p className="font-bold underline">{teacherName}</p>
              <p className="text-[10px]">NIP/NUPTK: -</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Student Assessment Profile */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">Profil Penilaian Siswa</span>
                <h3 className="font-extrabold text-slate-900 text-lg">{selectedStudent.name}</h3>
                <p className="text-xs text-slate-500">NIS: {selectedStudent.nis || '-'} &bull; Kelas: {currentClassName}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 text-center">
                <div>
                  <p className="text-slate-500 font-bold uppercase text-[10px]">Nilai Rata-Rata Akhir</p>
                  <p className="text-2xl font-black text-emerald-900 mt-1">
                    {calculateStudentFinal(selectedStudent.id || '').finalFormatted}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-bold uppercase text-[10px]">Mata Pelajaran</p>
                  <p className="text-sm font-black text-slate-800 mt-2">{currentSubjectName}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-xs mb-2">Riwayat Seluruh Asesmen</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {assessments.map(a => {
                    const sc = gradesMap[`${selectedStudent.id}_${a.id}`];
                    return (
                      <div key={a.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <p className="font-bold text-slate-800">{a.title}</p>
                          <p className="text-[11px] text-slate-500">{a.type} &bull; Tgl: {a.date} &bull; Bobot: {a.weight}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-base font-black px-2.5 py-0.5 rounded-lg ${
                            sc !== undefined && sc >= 75 
                              ? 'bg-emerald-100 text-emerald-900' 
                              : sc !== undefined 
                              ? 'bg-amber-100 text-amber-900' 
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            {sc !== undefined ? sc : '-'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
