import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  BookOpen, Calendar, Clock, FileText, CheckCircle2, 
  Save, Eye, Edit2, Printer, Plus, Users, Sparkles, Check
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useAuth } from '../../../hooks/useAuth';
import { journalService } from '../../../services/journalService';
import { attendanceService } from '../../../services/attendanceService';
import { scheduleService } from '../../../services/scheduleService';
import { subjectService } from '../../../services/subjectService';
import { teacherService } from '../../../services/teacherService';
import { triggerPrint } from '../../../utils/exportUtils';
import type { Journal, JournalStatus } from '../../../types/journal';
import type { Schedule } from '../../../types/schedule';
import type { Subject } from '../../../types/academic';
import type { Teacher } from '../../../types/teacher';

export const GuruJournal: React.FC = () => {
  const { userProfile } = useAuth();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  // Master States
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [mySchedules, setMySchedules] = useState<Schedule[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [myJournals, setMyJournals] = useState<Journal[]>([]);

  // Form State
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Journal>>({
    material: '',
    objectives: '',
    method: 'Ceramah & Diskusi Interaktif',
    media: 'Buku Teks, Lembar Kerja & Papan Tulis',
    activities: '1. Apersepsi & Doa bersama\n2. Penjelasan materi dan tanya jawab interaktif\n3. Latihan terbimbing dan penarikan kesimpulan\n4. Penutup dan refleksi',
    assessment: 'Formatif (Observasi keaktifan dan tanya jawab lisan)',
    reflection: '',
    followUp: '',
    status: 'Lengkap',
    duration: 40,
    totalStudents: 0,
    present: 0,
    sick: 0,
    permission: 0,
    absent: 0
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal State
  const [viewingJournal, setViewingJournal] = useState<Journal | null>(null);

  useEffect(() => {
    initData();
  }, [userProfile]);

  const initData = async () => {
    if (!userProfile) return;
    setIsLoading(true);
    try {
      const [tList, subList, allSchedules, allJournals] = await Promise.all([
        teacherService.getAll(),
        subjectService.getAll(),
        scheduleService.getAll(),
        journalService.getAll()
      ]);

      const currentTeacher = tList.find(t => t.email === userProfile.email || t.teacherCode === userProfile.teacherCode || t.userId === userProfile.uid);
      setTeacher(currentTeacher || null);
      setSubjects(subList);

      const teacherId = currentTeacher?.teacherCode || currentTeacher?.id || userProfile.teacherCode;
      const filteredSchedules = allSchedules.filter(s => s.teacherId === teacherId || s.teacherId === userProfile.uid);
      setMySchedules(filteredSchedules);

      const filteredJournals = allJournals.filter(j => j.teacherId === teacherId || j.teacherId === userProfile.uid);
      setMyJournals(filteredJournals);

      // Check query params
      const qScheduleId = searchParams.get('scheduleId');
      const qDate = searchParams.get('date');

      if (qDate) setSelectedDate(qDate);

      if (qScheduleId && filteredSchedules.some(s => s.id === qScheduleId)) {
        setSelectedScheduleId(qScheduleId);
      } else if (filteredSchedules.length > 0) {
        setSelectedScheduleId(filteredSchedules[0].id!);
      }
    } catch (error) {
      console.error('Error loading journal init data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync attendance data when schedule / date changes
  useEffect(() => {
    if (selectedScheduleId && selectedDate) {
      checkExistingOrFetchAttendance();
    }
  }, [selectedScheduleId, selectedDate]);

  const checkExistingOrFetchAttendance = async () => {
    if (!selectedScheduleId || !selectedDate) return;
    const schedule = mySchedules.find(s => s.id === selectedScheduleId);
    if (!schedule) return;

    try {
      // 1. Check if journal already exists
      const existingJ = await journalService.getByScheduleAndDate(selectedScheduleId, selectedDate);
      if (existingJ) {
        setEditingJournalId(existingJ.id || null);
        setFormData({
          material: existingJ.material || '',
          objectives: existingJ.objectives || '',
          method: existingJ.method || '',
          media: existingJ.media || '',
          activities: existingJ.activities || '',
          assessment: existingJ.assessment || '',
          reflection: existingJ.reflection || '',
          followUp: existingJ.followUp || '',
          status: existingJ.status || 'Lengkap',
          duration: existingJ.duration || 40,
          totalStudents: existingJ.totalStudents || 0,
          present: existingJ.present || 0,
          sick: existingJ.sick || 0,
          permission: existingJ.permission || 0,
          absent: existingJ.absent || 0
        });
        return;
      }

      // If no existing journal, check attendance session to auto-fill counts!
      setEditingJournalId(null);
      const attSession = await attendanceService.getByScheduleAndDate(selectedScheduleId, selectedDate);
      if (attSession) {
        setFormData(prev => ({
          ...prev,
          totalStudents: attSession.totalStudents ?? 0,
          present: attSession.presentCount ?? 0,
          sick: attSession.sickCount ?? 0,
          permission: attSession.permissionCount ?? 0,
          absent: attSession.absentCount ?? 0
        }));
      }
    } catch (error) {
      console.error('Error fetching journal / attendance linkage:', error);
    }
  };

  const getSubjectName = (code: string) => {
    const s = subjects.find(sub => sub.code === code || sub.id === code);
    return s ? s.name : code;
  };

  const currentSchedule = mySchedules.find(s => s.id === selectedScheduleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSchedule || !teacher) return;

    if (!formData.material?.trim()) {
      alert('Materi pembelajaran wajib diisi.');
      return;
    }
    if (!formData.activities?.trim()) {
      alert('Kegiatan pembelajaran wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Omit<Journal, 'id'> = {
        teacherId: teacher.teacherCode || teacher.id!,
        scheduleId: currentSchedule.id!,
        classId: currentSchedule.classId,
        subjectId: currentSchedule.subjectId,
        date: selectedDate,
        day: currentSchedule.day,
        lessonHour: currentSchedule.lessonHour,
        duration: Number(formData.duration) || 40,
        material: formData.material || '',
        objectives: formData.objectives || '',
        method: formData.method || '',
        media: formData.media || '',
        activities: formData.activities || '',
        assessment: formData.assessment || '',
        reflection: formData.reflection || '',
        followUp: formData.followUp || '',
        status: formData.status as JournalStatus,
        totalStudents: Number(formData.totalStudents) || 0,
        present: Number(formData.present) || 0,
        sick: Number(formData.sick) || 0,
        permission: Number(formData.permission) || 0,
        absent: Number(formData.absent) || 0,
        academicYear: currentSchedule.academicYear,
        semester: currentSchedule.semester
      };

      if (editingJournalId) {
        await journalService.update(editingJournalId, payload);
        alert('Jurnal mengajar berhasil diperbarui!');
      } else {
        const newId = await journalService.create(payload);
        setEditingJournalId(newId);
        alert('Jurnal mengajar berhasil disimpan!');
      }

      // Refresh journals
      const teacherId = teacher.teacherCode || teacher.id!;
      const refreshed = await journalService.getByTeacher(teacherId);
      setMyJournals(refreshed);
    } catch (error: any) {
      console.error('Error saving journal:', error);
      alert('Gagal menyimpan jurnal: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditFromHistory = (j: Journal) => {
    setSelectedScheduleId(j.scheduleId);
    setSelectedDate(j.date);
    setEditingJournalId(j.id || null);
    setFormData({
      material: j.material,
      objectives: j.objectives,
      method: j.method,
      media: j.media,
      activities: j.activities,
      assessment: j.assessment,
      reflection: j.reflection,
      followUp: j.followUp,
      status: j.status,
      duration: j.duration,
      totalStudents: j.totalStudents,
      present: j.present,
      sick: j.sick,
      permission: j.permission,
      absent: j.absent
    });
    setActiveTab('form');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Jurnal Mengajar</h2>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Dokumentasi keterlaksanaan proses pembelajaran tatap muka
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'form' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Isi Jurnal KBM
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'history' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Riwayat Jurnal ({myJournals.length})
          </button>
        </div>
      </div>

      {activeTab === 'form' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Schedule & Metadata Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Pilih Jadwal Pembelajaran:
                </label>
                <select
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  {mySchedules.length === 0 && <option value="">Tidak ada jadwal aktif</option>}
                  {mySchedules.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.day} Jam ke-{s.lessonHour} • Kelas {s.classId} — {getSubjectName(s.subjectId)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Tanggal Pelaksanaan:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Auto-filled Schedule Summary Banner */}
            {currentSchedule && (
              <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Mata Pelajaran:</span>
                  <span className="font-bold text-emerald-900">{getSubjectName(currentSchedule.subjectId)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Kelas:</span>
                  <span className="font-bold text-emerald-900">Kelas {currentSchedule.classId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Jam & Waktu:</span>
                  <span className="font-bold text-emerald-900">Jam ke-{currentSchedule.lessonHour} ({currentSchedule.startTime} - {currentSchedule.endTime})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tahun / Semester:</span>
                  <span className="font-bold text-emerald-900">{currentSchedule.academicYear} • {currentSchedule.semester}</span>
                </div>
              </div>
            )}

            {editingJournalId && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-600" />
                <span className="font-semibold">Mode Edit: Jurnal untuk sesi ini telah disimpan sebelumnya. Mengubah form ini akan memperbarui data jurnal.</span>
              </div>
            )}
          </div>

          {/* Student Attendance Auto-linked Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" /> Kehadiran Siswa
            </h3>
            <p className="text-xs text-slate-500">
              Data kehadiran terisi otomatis jika Anda sudah melakukan presensi siswa pada jadwal & tanggal ini.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Total Siswa</label>
                <input
                  type="number"
                  value={formData.totalStudents || 0}
                  onChange={(e) => setFormData({ ...formData, totalStudents: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-700 mb-1">Hadir</label>
                <input
                  type="number"
                  value={formData.present || 0}
                  onChange={(e) => setFormData({ ...formData, present: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-bold text-emerald-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-700 mb-1">Sakit</label>
                <input
                  type="number"
                  value={formData.sick || 0}
                  onChange={(e) => setFormData({ ...formData, sick: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm font-bold text-amber-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-700 mb-1">Izin</label>
                <input
                  type="number"
                  value={formData.permission || 0}
                  onChange={(e) => setFormData({ ...formData, permission: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-bold text-blue-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-red-700 mb-1">Alpa</label>
                <input
                  type="number"
                  value={formData.absent || 0}
                  onChange={(e) => setFormData({ ...formData, absent: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm font-bold text-red-800"
                />
              </div>
            </div>
          </div>

          {/* Pedagogical Form Fields */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" /> Rincian Pembelajaran
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Materi Pokok / Topik Pembelajaran <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.material || ''}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="Contoh: Menghafal dan Memahami Makna QS. Al-Adiyat ayat 1-11"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Tujuan Pembelajaran (TP)
              </label>
              <textarea
                rows={2}
                value={formData.objectives || ''}
                onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                placeholder="Peserta didik mampu melafalkan, membaca dengan tartil, dan menjelaskan isi kandungan surat..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Metode Pembelajaran
                </label>
                <input
                  type="text"
                  value={formData.method || ''}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  placeholder="Ceramah, Diskusi, Tanya Jawab, Demonstrasi"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Media & Sumber Belajar
                </label>
                <input
                  type="text"
                  value={formData.media || ''}
                  onChange={(e) => setFormData({ ...formData, media: e.target.value })}
                  placeholder="Buku Siswa, Al-Qur'an, Papan Tulis, Kartu Hafalan"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Kegiatan Pembelajaran (Apersepsi, Inti, Penutup) <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={formData.activities || ''}
                onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                placeholder="1. Pendahuluan: Salam, doa, presensi, apersepsi materi lalu&#10;2. Kegiatan Inti: Guru menerangkan makhraj, siswa menirukan bersama-sama dan latihan berpasangan&#10;3. Penutup: Refleksi hafalan dan doa penutup"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Penilaian / Asesmen Pembelajaran
              </label>
              <input
                type="text"
                value={formData.assessment || ''}
                onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                placeholder="Formatif: Penilaian unjuk kerja melafalkan ayat & keaktifan"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Refleksi Pembelajaran
                </label>
                <textarea
                  rows={2}
                  value={formData.reflection || ''}
                  onChange={(e) => setFormData({ ...formData, reflection: e.target.value })}
                  placeholder="Sebagian besar siswa sudah lancar, beberapa masih perlu bimbingan makhraj huruf..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Tindak Lanjut
                </label>
                <textarea
                  rows={2}
                  value={formData.followUp || ''}
                  onChange={(e) => setFormData({ ...formData, followUp: e.target.value })}
                  placeholder="Pemberian tugas penguatan hafalan di rumah dan muraja'ah pertemuan berikutnya."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Alokasi Waktu (Menit)
                </label>
                <input
                  type="number"
                  value={formData.duration || 40}
                  onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Status Jurnal
                </label>
                <select
                  value={formData.status || 'Lengkap'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as JournalStatus })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                >
                  <option value="Lengkap">Lengkap (Final)</option>
                  <option value="Draft">Draft (Belum Selesai)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3 font-bold"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Menyimpan...' : editingJournalId ? 'Perbarui Jurnal Mengajar' : 'Simpan Jurnal Mengajar'}
            </Button>
          </div>
        </form>
      ) : (
        /* HISTORY VIEW */
        <div className="space-y-4">
          {myJournals.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-base">Belum Ada Riwayat Jurnal</h3>
              <p className="text-slate-400 text-xs mt-1">Anda belum mengisikan jurnal mengajar untuk periode ini.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Tanggal & Jam</th>
                      <th className="px-6 py-4">Kelas & Mapel</th>
                      <th className="px-6 py-4">Materi Pokok</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {myJournals.map(j => (
                      <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{j.date}</div>
                          <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                            {j.day} • Jam ke-{j.lessonHour}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                              Kelas {j.classId}
                            </span>
                            <span className="font-bold text-slate-800">{getSubjectName(j.subjectId)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate">
                          {j.material}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            j.status === 'Lengkap' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {j.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setViewingJournal(j)}>
                              <Eye className="w-3.5 h-3.5 mr-1" /> Lihat & Cetak
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditFromHistory(j)}>
                              <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Viewing & Print Modal */}
      {viewingJournal && (
        <Modal
          isOpen={!!viewingJournal}
          onClose={() => setViewingJournal(null)}
          title="Pratinjau Jurnal Pembelajaran"
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-slate-800 printable-journal space-y-6">
              {/* Header Madrasah */}
              <div className="text-center pb-4 border-b-2 border-slate-800">
                <h3 className="text-lg font-bold uppercase tracking-wider text-slate-900">MI SYURIYAH PEBATAN</h3>
                <p className="text-xs font-bold uppercase text-slate-600">JURNAL PELAKSANAAN PEMBELAJARAN GURU</p>
                <p className="text-[11px] text-slate-500">Tahun Pelajaran: {viewingJournal.academicYear} • Semester: {viewingJournal.semester}</p>
              </div>

              {/* Basic Info Table */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <p><strong className="text-slate-600">Guru Pengampu:</strong> {teacher?.name || userProfile?.displayName}</p>
                  <p className="mt-1"><strong className="text-slate-600">Mata Pelajaran:</strong> {getSubjectName(viewingJournal.subjectId)}</p>
                  <p className="mt-1"><strong className="text-slate-600">Kelas / Rombel:</strong> Kelas {viewingJournal.classId}</p>
                </div>
                <div>
                  <p><strong className="text-slate-600">Hari / Tanggal:</strong> {viewingJournal.day || 'Senin'}, {viewingJournal.date}</p>
                  <p className="mt-1"><strong className="text-slate-600">Jam Pembelajaran:</strong> Jam ke-{viewingJournal.lessonHour} ({viewingJournal.duration || 40} Menit)</p>
                  <p className="mt-1"><strong className="text-slate-600">Status Jurnal:</strong> <span className="font-bold text-emerald-700">{viewingJournal.status}</span></p>
                </div>
              </div>

              {/* Attendance Breakdown */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex justify-between items-center text-emerald-900">
                <span className="font-bold">Kehadiran Siswa:</span>
                <span>Total: <strong>{viewingJournal.totalStudents ?? '-'}</strong></span>
                <span>Hadir: <strong>{viewingJournal.present ?? '-'}</strong></span>
                <span>Sakit: <strong>{viewingJournal.sick ?? '-'}</strong></span>
                <span>Izin: <strong>{viewingJournal.permission ?? '-'}</strong></span>
                <span>Alpa: <strong>{viewingJournal.absent ?? '-'}</strong></span>
              </div>

              {/* Pedagogical Sections */}
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">1. Materi Pokok / Topik Pembelajaran:</h4>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-800 whitespace-pre-wrap">
                    {viewingJournal.material}
                  </div>
                </div>

                {viewingJournal.objectives && (
                  <div>
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">2. Tujuan Pembelajaran (TP):</h4>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700 whitespace-pre-wrap">
                      {viewingJournal.objectives}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {viewingJournal.method && (
                    <div>
                      <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">3. Metode Pembelajaran:</h4>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700">
                        {viewingJournal.method}
                      </div>
                    </div>
                  )}
                  {viewingJournal.media && (
                    <div>
                      <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">4. Media & Sumber Belajar:</h4>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700">
                        {viewingJournal.media}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">5. Kegiatan Pembelajaran (Apersepsi, Inti, Penutup):</h4>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700 whitespace-pre-wrap">
                    {viewingJournal.activities}
                  </div>
                </div>

                {viewingJournal.assessment && (
                  <div>
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">6. Penilaian / Asesmen:</h4>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700 whitespace-pre-wrap">
                      {viewingJournal.assessment}
                    </div>
                  </div>
                )}

                {(viewingJournal.reflection || viewingJournal.followUp) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">7. Refleksi Guru:</h4>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700">
                        {viewingJournal.reflection || '-'}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">8. Tindak Lanjut:</h4>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700">
                        {viewingJournal.followUp || '-'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 text-center text-xs text-slate-700">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-bold">Kepala Madrasah</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">H. AHMAD SYAFI'I, S.Pd.I</p>
                  <p className="text-[10px] text-slate-500">NIP. 197805122005011004</p>
                </div>
                <div>
                  <p>Pebatan, {viewingJournal.date}</p>
                  <p className="font-bold">Guru Pengampu</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">{teacher?.name || userProfile?.displayName}</p>
                  <p className="text-[10px] text-slate-500">NIP/Kode: {teacher?.nip || viewingJournal.teacherId}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" onClick={() => triggerPrint()}>
                <Printer className="w-4 h-4 mr-2" /> Cetak Jurnal (A4)
              </Button>
              <Button onClick={() => setViewingJournal(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
