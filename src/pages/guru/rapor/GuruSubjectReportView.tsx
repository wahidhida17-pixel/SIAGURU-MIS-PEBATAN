import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Award,
  Users,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
  Search,
  FileEdit,
  Send,
  X
} from 'lucide-react';
import { reportService } from '../../../services/reportService';
import { assignmentService } from '../../../services/assignmentService';
import { classService } from '../../../services/classService';
import { subjectService } from '../../../services/subjectService';
import { assessmentService } from '../../../services/assessmentService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useAuth } from '../../../hooks/useAuth';
import type { Assignment } from '../../../types/academic';
import type { Report } from '../../../types/report';

export const GuruSubjectReportView: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [reports, setReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Correction Request Modal
  const [requestModalStudent, setRequestModalStudent] = useState<{
    reportId: string;
    studentId: string;
    studentName: string;
    currentScore: number;
  } | null>(null);
  const [proposedValue, setProposedValue] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadTeacherAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignmentId) {
      loadReportsForAssignment();
    }
  }, [selectedAssignmentId]);

  const loadTeacherAssignments = async () => {
    try {
      setLoading(true);
      const allAssignments = await assignmentService.getAll();
      // filter teacher assignments
      const myAssignments = allAssignments.filter(
        a => a.teacherId === userProfile?.uid
      );

      const activeList = myAssignments.length > 0 ? myAssignments : allAssignments; // fallback for preview
      setAssignments(activeList);
      if (activeList.length > 0) {
        setSelectedAssignmentId(activeList[0].id || '');
      }
    } catch (error) {
      console.error('Error loading teacher assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReportsForAssignment = async () => {
    const currentAssign = assignments.find(a => a.id === selectedAssignmentId);
    if (!currentAssign) return;

    try {
      setLoading(true);
      const list = await reportService.getReports({
        classId: currentAssign.classId,
        academicYear: currentAssign.academicYear,
        semester: currentAssign.semester
      });
      setReports(list);
    } catch (error) {
      console.error('Error loading subject reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCorrection = (rep: Report, currentScore: number) => {
    setRequestModalStudent({
      reportId: rep.id,
      studentId: rep.studentId,
      studentName: rep.studentName,
      currentScore
    });
    setProposedValue(currentScore);
    setReason('');
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestModalStudent) return;
    const currentAssign = assignments.find(a => a.id === selectedAssignmentId);
    if (!currentAssign) return;

    try {
      setSubmittingRequest(true);
      await reportService.createGradeChangeRequest(
        {
          reportId: requestModalStudent.reportId,
          studentId: requestModalStudent.studentId,
          studentName: requestModalStudent.studentName,
          classId: currentAssign.classId,
          className: currentAssign.className,
          subjectId: currentAssign.subjectId,
          subjectName: currentAssign.subjectName,
          teacherId: userProfile?.uid || 'guru',
          teacherName: userProfile?.name || 'Guru Pengampu',
          oldValue: requestModalStudent.currentScore,
          proposedValue,
          reason,
          academicYear: currentAssign.academicYear,
          semester: currentAssign.semester
        },
        { uid: userProfile?.uid || 'guru', name: userProfile?.name || 'Guru' }
      );

      setSuccessMessage('Permohonan perbaikan nilai berhasil dikirimkan kepada Admin.');
      setTimeout(() => setSuccessMessage(null), 4000);
      setRequestModalStudent(null);
    } catch (error: any) {
      alert(error.message || 'Gagal mengajukan perbaikan nilai.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const currentAssignment = assignments.find(a => a.id === selectedAssignmentId);

  const filteredReports = reports.filter(r =>
    (r.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.studentNis || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && assignments.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
              Guru Mata Pelajaran
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kesiapan Nilai Rapor Mata Pelajaran</h1>
          <p className="text-sm text-slate-500">
            Pratinjau nilai akhir dan deskripsi capaian kompetensi siswa yang ditarik ke dalam lembar rapor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAssignmentId}
            onChange={e => setSelectedAssignmentId(e.target.value)}
            className="text-xs font-bold border border-slate-300 rounded-xl p-2.5 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            {assignments.map(a => (
              <option key={a.id} value={a.id}>
                {a.subjectName} — Kelas {a.className} ({a.academicYear} {a.semester})
              </option>
            ))}
          </select>

          <button
            onClick={loadReportsForAssignment}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {/* Table Nilai & Deskripsi Rapor */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold uppercase tracking-wider text-slate-700">
              {currentAssignment?.subjectName} — Kelas {currentAssignment?.className}
            </span>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Nilai ditarik otomatis dari kalkulasi asesmen formatif & sumatif
            </p>
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari siswa..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4 w-10 text-center">No</th>
                <th className="py-3 px-4 w-48">Nama Siswa</th>
                <th className="py-3 px-4 text-center w-24">Nilai Akhir</th>
                <th className="py-3 px-4 text-center w-20">Predikat</th>
                <th className="py-3 px-4">Deskripsi Capaian Kompetensi pada Rapor</th>
                <th className="py-3 px-4 text-center w-24">Status Rapor</th>
                <th className="py-3 px-4 text-right w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReports.map((rep, idx) => {
                const subReport = rep.subjects?.find(
                  s => s.subjectId === currentAssignment?.subjectId || s.subjectName === currentAssignment?.subjectName
                );

                const finalScore = subReport?.finalScore || 0;
                const scoreLetter = subReport?.scoreLetter || '-';
                const description = subReport?.description || 'Belum ada deskripsi capaian.';

                return (
                  <tr key={rep.id || idx} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 text-center text-slate-500 font-medium">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{rep.studentName}</div>
                      <div className="text-[11px] font-normal text-slate-400">NIS: {rep.studentNis}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-base text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        {finalScore > 0 ? finalScore : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">{scoreLetter}</td>
                    <td className="py-3 px-4">
                      <p className="text-slate-700 text-[11px] leading-relaxed italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        "{description}"
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {rep.isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
                          <Lock className="w-3 h-3" /> Dikunci
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Terbuka
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {rep.isLocked ? (
                        <button
                          onClick={() => handleOpenCorrection(rep, finalScore)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-all"
                          title="Ajukan Perbaikan Nilai"
                        >
                          <FileEdit className="w-3 h-3" />
                          Ajukan Koreksi
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Dapat diedit di Penilaian</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    Belum ada rapor yang digenerate untuk kelas ini. Hubungi Admin atau Wali Kelas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajukan Perbaikan Nilai */}
      {requestModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setRequestModalStudent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-slate-900 mb-1">
              Pengajuan Perbaikan Nilai (Rapor Dikunci)
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Siswa: <span className="font-bold text-slate-700">{requestModalStudent.studentName}</span> | Mapel:{' '}
              <span className="font-bold text-slate-700">{currentAssignment?.subjectName}</span>
            </p>

            <form onSubmit={handleSubmitCorrection} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Nilai Sekarang</label>
                  <input
                    type="number"
                    disabled
                    value={requestModalStudent.currentScore}
                    className="w-full p-2 bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nilai Usulan Baru</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={proposedValue}
                    onChange={e => setProposedValue(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alasan Perbaikan Nilai</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Contoh: Kesalahan input asesmen sumatif harian / susulan remedial..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRequestModalStudent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="px-4 py-2 bg-[#064E3B] hover:bg-emerald-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingRequest ? 'Mengirim...' : 'Kirim ke Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
