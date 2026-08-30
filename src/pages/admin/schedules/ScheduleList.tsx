import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, LayoutGrid, List, AlertTriangle, Clock, BookOpen, User, Building } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { scheduleService } from '../../../services/scheduleService';
import { classService } from '../../../services/classService';
import { subjectService } from '../../../services/subjectService';
import { teacherService } from '../../../services/teacherService';
import { auditService } from '../../../services/auditService';
import { useAuth } from '../../../hooks/useAuth';
import type { Schedule, DayOfWeek, ScheduleConflict } from '../../../types/schedule';
import type { ClassData, Subject } from '../../../types/academic';
import type { Teacher } from '../../../types/teacher';

const DAYS: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const LESSON_HOURS = [1, 2, 3, 4, 5, 6, 7, 8];

const DEFAULT_HOURS_MAP: Record<number, { start: string; end: string }> = {
  1: { start: '07:30', end: '08:10' },
  2: { start: '08:10', end: '08:50' },
  3: { start: '09:10', end: '09:50' },
  4: { start: '09:50', end: '10:30' },
  5: { start: '10:45', end: '11:25' },
  6: { start: '11:25', end: '12:05' },
  7: { start: '12:35', end: '13:15' },
  8: { start: '13:15', end: '13:55' }
};

export const ScheduleList: React.FC = () => {
  const { userProfile } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Schedule>>({
    day: 'Senin',
    lessonHour: 1,
    startTime: '07:30',
    endTime: '08:10',
    classId: '',
    subjectId: '',
    teacherId: '',
    room: '',
    academicYear: '2026/2027',
    semester: 'Ganjil',
    status: 'active'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [sData, cData, subData, tData] = await Promise.all([
        scheduleService.getAll(),
        classService.getAll(),
        subjectService.getAll(),
        teacherService.getAll()
      ]);
      setSchedules(sData);
      setClasses(cData);
      setSubjects(subData);
      setTeachers(tData);
    } catch (error) {
      console.error('Error fetching schedules data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (s?: Schedule) => {
    setConflictError(null);
    if (s) {
      setEditingId(s.id!);
      setFormData(s);
    } else {
      setEditingId(null);
      const defaultClass = classes[0]?.name || '';
      const defaultSubject = subjects[0]?.code || '';
      const defaultTeacher = teachers[0]?.teacherCode || '';
      setFormData({
        day: 'Senin',
        lessonHour: 1,
        startTime: '07:30',
        endTime: '08:10',
        classId: defaultClass,
        subjectId: defaultSubject,
        teacherId: defaultTeacher,
        room: '',
        academicYear: '2026/2027',
        semester: 'Ganjil',
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleHourChange = (hour: number) => {
    const times = DEFAULT_HOURS_MAP[hour] || { start: '07:30', end: '08:10' };
    setFormData(prev => ({
      ...prev,
      lessonHour: hour,
      startTime: times.start,
      endTime: times.end
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);
    try {
      if (editingId) {
        await scheduleService.update(editingId, formData);
        await auditService.log(
          userProfile!.uid,
          userProfile!.displayName,
          'UPDATE_SCHEDULE',
          'schedules',
          editingId,
          `Update jadwal ${formData.day} Jam ${formData.lessonHour} Kelas ${formData.classId}`
        );
      } else {
        const newId = await scheduleService.create(formData as Omit<Schedule, 'id'>);
        await auditService.log(
          userProfile!.uid,
          userProfile!.displayName,
          'CREATE_SCHEDULE',
          'schedules',
          newId,
          `Buat jadwal ${formData.day} Jam ${formData.lessonHour} Kelas ${formData.classId}`
        );
      }
      setIsModalOpen(false);
      fetchInitialData();
    } catch (error: any) {
      if (error.message.includes('KONFLIK:')) {
        setConflictError(error.message.replace('Error: KONFLIK: ', ''));
      } else {
        alert('Gagal menyimpan jadwal: ' + error.message);
      }
    }
  };

  const handleDelete = async (id: string, s: Schedule) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus jadwal ${s.day} Jam ke-${s.lessonHour} Kelas ${s.classId}?`)) {
      try {
        await scheduleService.delete(id);
        await auditService.log(
          userProfile!.uid,
          userProfile!.displayName,
          'DELETE_SCHEDULE',
          'schedules',
          id,
          `Hapus jadwal ${s.day} Jam ${s.lessonHour} Kelas ${s.classId}`
        );
        fetchInitialData();
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('Gagal menghapus jadwal');
      }
    }
  };

  const getTeacherName = (tCode: string) => {
    const t = teachers.find(item => item.teacherCode === tCode || item.id === tCode);
    return t ? t.name : tCode;
  };

  const getSubjectName = (sCode: string) => {
    const s = subjects.find(item => item.code === sCode || item.id === sCode);
    return s ? s.name : sCode;
  };

  const filteredSchedules = schedules.filter(s => {
    if (selectedDay !== 'all' && s.day !== selectedDay) return false;
    if (selectedClass !== 'all' && s.classId !== selectedClass) return false;
    if (selectedTeacher !== 'all' && s.teacherId !== selectedTeacher) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Calendar className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Jadwal Pelajaran</h2>
          </div>
          <p className="text-slate-500 text-sm mt-1">Kelola jadwal pelajaran seluruh kelas di MI Syuriyah Pebatan</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'table' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" /> Tabel
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Grid Mingguan
            </button>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Jadwal
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hari:</label>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Hari</option>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kelas:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Kelas</option>
            {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Guru:</label>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Guru</option>
            {teachers.map(t => <option key={t.id} value={t.teacherCode}>{t.name} ({t.teacherCode})</option>)}
          </select>
        </div>
      </div>

      {/* Content Mode */}
      {isLoading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm font-medium">Memuat data jadwal pelajaran...</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Hari & Jam</th>
                  <th className="px-6 py-4">Kelas</th>
                  <th className="px-6 py-4">Mata Pelajaran</th>
                  <th className="px-6 py-4">Guru Pengampu</th>
                  <th className="px-6 py-4">Ruang</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      Tidak ada jadwal yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{s.day}</div>
                        <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> Jam ke-{s.lessonHour} ({s.startTime} - {s.endTime})
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          Kelas {s.classId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{getSubjectName(s.subjectId)}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Kode: {s.subjectId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-800 font-semibold">{getTeacherName(s.teacherId)}</div>
                        <div className="text-[11px] text-slate-400">Kode: {s.teacherId}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {s.room || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
                          s.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {s.status === 'active' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenModal(s)}>
                            <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(s.id!, s)} className="text-red-600 hover:bg-red-50 hover:border-red-200">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* WEEKLY GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {DAYS.map(day => {
            const daySchedules = schedules
              .filter(s => s.day === day && (selectedClass === 'all' || s.classId === selectedClass))
              .sort((a, b) => a.lessonHour - b.lessonHour);

            return (
              <div key={day} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="bg-slate-800 text-white p-3 text-center font-bold text-sm flex items-center justify-between">
                  <span>{day}</span>
                  <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full text-slate-300 font-mono">
                    {daySchedules.length} Sesi
                  </span>
                </div>
                <div className="p-3 space-y-2.5 flex-1 bg-slate-50/50">
                  {daySchedules.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Tidak ada jadwal
                    </div>
                  ) : (
                    daySchedules.map(s => (
                      <div
                        key={s.id}
                        className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 transition-all cursor-pointer group"
                        onClick={() => handleOpenModal(s)}
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 mb-1">
                          <span>Jam ke-{s.lessonHour}</span>
                          <span className="text-slate-400 font-normal">{s.startTime}</span>
                        </div>
                        <p className="font-bold text-slate-800 text-xs line-clamp-1">{getSubjectName(s.subjectId)}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                          <span className="font-bold text-blue-600">Kelas {s.classId}</span>
                          <span className="text-slate-500 truncate max-w-[90px]">{getTeacherName(s.teacherId)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Pelajaran'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {conflictError && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800">Jadwal tidak dapat disimpan karena terjadi konflik jadwal:</p>
                <p className="mt-1 text-xs text-amber-700 whitespace-pre-line">{conflictError}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Hari</label>
              <select
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value as DayOfWeek })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                required
              >
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Jam Ke-</label>
              <select
                value={formData.lessonHour}
                onChange={(e) => handleHourChange(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                required
              >
                {LESSON_HOURS.map(h => (
                  <option key={h} value={h}>
                    Jam ke-{h} ({DEFAULT_HOURS_MAP[h]?.start || ''} - {DEFAULT_HOURS_MAP[h]?.end || ''})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Jam Mulai"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              placeholder="07:30"
              required
            />
            <Input
              label="Jam Selesai"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              placeholder="08:10"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Kelas</label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Mata Pelajaran</label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">-- Pilih Mapel --</option>
                {subjects.map(s => <option key={s.id} value={s.code}>{s.name} ({s.code})</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Guru Pengampu</label>
            <select
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">-- Pilih Guru --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.teacherCode}>
                  {t.name} ({t.teacherCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ruang (Opsional)"
              value={formData.room || ''}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              placeholder="Contoh: Lab / Kelas 6"
            />
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3 justify-end border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">
              Simpan Jadwal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
