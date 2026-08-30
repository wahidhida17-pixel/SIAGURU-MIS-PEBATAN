import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Check,
  X,
  FileEdit,
  User,
  BookOpen,
  Filter,
  RefreshCw
} from 'lucide-react';
import { reportService } from '../../../services/reportService';
import { assessmentService } from '../../../services/assessmentService';
import { teacherService } from '../../../services/teacherService';
import { subjectService } from '../../../services/subjectService';
import { classService } from '../../../services/classService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useAuth } from '../../../hooks/useAuth';
import type { GradeChangeRequest } from '../../../types/report';
import type { TeacherAssessmentProgress } from '../../../types/assessment';
import type { Semester } from '../../../types/academic';

export const AdminReportMonitoringView: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [semester, setSemester] = useState<Semester>('Ganjil');

  const [progressList, setProgressList] = useState<TeacherAssessmentProgress[]>([]);
  const [gradeRequests, setGradeRequests] = useState<GradeChangeRequest[]>([]);
  const [reviewingRequest, setReviewingRequest] = useState<GradeChangeRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reminderSent, setReminderSent] = useState<string | null>(null);

  useEffect(() => {
    loadMonitoringData();
  }, [academicYear, semester]);

  const loadMonitoringData = async () => {
    try {
      setLoading(true);
      const [prog, requests] = await Promise.all([
        assessmentService.getTeacherAssessmentMonitoring(academicYear, semester),
        reportService.getGradeChangeRequests({ academicYear })
      ]);
      setProgressList(prog);
      setGradeRequests(requests);
    } catch (error) {
      console.error('Error loading monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = (teacherName: string, subjectName: string, className: string) => {
    setReminderSent(`Peringatan sistem berhasil dikirimkan kepada ${teacherName} untuk mapel ${subjectName} Kelas ${className}.`);
    setTimeout(() => setReminderSent(null), 4000);
  };

  const handleReviewDecision = async (decision: 'approved' | 'rejected') => {
    if (!reviewingRequest?.id) return;
    try {
      setSubmittingReview(true);
      await reportService.reviewGradeChangeRequest(
        reviewingRequest.id,
        decision,
        reviewNotes,
        { uid: userProfile?.uid || 'admin', name: userProfile?.name || 'Administrator' }
      );
      setReviewingRequest(null);
      setReviewNotes('');
      await loadMonitoringData();
    } catch (error) {
      console.error('Error reviewing request:', error);
      alert('Gagal memproses permohonan.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const pendingRequests = gradeRequests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Supervisi & Monitoring Rapor</h1>
          <p className="text-sm text-slate-500">
            Pemantauan pengumpulan nilai guru mata pelajaran, mapel agama Islam, serta persetujuan perbaikan nilai.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <select
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-800 px-2 py-1 outline-none cursor-pointer"
            >
              <option value="2026/2027">2026/2027</option>
              <option value="2025/2026">2025/2026</option>
            </select>

            <span className="text-slate-300">|</span>

            <select
              value={semester}
              onChange={e => setSemester(e.target.value as Semester)}
              className="bg-transparent text-sm font-semibold text-slate-800 px-2 py-1 outline-none cursor-pointer"
            >
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>

          <button
            onClick={loadMonitoringData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {reminderSent && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium">{reminderSent}</p>
        </div>
      )}

      {/* Grade Change Requests Box */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileEdit className="w-5 h-5 text-amber-700" />
              <h2 className="font-bold text-amber-900 text-base">
                Permohonan Perbaikan Nilai ({pendingRequests.length} Menunggu Persetujuan)
              </h2>
            </div>
            <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
              Review Admin
            </span>
          </div>
          <p className="text-xs text-amber-800 mb-4">
            Guru mengajukan perbaikan nilai untuk rapor yang sudah terkunci. Verifikasi alasan sebelum menyetujui.
          </p>

          <div className="divide-y divide-amber-200/80 bg-white rounded-xl border border-amber-200 overflow-hidden text-xs">
            {pendingRequests.map(req => (
              <div key={req.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">
                    {req.studentName} — Kelas {req.className}
                  </div>
                  <div className="text-slate-600">
                    Mapel: <span className="font-semibold text-slate-800">{req.subjectName}</span> | Guru Pengampu:{' '}
                    <span className="font-semibold text-slate-800">{req.teacherName}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                      Nilai Lama: {req.oldValue}
                    </span>
                    <span>➔</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                      Nilai Usulan: {req.proposedValue}
                    </span>
                  </div>
                  <div className="text-slate-500 italic mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                    Alasan: "{req.reason}"
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => {
                      setReviewingRequest(req);
                      setReviewNotes('');
                    }}
                    className="px-4 py-2 bg-[#064E3B] hover:bg-emerald-800 text-white rounded-lg font-semibold transition-all shadow-xs"
                  >
                    Tinjau Permohonan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Table Guru Pengampu */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Status Pengumpulan Nilai per Guru & Mata Pelajaran</h2>
            <p className="text-xs text-slate-500">Mencakup seluruh mapel umum, muatan lokal & rumpun mapel agama Islam</p>
          </div>
          <span className="text-xs text-slate-500">{progressList.length} Penugasan KBM</span>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4 w-10 text-center">No</th>
                  <th className="py-3 px-4">Nama Guru Pengampu</th>
                  <th className="py-3 px-4">Mata Pelajaran</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Asesmen Dibuat</th>
                  <th className="py-3 px-4 text-center">Progres Penilaian</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {progressList.map((prog, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 text-center text-slate-500 font-medium">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{prog.teacherName}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{prog.subjectName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {prog.className}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {prog.assessmentCount} Asesmen
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="space-y-1 inline-block w-28 text-center">
                        <div className="text-[11px] font-bold text-slate-700">{prog.percentage}%</div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${prog.percentage === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${prog.percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {prog.isComplete ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Lengkap
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" /> Belum Lengkap
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!prog.isComplete ? (
                        <button
                          onClick={() => handleSendReminder(prog.teacherName, prog.subjectName, prog.className)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 inline-flex transition-all"
                          title="Kirim Peringatan"
                        >
                          <Send className="w-3 h-3" />
                          Reminder
                        </button>
                      ) : (
                        <span className="text-emerald-700 text-xs font-semibold">Tuntas</span>
                      )}
                    </td>
                  </tr>
                ))}

                {progressList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                      Belum ada data penugasan mengajar untuk periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Review Grade Change Request */}
      {reviewingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setReviewingRequest(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-slate-900 mb-1">Verifikasi Perbaikan Nilai</h2>
            <p className="text-xs text-slate-500 mb-4">
              Keputusan persetujuan akan langsung mengubah nilai pada Rapor siswa dan tercatat di Audit Log.
            </p>

            <div className="space-y-3 text-xs p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4">
              <div>
                <span className="text-slate-500">Nama Siswa:</span>
                <div className="font-bold text-slate-800">{reviewingRequest.studentName} ({reviewingRequest.className})</div>
              </div>
              <div>
                <span className="text-slate-500">Mata Pelajaran:</span>
                <div className="font-bold text-slate-800">{reviewingRequest.subjectName}</div>
              </div>
              <div>
                <span className="text-slate-500">Perubahan:</span>
                <div className="font-bold text-slate-800">
                  Nilai {reviewingRequest.oldValue} ➔ Nilai {reviewingRequest.proposedValue}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Alasan Guru:</span>
                <div className="italic text-slate-700">"{reviewingRequest.reason}"</div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Verifikasi Admin (Opsional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                placeholder="Tambahkan catatan verifikasi..."
                rows={2}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                disabled={submittingReview}
                onClick={() => handleReviewDecision('rejected')}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                Tolak
              </button>
              <button
                type="button"
                disabled={submittingReview}
                onClick={() => handleReviewDecision('approved')}
                className="px-4 py-2 bg-[#064E3B] hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                Setujui & Perbarui
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
