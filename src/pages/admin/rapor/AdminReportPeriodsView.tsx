import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Lock,
  Archive,
  AlertCircle,
  ArrowLeft,
  X,
  FileText
} from 'lucide-react';
import { reportService } from '../../../services/reportService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useAuth } from '../../../hooks/useAuth';
import type { ReportPeriod, ReportPeriodStatus } from '../../../types/report';
import type { Semester } from '../../../types/academic';

export const AdminReportPeriodsView: React.FC = () => {
  const { userProfile } = useAuth();
  const [periods, setPeriods] = useState<ReportPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<ReportPeriod | null>(null);

  // Form states
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [semester, setSemester] = useState<Semester>('Ganjil');
  const [reportType, setReportType] = useState<'Rapor Semester' | 'Rapor Tengah Semester' | 'Rapor Akhir'>('Rapor Semester');
  const [startDate, setStartDate] = useState('2026-07-15');
  const [endDate, setEndDate] = useState('2026-12-20');
  const [reportDate, setReportDate] = useState('2026-12-20');
  const [placeDate, setPlaceDate] = useState('Pebatan, 20 Desember 2026');
  const [status, setStatus] = useState<ReportPeriodStatus>('open');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      const list = await reportService.getPeriods();
      setPeriods(list);
    } catch (error) {
      console.error('Error loading periods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPeriod(null);
    setAcademicYear('2026/2027');
    setSemester('Ganjil');
    setReportType('Rapor Semester');
    setStartDate('2026-07-15');
    setEndDate('2026-12-20');
    setReportDate('2026-12-20');
    setPlaceDate('Pebatan, 20 Desember 2026');
    setStatus('open');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: ReportPeriod) => {
    setEditingPeriod(p);
    setAcademicYear(p.academicYear);
    setSemester(p.semester);
    setReportType(p.reportType);
    setStartDate(p.startDate || '');
    setEndDate(p.endDate || '');
    setReportDate(p.reportDate || '');
    setPlaceDate(p.placeDate || '');
    setStatus(p.status);
    setNotes(p.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await reportService.savePeriod(
        {
          academicYear,
          semester,
          reportType,
          startDate,
          endDate,
          reportDate,
          placeDate,
          status,
          notes
        },
        editingPeriod?.id,
        { uid: userProfile?.uid || 'admin', name: userProfile?.name || 'Administrator' }
      );

      setIsModalOpen(false);
      await loadPeriods();
    } catch (error) {
      console.error('Error saving period:', error);
      alert('Gagal menyimpan periode rapor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus periode rapor ini?')) return;
    try {
      await reportService.deletePeriod(id, {
        uid: userProfile?.uid || 'admin',
        name: userProfile?.name || 'Administrator'
      });
      await loadPeriods();
    } catch (error) {
      console.error('Error deleting period:', error);
      alert('Gagal menghapus periode.');
    }
  };

  const getStatusBadge = (st: ReportPeriodStatus) => {
    switch (st) {
      case 'open':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Aktif (Open)</span>;
      case 'review':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Pemeriksaan (Review)</span>;
      case 'locked':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">Dikunci (Locked)</span>;
      case 'published':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Diterbitkan (Published)</span>;
      case 'archived':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">Diarsipkan</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Draft</span>;
    }
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Periode Rapor</h1>
          <p className="text-sm text-slate-500">
            Pengaturan jadwal pembagian rapor, rentang penarikan absensi, dan tanggal titimangsa cetak.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#064E3B] hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Buat Periode Baru
        </button>
      </div>

      {/* List Periods */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Daftar Periode Rapor</span>
          <span className="text-xs text-slate-500">{periods.length} Periode terdaftar</span>
        </div>

        <div className="divide-y divide-slate-200">
          {periods.map(p => (
            <div key={p.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-all">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-slate-900 text-base">
                    {p.academicYear} — Semester {p.semester}
                  </h3>
                  {getStatusBadge(p.status)}
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
                  <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                    {p.reportType}
                  </span>
                  <span>
                    Rentang Absensi: <span className="font-semibold text-slate-800">{p.startDate} s/d {p.endDate}</span>
                  </span>
                  <span>
                    Titimangsa: <span className="font-semibold text-slate-800">{p.placeDate || p.reportDate}</span>
                  </span>
                </div>

                {p.notes && (
                  <p className="text-xs text-slate-500 italic mt-1">{p.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={() => handleOpenEditModal(p)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => p.id && handleDelete(p.id)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus
                </button>
              </div>
            </div>
          ))}

          {periods.length === 0 && (
            <div className="p-12 text-center text-slate-500 text-sm">
              <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              Belum ada periode rapor yang dibuat. Klik "Buat Periode Baru" untuk memulai.
            </div>
          )}
        </div>
      </div>

      {/* Modal Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {editingPeriod ? 'Edit Periode Rapor' : 'Buat Periode Rapor Baru'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Pelajaran</label>
                  <select
                    value={academicYear}
                    onChange={e => setAcademicYear(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  >
                    <option value="2026/2027">2026/2027</option>
                    <option value="2025/2026">2025/2026</option>
                    <option value="2024/2025">2024/2025</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                  <select
                    value={semester}
                    onChange={e => setSemester(e.target.value as Semester)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Rapor</label>
                <select
                  value={reportType}
                  onChange={e => setReportType(e.target.value as any)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                >
                  <option value="Rapor Semester">Rapor Semester (Standar)</option>
                  <option value="Rapor Tengah Semester">Rapor Tengah Semester (PTS/STS)</option>
                  <option value="Rapor Akhir">Rapor Akhir Tahun / Kenaikan Kelas</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Awal Periode Absensi
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Akhir Periode Absensi
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Rapor
                  </label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={e => setReportDate(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Titimangsa Cetak
                  </label>
                  <input
                    type="text"
                    value={placeDate}
                    onChange={e => setPlaceDate(e.target.value)}
                    placeholder="Contoh: Pebatan, 20 Desember 2026"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status Periode</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as ReportPeriodStatus)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                >
                  <option value="open">Aktif / Terbuka (Guru dapat menginput nilai)</option>
                  <option value="review">Pemeriksaan / Review (Wali kelas & Admin mengecek)</option>
                  <option value="locked">Terkunci (Hanya Admin dapat mengubah)</option>
                  <option value="published">Diterbitkan (Rapor siap dicetak/dibagikan)</option>
                  <option value="archived">Diarsipkan</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Informasi pengumuman untuk guru/wali kelas..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#064E3B] hover:bg-emerald-800 rounded-lg transition-all shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : editingPeriod ? 'Simpan Perubahan' : 'Buat Periode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
