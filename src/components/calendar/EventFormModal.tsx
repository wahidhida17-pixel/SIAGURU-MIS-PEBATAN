import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, Tag, Loader2 } from 'lucide-react';
import type { CalendarEvent, CalendarEventType, TargetAudience } from '../../types/calendar';
import type { Semester } from '../../types/academic';
import { calendarService } from '../../services/calendarService';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  eventToEdit?: CalendarEvent | null;
  initialDate?: string;
  currentUser?: { uid: string; name?: string; role?: string; [key: string]: any };
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  eventToEdit,
  initialDate,
  currentUser
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CalendarEventType>('Kegiatan Madrasah');
  const [startDate, setStartDate] = useState(initialDate || '2026-08-28');
  const [endDate, setEndDate] = useState(initialDate || '2026-08-28');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('Semua');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [semester, setSemester] = useState<Semester>('Ganjil');
  const [isHoliday, setIsHoliday] = useState(false);
  const [color, setColor] = useState('#10b981');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const eventTypes: CalendarEventType[] = [
    'Kegiatan Madrasah',
    'Kegiatan Kelas',
    'Kegiatan Guru',
    'Rapat',
    'Ujian',
    'PTS',
    'PAS',
    'PAT',
    'Keagamaan',
    'Pramuka',
    'Olahraga',
    'Seni',
    'Libur',
    'Lainnya'
  ];

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || '');
      setType(eventToEdit.type);
      setStartDate(eventToEdit.startDate);
      setEndDate(eventToEdit.endDate);
      setStartTime(eventToEdit.startTime || '08:00');
      setEndTime(eventToEdit.endTime || '11:00');
      setLocation(eventToEdit.location || '');
      setTargetAudience(eventToEdit.targetAudience || 'Semua');
      setAcademicYear(eventToEdit.academicYear || '2026/2027');
      setSemester(eventToEdit.semester || 'Ganjil');
      setIsHoliday(eventToEdit.isHoliday || false);
      setColor(eventToEdit.color || '#10b981');
    } else {
      setTitle('');
      setDescription('');
      setType('Kegiatan Madrasah');
      setStartDate(initialDate || '2026-08-28');
      setEndDate(initialDate || '2026-08-28');
      setStartTime('08:00');
      setEndTime('11:00');
      setLocation('MI Syuriyah Pebatan');
      setTargetAudience('Semua');
      setIsHoliday(false);
      setColor('#10b981');
    }
  }, [eventToEdit, initialDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Nama agenda tidak boleh kosong.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (eventToEdit?.id) {
        await calendarService.updateEvent(
          eventToEdit.id,
          {
            title: title.trim(),
            description: description.trim(),
            type,
            startDate,
            endDate,
            startTime,
            endTime,
            location: location.trim(),
            targetAudience,
            academicYear,
            semester,
            isHoliday,
            color
          },
          currentUser
        );
      } else {
        await calendarService.createEvent(
          {
            title: title.trim(),
            description: description.trim(),
            type,
            startDate,
            endDate,
            startTime,
            endTime,
            location: location.trim(),
            targetAudience,
            academicYear,
            semester,
            isHoliday,
            color,
            createdBy: currentUser.uid,
            createdByName: currentUser.name
          },
          currentUser
        );
      }

      onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan agenda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                {eventToEdit ? 'Edit Agenda Kalender' : 'Tambah Agenda Kalender'}
              </h3>
              <p className="text-xs text-slate-500">
                Jadwalkan kegiatan madrasah, rapat dewan guru, atau ujian
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Judul Agenda Kegiatan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: Rapat Dewan Guru Evaluasi Bulanan"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jenis Agenda
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as CalendarEventType)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              >
                {eventTypes.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Peserta
              </label>
              <select
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value as TargetAudience)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Semua">Semua Warga Madrasah</option>
                <option value="Guru">Dewan Guru & Tenaga Kependidikan</option>
                <option value="Siswa">Seluruh Santri / Siswa</option>
                <option value="Wali Murid">Wali Murid / Komite</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Selesai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Waktu Mulai
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Waktu Selesai
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tempat / Lokasi
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Contoh: Ruang Guru / Lapangan Utama / Aula"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Keterangan & Rincian Agenda
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Tuliskan tujuan agenda, susunan acara, atau pakaian..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                'Simpan Agenda'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
