import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Award,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
  Printer,
  Download,
  RefreshCw,
  X,
  FileText,
  User,
  CheckSquare,
  Square,
  Layers
} from 'lucide-react';
import { reportService } from '../../../services/reportService';
import { classService } from '../../../services/classService';
import { settingsService } from '../../../services/settingsService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ReportPrintDocument } from '../../../components/report/ReportPrintDocument';
import { useAuth } from '../../../hooks/useAuth';
import type { Report, ReportPeriod } from '../../../types/report';
import type { ClassData, GeneralSettings, Semester } from '../../../types/academic';

export const AdminReportListView: React.FC = () => {
  const { userProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialClassId = searchParams.get('classId') || 'all';

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [periods, setPeriods] = useState<ReportPeriod[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<GeneralSettings | null>(null);

  const [selectedClass, setSelectedClass] = useState<string>(initialClassId);
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [semester, setSemester] = useState<Semester>('Ganjil');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [previewPrintReport, setPreviewPrintReport] = useState<Report | null>(null);
  const [checklistReport, setChecklistReport] = useState<Report | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadReports();
  }, [selectedClass, academicYear, semester]);

  const loadInitialData = async () => {
    try {
      const [allClasses, allPeriods, settings] = await Promise.all([
        classService.getAll(),
        reportService.getPeriods(),
        settingsService.getGeneralSettings()
      ]);
      setClasses(allClasses);
      setPeriods(allPeriods);
      setSchoolSettings(settings);

      if (settings) {
        if (settings.academicYear) setAcademicYear(settings.academicYear);
        if (settings.semester) setSemester(settings.semester);
      }
    } catch (error) {
      console.error('Error loading initial report list data:', error);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const list = await reportService.getReports({
        classId: selectedClass === 'all' ? undefined : selectedClass,
        academicYear,
        semester
      });
      setReports(list);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async (report: Report) => {
    if (!report.id) return;
    try {
      if (report.isLocked) {
        if (window.confirm(`Buka kunci rapor untuk ${report.studentName}?`)) {
          await reportService.unlockReport(report.id, {
            uid: userProfile?.uid || 'admin',
            name: userProfile?.name || 'Administrator'
          });
        }
      } else {
        await reportService.lockReport(report.id, {
          uid: userProfile?.uid || 'admin',
          name: userProfile?.name || 'Administrator'
        });
      }
      await loadReports();
    } catch (error) {
      console.error('Error toggling lock:', error);
      alert('Gagal memperbarui status kunci.');
    }
  };

  const filteredReports = reports.filter(r => {
    const matchSearch =
      (r.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.studentNis || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.className || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'locked'
        ? r.isLocked
        : statusFilter === 'complete'
        ? r.status === 'Lengkap'
        : statusFilter === 'incomplete'
        ? r.status === 'Perlu Diperiksa' || r.status === 'Draft'
        : true;

    return matchSearch && matchStatus;
  });

  // Render Full Print View if single report selected for print preview
  if (previewPrintReport) {
    return (
      <ReportPrintDocument
        report={previewPrintReport}
        schoolSettings={schoolSettings}
        onBack={() => setPreviewPrintReport(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daftar Rapor Peserta Didik</h1>
          <p className="text-sm text-slate-500">
            Periksa status kelengkapan nilai, pratinjau cetak, dan kunci hasil belajar siswa.
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
              <option value="2024/2025">2024/2025</option>
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
            onClick={loadReports}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Class Filter */}
          <div className="w-full sm:w-48">
            <select
              value={selectedClass}
              onChange={e => {
                setSelectedClass(e.target.value);
                setSearchParams(e.target.value === 'all' ? {} : { classId: e.target.value });
              }}
              className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">Semua Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-44">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="complete">🟢 Lengkap</option>
              <option value="incomplete">🟡 Perlu Diperiksa / Draft</option>
              <option value="locked">🔒 Dikunci</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama siswa / NIS..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 shrink-0 font-medium self-end md:self-center">
          Menampilkan <span className="font-bold text-slate-800">{filteredReports.length}</span> dari {reports.length} rapor
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Kelengkapan Nilai</th>
                  <th className="py-3 px-4 text-center">Absensi (S/I/A)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredReports.map((rep, idx) => {
                  const subjectCount = rep.subjects?.length || 0;
                  const scoredCount = rep.subjects?.filter(s => s.finalScore > 0).length || 0;
                  const descCount = rep.subjects?.filter(s => s.hasDescription).length || 0;

                  return (
                    <tr key={rep.id} className="hover:bg-slate-50/60 transition-all">
                      <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{rep.studentName}</div>
                        <div className="text-[11px] text-slate-400">NIS: {rep.studentNis}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {rep.className}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Nilai: {scoredCount}/{subjectCount}</span>
                            <span className="text-slate-500">Deskripsi: {descCount}/{subjectCount}</span>
                          </div>
                          <div className="w-36 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                scoredCount === subjectCount && descCount === subjectCount
                                  ? 'bg-emerald-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{
                                width: subjectCount > 0 ? `${(scoredCount / subjectCount) * 100}%` : '0%'
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-700">
                        {rep.attendance ? (
                          <span>
                            {rep.attendance.sakit}/{rep.attendance.izin}/{rep.attendance.alpa}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {rep.isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
                            <Lock className="w-3 h-3" /> Dikunci
                          </span>
                        ) : rep.status === 'Lengkap' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Lengkap
                          </span>
                        ) : rep.status === 'Perlu Diperiksa' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3" /> Perlu Diperiksa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setChecklistReport(rep)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-all"
                            title="Checklist Kelengkapan"
                          >
                            <CheckSquare className="w-4 h-4 text-slate-600" />
                          </button>

                          <button
                            onClick={() => setViewingReport(rep)}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
                            title="Detail Rapor"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setPreviewPrintReport(rep)}
                            className="p-1.5 hover:bg-emerald-50 text-[#064E3B] rounded-lg transition-all"
                            title="Pratinjau Cetak / PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleLock(rep)}
                            className={`p-1.5 rounded-lg transition-all ${
                              rep.isLocked
                                ? 'hover:bg-purple-50 text-purple-700'
                                : 'hover:bg-slate-100 text-slate-400'
                            }`}
                            title={rep.isLocked ? 'Buka Kunci' : 'Kunci Rapor'}
                          >
                            {rep.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredReports.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                      Tidak ada data rapor yang sesuai filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Checklist Kelengkapan Rapor */}
      {checklistReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setChecklistReport(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-slate-900 mb-1">Checklist Kelengkapan Rapor</h2>
            <p className="text-xs text-slate-500 mb-4">
              {checklistReport.studentName} ({checklistReport.studentNis}) - Kelas {checklistReport.className}
            </p>

            <div className="space-y-2.5 text-xs max-h-96 overflow-y-auto pr-1">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">1. Data Identitas Peserta Didik</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>

              {checklistReport.subjects?.map(s => (
                <div
                  key={s.subjectId}
                  className={`flex items-center justify-between p-2.5 rounded-lg border ${
                    s.finalScore > 0 && s.hasDescription
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50/50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div>
                    <span className="font-semibold">{s.subjectName}</span>
                    <div className="text-[10px] text-slate-500">
                      Nilai: {s.finalScore > 0 ? s.finalScore : 'Kosong'} | Deskripsi:{' '}
                      {s.hasDescription ? 'Ada' : 'Belum Ada'}
                    </div>
                  </div>
                  {s.finalScore > 0 && s.hasDescription ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                </div>
              ))}

              <div
                className={`flex items-center justify-between p-2.5 rounded-lg border ${
                  checklistReport.attendance?.isComplete
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/50 border-amber-200 text-amber-900'
                }`}
              >
                <div>
                  <span className="font-semibold">Rekap Kehadiran (Presensi)</span>
                  <div className="text-[10px] text-slate-500">
                    S: {checklistReport.attendance?.sakit || 0}, I: {checklistReport.attendance?.izin || 0}, A:{' '}
                    {checklistReport.attendance?.alpa || 0}
                  </div>
                </div>
                {checklistReport.attendance?.isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
              </div>

              <div
                className={`flex items-center justify-between p-2.5 rounded-lg border ${
                  checklistReport.homeroomNote
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/50 border-amber-200 text-amber-900'
                }`}
              >
                <span className="font-semibold">Catatan Wali Kelas</span>
                {checklistReport.homeroomNote ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setChecklistReport(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quick View Detail */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setViewingReport(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#064E3B] flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">{viewingReport.studentName}</h2>
                <p className="text-xs text-slate-500">
                  NIS: {viewingReport.studentNis} | Kelas {viewingReport.className} | {viewingReport.academicYear}{' '}
                  {viewingReport.semester}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 p-2.5 font-bold text-slate-700 border-b border-slate-200">
                  Nilai Mata Pelajaran ({viewingReport.subjects?.length || 0})
                </div>
                <div className="divide-y divide-slate-200">
                  {viewingReport.subjects?.map(s => (
                    <div key={s.subjectId} className="p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-900">{s.subjectName}</span>
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          Nilai: {s.finalScore} ({s.scoreLetter})
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed italic">{s.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div className="font-bold text-slate-700 mb-1">Presensi</div>
                  <div className="text-slate-600">
                    Sakit: <span className="font-bold">{viewingReport.attendance?.sakit || 0}</span> | Izin:{' '}
                    <span className="font-bold">{viewingReport.attendance?.izin || 0}</span> | Alpa:{' '}
                    <span className="font-bold">{viewingReport.attendance?.alpa || 0}</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div className="font-bold text-slate-700 mb-1">Nomor Rapor</div>
                  <div className="text-slate-600 font-mono text-[11px]">{viewingReport.reportNumber || '-'}</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="font-bold text-slate-700 mb-1">Catatan Wali Kelas</div>
                <p className="text-slate-700 italic">"{viewingReport.homeroomNote}"</p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setViewingReport(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setPreviewPrintReport(viewingReport);
                  setViewingReport(null);
                }}
                className="px-4 py-2 bg-[#064E3B] hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Rapor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
