import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Calendar,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Archive,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Clock,
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  Settings,
  ClipboardList
} from 'lucide-react';
import { reportService } from '../../../services/reportService';
import { classService } from '../../../services/classService';
import { studentService } from '../../../services/studentService';
import { settingsService } from '../../../services/settingsService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useAuth } from '../../../hooks/useAuth';
import type { Report, ReportPeriod } from '../../../types/report';
import type { ClassData, Semester } from '../../../types/academic';

export const AdminReportDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [periods, setPeriods] = useState<ReportPeriod[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [semester, setSemester] = useState<Semester>('Ganjil');
  const [activePeriod, setActivePeriod] = useState<ReportPeriod | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [generatingClassId, setGeneratingClassId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [academicYear, semester]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [allClasses, allPeriods, allStudents, generalSettings] = await Promise.all([
        classService.getAll(),
        reportService.getPeriods(),
        studentService.getAll(),
        settingsService.getGeneralSettings()
      ]);

      if (generalSettings) {
        if (!academicYear) setAcademicYear(generalSettings.academicYear || '2026/2027');
        if (!semester) setSemester(generalSettings.semester || 'Ganjil');
      }

      setClasses(allClasses);
      setPeriods(allPeriods);

      const active = allPeriods.find(p => p.academicYear === academicYear && p.semester === semester);
      setActivePeriod(active || null);

      const activeStudentsList = allStudents.filter(s => s.status === 'aktif');
      setTotalStudents(activeStudentsList.length);

      const repList = await reportService.getReports({ academicYear, semester });
      setReports(repList);
    } catch (error) {
      console.error('Error loading report dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClass = async (clsId: string) => {
    if (!activePeriod?.id) {
      alert('Silakan buat atau aktifkan Periode Rapor terlebih dahulu di menu "Periode Rapor".');
      return;
    }

    try {
      setGeneratingClassId(clsId);
      const res = await reportService.generateReportsForClass(
        clsId,
        activePeriod.id,
        academicYear,
        semester,
        { uid: userProfile?.uid || 'admin', name: userProfile?.name || 'Administrator' }
      );

      if (res.errors.length > 0) {
        alert(`Peringatan: ${res.errors.join('\n')}`);
      } else {
        setActionSuccess(`Berhasil mengenerate ${res.totalGenerated} rapor siswa.`);
        setTimeout(() => setActionSuccess(null), 4000);
      }
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Gagal generate rapor.');
    } finally {
      setGeneratingClassId(null);
    }
  };

  const handleLockAllClass = async (clsId: string) => {
    if (!activePeriod?.id) return;
    if (!window.confirm('Kunci seluruh rapor kelas ini? Setelah dikunci, guru tidak dapat mengedit nilai.')) return;

    try {
      const count = await reportService.lockClassReports(clsId, activePeriod.id, {
        uid: userProfile?.uid || 'admin',
        name: userProfile?.name || 'Administrator'
      });
      setActionSuccess(`Berhasil mengunci ${count} rapor kelas.`);
      setTimeout(() => setActionSuccess(null), 4000);
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengunci rapor.');
    }
  };

  const handleUnlockAllClass = async (clsId: string) => {
    if (!activePeriod?.id) return;
    const reason = window.prompt('Masukkan alasan pembukaan kunci rapor:', 'Perbaikan nilai');
    if (reason === null) return;

    try {
      const count = await reportService.unlockClassReports(clsId, activePeriod.id, {
        uid: userProfile?.uid || 'admin',
        name: userProfile?.name || 'Administrator'
      });
      setActionSuccess(`Berhasil membuka kunci ${count} rapor kelas.`);
      setTimeout(() => setActionSuccess(null), 4000);
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Gagal membuka kunci.');
    }
  };

  // KPIs
  const totalRapor = reports.length;
  const lengkapCount = reports.filter(r => r.status === 'Lengkap' || r.status === 'Dikunci').length;
  const perluDiperiksaCount = reports.filter(r => r.status === 'Perlu Diperiksa').length;
  const draftCount = reports.filter(r => r.status === 'Draft').length;
  const dikunciCount = reports.filter(r => r.isLocked).length;
  const diterbitkanCount = reports.filter(r => r.status === 'Diterbitkan').length;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Academic Year Selector */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-[#064E3B]">
              Tahap 6: Rapor Madrasah
            </span>
            {activePeriod && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                Periode: {activePeriod.status.toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard & Supervisi Rapor</h1>
          <p className="text-sm text-slate-500">
            Pusat manajemen laporan hasil belajar, rekap leger, kenaikan kelas, dan arsip akademik madrasah.
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
            onClick={loadDashboardData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium">{actionSuccess}</p>
        </div>
      )}

      {/* Warning if no active period */}
      {!activePeriod && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">Periode Rapor Belum Dibuat atau Belum Terbuka</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Untuk mengizinkan pembuatan rapor dan sinkronisasi nilai, buat periode rapor baru di menu Periode Rapor.
            </p>
            <Link
              to="/admin/rapor/periods"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 underline mt-2 hover:text-amber-950"
            >
              Kelola Periode Rapor Sekarang <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Siswa</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalStudents}</div>
          <div className="text-[11px] text-slate-400 mt-1">{totalRapor} draft dibuat</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">🟢 Rapor Lengkap</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{lengkapCount}</div>
          <div className="text-[11px] text-emerald-600 mt-1">
            {totalRapor > 0 ? Math.round((lengkapCount / totalRapor) * 100) : 0}% selesai
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">🟡 Perlu Diperiksa</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{perluDiperiksaCount}</div>
          <div className="text-[11px] text-amber-600 mt-1">Sebagian data terisi</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">🔴 Draft/Kosong</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{draftCount}</div>
          <div className="text-[11px] text-rose-500 mt-1">Belum lengkap</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">🔒 Rapor Dikunci</span>
            <Lock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{dikunciCount}</div>
          <div className="text-[11px] text-purple-600 mt-1">Siap cetak</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">📢 Diterbitkan</span>
            <Sparkles className="w-4 h-4 text-[#064E3B]" />
          </div>
          <div className="text-2xl font-bold text-[#064E3B]">{diterbitkanCount}</div>
          <div className="text-[11px] text-emerald-600 mt-1">Resmi diserahkan</div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/admin/rapor/periods"
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center mb-3 group-hover:bg-[#064E3B] group-hover:text-white transition-all">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Periode Rapor</h3>
            <p className="text-xs text-slate-500 mt-0.5">Atur jadwal, jenis rapor & titimangsa</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-all" />
        </Link>

        <Link
          to="/admin/rapor/list"
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Daftar Rapor Siswa</h3>
            <p className="text-xs text-slate-500 mt-0.5">Lihat, edit, validasi & cetak rapor</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-all" />
        </Link>

        <Link
          to="/admin/rapor/leger"
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-all">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Leger Nilai Kelas</h3>
            <p className="text-xs text-slate-500 mt-0.5">Matriks nilai, statistik & export Excel</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-all" />
        </Link>

        <Link
          to="/admin/rapor/promotion"
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Kenaikan Kelas</h3>
            <p className="text-xs text-slate-500 mt-0.5">Rekomendasi, keputusan & migrasi</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-all" />
        </Link>
      </div>

      {/* Progress & Actions per Class */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Monitoring Kesiapan Rapor per Kelas</h2>
            <p className="text-xs text-slate-500">
              Generate draft rapor, pantau kelengkapan nilai & kunci rapor setelah diverifikasi
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/rapor/monitoring"
              className="text-xs font-semibold text-[#064E3B] hover:text-emerald-800 flex items-center gap-1"
            >
              Supervisi Nilai Guru <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {classes.map(cls => {
            const classReports = reports.filter(r => r.classId === cls.id);
            const classLengkap = classReports.filter(r => r.status === 'Lengkap' || r.status === 'Dikunci').length;
            const classLocked = classReports.filter(r => r.isLocked).length;
            const isGenerating = generatingClassId === cls.id;

            return (
              <div
                key={cls.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#064E3B] flex items-center justify-center font-bold text-base shrink-0">
                    {cls.name}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{cls.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
                        Tingkat {cls.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Wali Kelas: <span className="font-medium text-slate-700">{cls.homeroomTeacherName || 'Belum diatur'}</span>
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full lg:w-72">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-600 font-medium">Kelengkapan Rapor:</span>
                    <span className="font-bold text-slate-800">
                      {classReports.length > 0
                        ? `${classLengkap}/${classReports.length} (${Math.round((classLengkap / classReports.length) * 100)}%)`
                        : 'Belum Generate'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-600 h-full transition-all duration-500"
                      style={{
                        width: classReports.length > 0 ? `${(classLengkap / classReports.length) * 100}%` : '0%'
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-purple-600" /> {classLocked} Terkunci
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {classLengkap} Lengkap
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => cls.id && handleGenerateClass(cls.id)}
                    disabled={isGenerating}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] border border-emerald-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'Mengolah...' : classReports.length > 0 ? 'Sinkron Ulang' : 'Generate Rapor'}
                  </button>

                  <Link
                    to={`/admin/rapor/list?classId=${cls.id}`}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                  >
                    <Award className="w-3.5 h-3.5 text-blue-600" />
                    Daftar ({classReports.length})
                  </Link>

                  <Link
                    to={`/admin/rapor/leger?classId=${cls.id}`}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                    Leger
                  </Link>

                  {classLocked === classReports.length && classReports.length > 0 ? (
                    <button
                      onClick={() => cls.id && handleUnlockAllClass(cls.id)}
                      className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                      title="Buka Kunci Rapor Kelas"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      Buka
                    </button>
                  ) : (
                    <button
                      onClick={() => cls.id && handleLockAllClass(cls.id)}
                      disabled={classReports.length === 0}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 disabled:opacity-40"
                      title="Kunci Rapor Kelas"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Kunci
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {classes.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              Belum ada data kelas yang terdaftar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
