import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Download,
  Filter,
  Search,
  BookOpen,
  FileCheck,
  ShieldAlert,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { checklistService, TeacherAdminChecklist } from '../../../services/checklistService';
import { reminderService } from '../../../services/reminderService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

export const AdminAdministrationMonitoringView: React.FC = () => {
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [checklists, setChecklists] = useState<TeacherAdminChecklist[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      const list = await checklistService.getTeachersChecklist('2026/2027', 'Ganjil');
      setChecklists(list);
    } catch (e) {
      console.error('Error loading monitoring data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (teacher: TeacherAdminChecklist) => {
    if (!userProfile) return;
    try {
      setSendingReminderId(teacher.teacherId);
      await reminderService.createReminder(
        {
          title: `Pengingat: Lengkapi Berkas Administrasi Pembelajaran`,
          date: '2026-09-05',
          time: '12:00',
          notes: `Berdasarkan monitoring madrasah, kelengkapan administrasi Anda saat ini mencapai ${teacher.score}%. Mohon segera melengkapi modul ajar, prota, promes, atau jurnal mengajar.`,
          priority: 'high',
          deadlineType: 'rpp',
          targetUserId: teacher.teacherId,
          targetUserName: teacher.teacherName,
          academicYear: '2026/2027',
          semester: 'Ganjil',
          createdBy: userProfile.uid,
          createdByName: userProfile.name
        },
        userProfile
      );
      alert(`Pengingat berhasil dikirim ke ${teacher.teacherName}!`);
    } catch (e: any) {
      alert(e.message || 'Gagal mengirim pengingat.');
    } finally {
      setSendingReminderId(null);
    }
  };

  const handleBroadcastAllIncomplete = async () => {
    if (!userProfile) return;
    const incompleteTeachers = checklists.filter(t => t.score < 100);
    if (incompleteTeachers.length === 0) {
      alert('Seluruh guru telah melengkapi administrasi (100%)!');
      return;
    }

    if (
      window.confirm(
        `Kirim pengingat deadline ke ${incompleteTeachers.length} guru yang administrasinya belum lengkap?`
      )
    ) {
      for (const t of incompleteTeachers) {
        await reminderService.createReminder(
          {
            title: `Batas Waktu Pengumpulan Berkas Administrasi Pembelajaran`,
            date: '2026-09-05',
            time: '12:00',
            notes: `Mohon segera melengkapi perangkat mengajar (Prota, Promes, ATP, Modul Ajar, Jurnal, Nilai) sebelum batas akhir evaluasi madrasah.`,
            priority: 'high',
            deadlineType: 'rpp',
            targetUserId: t.teacherId,
            targetUserName: t.teacherName,
            academicYear: '2026/2027',
            semester: 'Ganjil',
            createdBy: userProfile.uid,
            createdByName: userProfile.name
          },
          userProfile
        );
      }
      setBroadcastSuccess(true);
      setTimeout(() => setBroadcastSuccess(false), 3000);
    }
  };

  const getStatusBadge = (status: 'lengkap' | 'sebagian' | 'belum') => {
    if (status === 'lengkap') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
          Lengkap
        </span>
      );
    }
    if (status === 'sebagian') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
          Sebagian
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold text-[10px]">
        Belum
      </span>
    );
  };

  const filtered = checklists.filter(t => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!t.teacherName.toLowerCase().includes(q) && !(t.roleTitle || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    if (roleFilter !== 'all') {
      if (roleFilter === 'wali' && !t.roleTitle.toLowerCase().includes('wali')) return false;
      if (roleFilter === 'mapel' && !t.roleTitle.toLowerCase().includes('mapel')) return false;
      if (roleFilter === 'agama' && !t.roleTitle.toLowerCase().includes('agama')) return false;
    }
    return true;
  });

  const avgScore =
    checklists.length > 0
      ? Math.round(checklists.reduce((acc, c) => acc + c.score, 0) / checklists.length)
      : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="text-xs text-slate-500 mt-2">Memuat status monitoring administrasi guru...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Monitoring Administrasi Dewan Guru
          </h1>
          <p className="text-xs text-slate-500">
            Pemantauan kelengkapan perangkat ajar, modul, ATP, prota, promes, jurnal, dan nilai dewan guru T.P. 2026/2027
          </p>
        </div>

        <button
          onClick={handleBroadcastAllIncomplete}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Send className="w-4 h-4" /> Broadcast Pengingat ke Guru Belum Lengkap
        </button>
      </div>

      {broadcastSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-xs text-emerald-900 dark:text-emerald-300 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">
            Notifikasi pengingat deadline berhasil dikirimkan ke seluruh guru yang belum lengkap!
          </span>
        </div>
      )}

      {/* Overview Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Total Dewan Guru</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
              {checklists.length} Guru
            </p>
            <span className="text-[11px] text-slate-400">Kelas, Mapel & Agama</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Rata-rata Kelengkapan</span>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {avgScore}%
            </p>
            <span className="text-[11px] text-slate-400">Semester Ganjil 2026/2027</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center font-bold">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Perlu Tindak Lanjut</span>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              {checklists.filter(c => c.score < 100).length} Guru
            </p>
            <span className="text-[11px] text-slate-400">Administrasi belum 100%</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama guru atau penugasan..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="sm:w-56 shrink-0">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Penugasan Guru</option>
            <option value="wali">Wali / Guru Kelas</option>
            <option value="mapel">Guru Mapel Umum</option>
            <option value="agama">Guru Mapel Agama</option>
          </select>
        </div>
      </div>

      {/* Monitoring Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Nama Guru & Tugas</th>
                <th className="py-3 px-3 text-center">Prota</th>
                <th className="py-3 px-3 text-center">Promes</th>
                <th className="py-3 px-3 text-center">ATP</th>
                <th className="py-3 px-3 text-center">Modul Ajar</th>
                <th className="py-3 px-3 text-center">KKTP</th>
                <th className="py-3 px-3 text-center">Jurnal</th>
                <th className="py-3 px-3 text-center">Nilai</th>
                <th className="py-3 px-3 text-center">Skor</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(t => {
                const isSending = sendingReminderId === t.teacherId;
                return (
                  <tr
                    key={t.teacherId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {t.teacherName}
                      </p>
                      <span className="text-[11px] text-slate-500">{t.roleTitle}</span>
                    </td>

                    <td className="py-3 px-3 text-center">{getStatusBadge(t.protaStatus)}</td>
                    <td className="py-3 px-3 text-center">{getStatusBadge(t.promesStatus)}</td>
                    <td className="py-3 px-3 text-center">{getStatusBadge(t.atpStatus)}</td>
                    <td className="py-3 px-3 text-center">{getStatusBadge(t.modulAjarStatus)}</td>
                    <td className="py-3 px-3 text-center">{getStatusBadge(t.kktpStatus)}</td>
                    <td className="py-3 px-3 text-center">{getStatusBadge(t.jurnalStatus)}</td>
                    <td className="py-3 px-3 text-center">{getStatusBadge(t.nilaiStatus)}</td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`font-extrabold text-xs px-2 py-1 rounded-lg ${
                          t.score === 100
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : t.score >= 70
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        }`}
                      >
                        {t.score}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {t.score < 100 ? (
                        <button
                          onClick={() => handleSendReminder(t)}
                          disabled={isSending}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors"
                          title="Kirim pengingat ke guru ini"
                        >
                          {isSending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          Ingatkan
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sempurna
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
