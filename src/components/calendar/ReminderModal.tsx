import React, { useState } from 'react';
import { X, Clock, AlertCircle, Calendar, Tag, Loader2 } from 'lucide-react';
import type { ReminderItem } from '../../types/calendar';
import { reminderService } from '../../services/reminderService';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  currentUser: { uid: string; name: string };
  initialData?: Partial<ReminderItem>;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  currentUser,
  initialData
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [date, setDate] = useState(initialData?.date || '2026-08-30');
  const [time, setTime] = useState(initialData?.time || '19:00');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('high');
  const [deadlineType, setDeadlineType] = useState<ReminderItem['deadlineType']>('nilai');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setDate(initialData?.date || '2026-08-30');
      setTime(initialData?.time || '19:00');
      setNotes(initialData?.notes || '');
      setPriority(initialData?.priority || 'high');
      setDeadlineType(initialData?.deadlineType || 'nilai');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Masukkan judul pengingat');
      return;
    }

    try {
      setIsSubmitting(true);
      await reminderService.createReminder(
        {
          title: title.trim(),
          date,
          time,
          notes: notes.trim(),
          priority,
          deadlineType,
          targetUserId: currentUser.uid,
          targetUserName: currentUser.name,
          academicYear: '2026/2027',
          semester: 'Ganjil',
          createdBy: currentUser.uid,
          createdByName: currentUser.name
        },
        currentUser
      );

      onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat pengingat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                Buat Pengingat Kegiatan / Deadline
              </h3>
              <p className="text-[11px] text-slate-500">
                Pengingat tugas, pengumpulan nilai, modul ajar, atau rapat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Judul Pengingat <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: Input nilai Formatif & Sumatif Kelas 4"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Pengingat
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Waktu (Jam)
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Deadline
              </label>
              <select
                value={deadlineType}
                onChange={e => setDeadlineType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="nilai">Input / Rekap Nilai</option>
                <option value="rpp">Modul Ajar / RPP</option>
                <option value="rapor">Buku Rapor Siswa</option>
                <option value="rapat">Rapat / Evaluasi</option>
                <option value="umum">Kegiatan Umum</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prioritas
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="high">Tinggi (Mendesak)</option>
                <option value="medium">Sedang</option>
                <option value="low">Biasa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Tambahan
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Catatan rincian apa yang harus disiapkan..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                </>
              ) : (
                'Pasang Pengingat'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
