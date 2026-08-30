import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Send,
  Trash2,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { reminderService } from '../../../services/reminderService';
import { teacherService } from '../../../services/teacherService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { ReminderItem, DeadlineType, ReminderPriority } from '../../../types/calendar';
import type { Teacher } from '../../../types/teacher';

export const AdminRemindersView: React.FC = () => {
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-09-05');
  const [time, setTime] = useState('12:00');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<ReminderPriority>('high');
  const [deadlineType, setDeadlineType] = useState<DeadlineType>('rapor');
  const [targetUserId, setTargetUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rList, tList] = await Promise.all([
        reminderService.getReminders(),
        teacherService.getAll()
      ]);
      setReminders(rList);
      setTeachers(tList);
    } catch (e) {
      console.error('Error loading reminders:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      const targetTeacher = teachers.find(t => t.id === targetUserId);

      // If empty target, broadcast to all teachers
      if (!targetUserId) {
        for (const t of teachers) {
          await reminderService.createReminder(
            {
              title: title.trim(),
              date,
              time,
              notes: notes.trim(),
              priority,
              deadlineType,
              targetUserId: t.id,
              targetUserName: t.name,
              academicYear: '2026/2027',
              semester: 'Ganjil',
              createdBy: userProfile!.uid,
              createdByName: userProfile!.name
            },
            userProfile
          );
        }
      } else {
        await reminderService.createReminder(
          {
            title: title.trim(),
            date,
            time,
            notes: notes.trim(),
            priority,
            deadlineType,
            targetUserId: targetUserId,
            targetUserName: targetTeacher?.name || 'Guru',
            academicYear: '2026/2027',
            semester: 'Ganjil',
            createdBy: userProfile!.uid,
            createdByName: userProfile!.name
          },
          userProfile
        );
      }

      setIsModalOpen(false);
      setTitle('');
      setNotes('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat pengingat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus notifikasi pengingat ini?')) {
      await reminderService.deleteReminder(id, userProfile);
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="text-xs text-slate-500 mt-2">Memuat pusat notifikasi pengingat & deadline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Pusat Pengingat & Batas Waktu (Deadlines)
          </h1>
          <p className="text-xs text-slate-500">
            Kirim pengingat batas waktu input nilai rapor, pengumpulan perangkat ajar, atau agenda rapat ke dewan guru
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> + Buat / Broadcast Pengingat
        </button>
      </div>

      {/* Reminders Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Judul Pengingat</th>
                <th className="py-3 px-4">Kategori Deadline</th>
                <th className="py-3 px-4">Target Guru</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4 text-center">Prioritas</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reminders.map(r => (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      {r.title}
                    </p>
                    <span className="text-[11px] text-slate-400 line-clamp-1">
                      {r.notes || 'Tidak ada catatan'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 uppercase font-bold text-slate-600 dark:text-slate-300 text-[10px]">
                    {r.deadlineType}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                    {r.targetUserName || 'Semua Guru'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    <p className="font-medium">
                      {new Date(r.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                    <span className="text-[10px] text-slate-400">{r.time} WIB</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.priority === 'high'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                          : r.priority === 'medium'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {r.priority === 'high'
                        ? 'Mendesak'
                        : r.priority === 'medium'
                        ? 'Sedang'
                        : 'Biasa'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.isDismissed
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {r.isDismissed ? 'Selesai' : 'Aktif'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(r.id!)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                      title="Hapus Pengingat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Kirim Pengingat & Batas Waktu Baru
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Pengingat <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: Batas Akhir Input Nilai Rapor Semester Ganjil"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Deadline
                  </label>
                  <select
                    value={deadlineType}
                    onChange={e => setDeadlineType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="rapor">Batas Nilai / Rapor</option>
                    <option value="rpp">Perangkat Ajar / Modul</option>
                    <option value="nilai">Asesmen & Ulangan</option>
                    <option value="rapat">Rapat Dewan Guru</option>
                    <option value="umum">Pengingat Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tingkat Prioritas
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="high">Mendesak (High)</option>
                    <option value="medium">Sedang (Medium)</option>
                    <option value="normal">Biasa (Normal)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Jatuh Tempo
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
                    Jam
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Penerima Pengingat
                </label>
                <select
                  value={targetUserId}
                  onChange={e => setTargetUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Broadcast ke Seluruh Dewan Guru (Semua Guru) --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.nip || 'Guru'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan / Instruksi Tambahan
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Instruksi pengumpulan dokumen atau prosedur input nilai..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Kirim Pengingat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
