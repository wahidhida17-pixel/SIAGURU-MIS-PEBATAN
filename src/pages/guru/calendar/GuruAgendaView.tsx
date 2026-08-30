import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  MapPin,
  Tag,
  Filter,
  Layers,
  X,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { agendaService } from '../../../services/agendaService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { AgendaItem, AgendaCategory } from '../../../types/calendar';

export const GuruAgendaView: React.FC = () => {
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<AgendaCategory>('Mengajar');
  const [date, setDate] = useState('2026-08-29');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:30');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAgendas();
  }, [userProfile?.uid]);

  const fetchAgendas = async () => {
    if (!userProfile) return;
    try {
      setLoading(true);
      const list = await agendaService.getAgendas({
        teacherId: userProfile.uid,
        academicYear: '2026/2027'
      });
      setAgendas(list);
    } catch (e) {
      console.error('Error loading agendas:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (agenda: AgendaItem) => {
    await agendaService.toggleComplete(agenda.id!, !agenda.isCompleted, {
      uid: userProfile!.uid,
      name: userProfile!.name
    });
    fetchAgendas();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus item agenda ini?')) {
      await agendaService.deleteAgenda(id, { uid: userProfile!.uid, name: userProfile!.name });
      fetchAgendas();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setIsSubmitting(true);
      await agendaService.createAgenda(
        {
          teacherId: userProfile!.uid,
          teacherName: userProfile!.name,
          title: title.trim(),
          category,
          date,
          startTime,
          endTime,
          location: location.trim(),
          notes: notes.trim(),
          isCompleted: false,
          academicYear: '2026/2027',
          semester: 'Ganjil'
        },
        { uid: userProfile!.uid, name: userProfile!.name }
      );
      setIsFormOpen(false);
      setTitle('');
      setNotes('');
      fetchAgendas();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat agenda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = agendas.filter(a => {
    if (filterCategory !== 'all' && a.category !== filterCategory) return false;
    if (statusFilter === 'pending' && a.isCompleted) return false;
    if (statusFilter === 'completed' && !a.isCompleted) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="text-xs text-slate-500 mt-2">Memuat agenda guru...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Agenda Kegiatan Guru
          </h1>
          <p className="text-xs text-slate-500">
            Catatan kegiatan harian: jadwal tatap muka mengajar, rapat koordinasi, penilaian, dan tugas kedinasan
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> + Tambah Agenda Baru
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          {['all', 'Mengajar', 'Rapat', 'Penilaian', 'Kegiatan', 'Pribadi'].map(c => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filterCategory === c
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {c === 'all' ? 'Semua Kategori' : c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium ${
              statusFilter === 'all' ? 'bg-slate-200 dark:bg-slate-700 font-bold' : 'text-slate-400'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium ${
              statusFilter === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold' : 'text-slate-400'
            }`}
          >
            Belum Selesai
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium ${
              statusFilter === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold' : 'text-slate-400'
            }`}
          >
            Selesai
          </button>
        </div>
      </div>

      {/* Agenda List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          Belum ada catatan agenda kegiatan.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(agenda => (
            <div
              key={agenda.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                agenda.isCompleted
                  ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-75'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <button
                  onClick={() => handleToggleComplete(agenda)}
                  className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  {agenda.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                      {agenda.category}
                    </span>
                    <h4
                      className={`font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 ${
                        agenda.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                      }`}
                    >
                      {agenda.title}
                    </h4>
                  </div>

                  {agenda.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {agenda.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {new Date(agenda.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    {agenda.startTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {agenda.startTime} {agenda.endTime ? `- ${agenda.endTime}` : 'WIB'}
                      </span>
                    )}
                    {agenda.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {agenda.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleDelete(agenda.id!)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  title="Hapus Agenda"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Agenda Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Tambah Agenda Kegiatan Baru
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Agenda <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: Mengajar Matematika Bab 3 Pecahan Kelas 4"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Mengajar">Mengajar Tatap Muka</option>
                    <option value="Rapat">Rapat / Evaluasi</option>
                    <option value="Penilaian">Penilaian / Koreksi</option>
                    <option value="Kegiatan">Kegiatan Madrasah</option>
                    <option value="Pribadi">Pribadi / Tugas Dinas</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lokasi / Ruang
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Contoh: Kelas 4B / Ruang Rapat"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan / Rincian
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Materi yang akan dibahas atau perlengkapan..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
