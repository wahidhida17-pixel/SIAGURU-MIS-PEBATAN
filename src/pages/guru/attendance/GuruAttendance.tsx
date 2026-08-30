import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, CheckCircle2, AlertCircle, HelpCircle, XCircle, 
  Search, Users, Save, Sparkles, ArrowRight, Download, Printer, Check
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useAuth } from '../../../hooks/useAuth';
import { attendanceService } from '../../../services/attendanceService';
import { studentService } from '../../../services/studentService';
import { scheduleService } from '../../../services/scheduleService';
import { teacherService } from '../../../services/teacherService';
import { subjectService } from '../../../services/subjectService';
import { classService } from '../../../services/classService';
import { exportToCSV, triggerPrint } from '../../../utils/exportUtils';
import type { AttendanceRecord, AttendanceSession, AttendanceStatus, StudentAttendanceRecap } from '../../../types/attendance';
import type { Student, ClassData, Subject } from '../../../types/academic';
import type { Schedule } from '../../../types/schedule';
import type { Teacher } from '../../../types/teacher';

export const GuruAttendance: React.FC = () => {
  const { userProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'sheet' | 'recap'>('sheet');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Data states
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [mySchedules, setMySchedules] = useState<Schedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);

  // Attendance Sheet state
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [existingSessionId, setExistingSessionId] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Success Modal
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [savedStats, setSavedStats] = useState<{ total: number; present: number; sick: number; perm: number; absent: number }>({
    total: 0, present: 0, sick: 0, perm: 0, absent: 0
  });

  // Recap Tab
  const [recapClass, setRecapClass] = useState<string>('');
  const [recapData, setRecapData] = useState<StudentAttendanceRecap[]>([]);
  const [isRecapLoading, setIsRecapLoading] = useState(false);

  useEffect(() => {
    initTeacherData();
  }, [userProfile]);

  const initTeacherData = async () => {
    if (!userProfile) return;
    setIsLoading(true);
    try {
      const [tList, subList, cList, allSchedules] = await Promise.all([
        teacherService.getAll(),
        subjectService.getAll(),
        classService.getAll(),
        scheduleService.getAll()
      ]);

      const currentTeacher = tList.find(t => t.email === userProfile.email || t.teacherCode === userProfile.teacherCode || t.userId === userProfile.uid);
      setTeacher(currentTeacher || null);
      setSubjects(subList);
      setClasses(cList);

      const teacherId = currentTeacher?.teacherCode || currentTeacher?.id || userProfile.teacherCode;
      const filteredSchedules = allSchedules.filter(s => s.teacherId === teacherId || s.teacherId === userProfile.uid);
      setMySchedules(filteredSchedules);

      // Check query params
      const qScheduleId = searchParams.get('scheduleId');
      if (qScheduleId && filteredSchedules.some(s => s.id === qScheduleId)) {
        setSelectedScheduleId(qScheduleId);
      } else if (filteredSchedules.length > 0) {
        setSelectedScheduleId(filteredSchedules[0].id!);
      }

      if (filteredSchedules.length > 0) {
        setRecapClass(filteredSchedules[0].classId);
      } else if (cList.length > 0) {
        setRecapClass(cList[0].name);
      }
    } catch (error) {
      console.error('Error initializing attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedScheduleId) {
      loadStudentsForSchedule();
    }
  }, [selectedScheduleId, selectedDate]);

  useEffect(() => {
    if (activeTab === 'recap' && recapClass) {
      loadRecap();
    }
  }, [activeTab, recapClass]);

  const loadStudentsForSchedule = async () => {
    const schedule = mySchedules.find(s => s.id === selectedScheduleId);
    if (!schedule) return;

    setIsLoading(true);
    try {
      const studentList = await studentService.getByClass(schedule.classId);
      setStudents(studentList);

      // Check if session exists in DB
      const existingSession = await attendanceService.getByScheduleAndDate(schedule.id!, selectedDate);

      if (existingSession && existingSession.records) {
        setExistingSessionId(existingSession.id || null);
        setNotes(existingSession.notes || '');
        setRecords(existingSession.records);
      } else {
        // Default all to hadir
        setExistingSessionId(null);
        setNotes('');
        const initialRecords: Record<string, AttendanceRecord> = {};
        studentList.forEach(s => {
          const sId = s.id || s.nis;
          initialRecords[sId] = {
            studentId: sId,
            studentName: s.name,
            nis: s.nis,
            gender: s.gender,
            status: 'hadir',
            note: ''
          };
        });
        setRecords(initialRecords);
      }
    } catch (error) {
      console.error('Error loading schedule students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecap = async () => {
    if (!recapClass) return;
    setIsRecapLoading(true);
    try {
      const data = await attendanceService.getRecapByClass(recapClass);
      setRecapData(data);
    } catch (error) {
      console.error('Error loading recap:', error);
    } finally {
      setIsRecapLoading(false);
    }
  };

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleSetNote = (studentId: string, note: string) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note
      }
    }));
  };

  const handleAllPresent = () => {
    const updated = { ...records };
    Object.keys(updated).forEach(id => {
      updated[id] = { ...updated[id], status: 'hadir' };
    });
    setRecords(updated);
  };

  const handleSaveAttendance = async () => {
    const schedule = mySchedules.find(s => s.id === selectedScheduleId);
    if (!schedule || !teacher) return;

    setIsSaving(true);
    try {
      const recordArray = Object.values(records) as AttendanceRecord[];
      const present = recordArray.filter(r => r.status === 'hadir').length;
      const sick = recordArray.filter(r => r.status === 'sakit').length;
      const perm = recordArray.filter(r => r.status === 'izin').length;
      const absent = recordArray.filter(r => r.status === 'alpa').length;

      const payload: Omit<AttendanceSession, 'id'> = {
        date: selectedDate,
        scheduleId: schedule.id!,
        teacherId: teacher.teacherCode || teacher.id!,
        classId: schedule.classId,
        subjectId: schedule.subjectId,
        academicYear: schedule.academicYear,
        semester: schedule.semester,
        notes: notes,
        records: records
      };

      const savedId = await attendanceService.saveAttendance(payload, existingSessionId || undefined);
      setExistingSessionId(savedId);
      setSavedStats({
        total: recordArray.length,
        present,
        sick,
        perm,
        absent
      });
      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Gagal menyimpan presensi');
    } finally {
      setIsSaving(false);
    }
  };

  const getSubjectName = (code: string) => {
    const s = subjects.find(sub => sub.code === code || sub.id === code);
    return s ? s.name : code;
  };

  const currentSchedule = mySchedules.find(s => s.id === selectedScheduleId);

  // Filtered Students by search
  const filteredStudents = students.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.nis.includes(q);
  });

  // Calculate live stats
  const recordList = Object.values(records) as AttendanceRecord[];
  const countPresent = recordList.filter(r => r.status === 'hadir').length;
  const countSick = recordList.filter(r => r.status === 'sakit').length;
  const countPerm = recordList.filter(r => r.status === 'izin').length;
  const countAbsent = recordList.filter(r => r.status === 'alpa').length;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Calendar className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Presensi Siswa</h2>
          </div>
          <p className="text-slate-500 text-sm mt-1">Isi daftar kehadiran siswa dengan cepat & mudah</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('sheet')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'sheet' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lembar Presensi
            </button>
            <button
              onClick={() => setActiveTab('recap')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'recap' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rekap Kelas
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'sheet' ? (
        <>
          {/* Schedule & Date Selectors */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
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
                  Tanggal Presensi:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {existingSessionId && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-between">
                <span className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" /> Presensi tanggal ini sudah pernah disimpan. Anda dapat memperbarui jika ada perubahan.
                </span>
              </div>
            )}

            {/* Quick Actions & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={handleAllPresent}
                className="w-full sm:w-auto text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold"
              >
                <Check className="w-4 h-4 mr-1.5" /> Set Semua Siswa HADIR
              </Button>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari siswa / NIS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Student Attendance List */}
          {isLoading ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-500 text-sm">Memuat daftar siswa...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-base">Tidak Ada Siswa Ditemukan</h3>
              <p className="text-slate-400 text-xs mt-1">Pastikan kelas ini telah memiliki data siswa aktif.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((s, idx) => {
                const sId = s.id || s.nis;
                const rec = records[sId] || { status: 'hadir', note: '' };

                return (
                  <div
                    key={sId}
                    className={`bg-white rounded-2xl border p-4 transition-all ${
                      rec.status === 'hadir' ? 'border-emerald-200 bg-emerald-50/20' :
                      rec.status === 'sakit' ? 'border-amber-200 bg-amber-50/20' :
                      rec.status === 'izin' ? 'border-blue-200 bg-blue-50/20' :
                      'border-red-200 bg-red-50/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Student Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                          {s.absentNumber || idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{s.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            NIS: {s.nis} • {s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </p>
                        </div>
                      </div>

                      {/* 4 Status Buttons (Single-Hand Touch friendly) */}
                      <div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center">
                        <button
                          type="button"
                          onClick={() => handleSetStatus(sId, 'hadir')}
                          className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all text-center ${
                            rec.status === 'hadir'
                              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Hadir
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetStatus(sId, 'sakit')}
                          className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all text-center ${
                            rec.status === 'sakit'
                              ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/30'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Sakit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetStatus(sId, 'izin')}
                          className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all text-center ${
                            rec.status === 'izin'
                              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Izin
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetStatus(sId, 'alpa')}
                          className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all text-center ${
                            rec.status === 'alpa'
                              ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-600/30'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Alpa
                        </button>
                      </div>
                    </div>

                    {/* Note input if not present */}
                    {rec.status !== 'hadir' && (
                      <div className="mt-3 pt-2 border-t border-slate-100/80">
                        <input
                          type="text"
                          placeholder={`Catatan keterangan ${rec.status} (opsional)...`}
                          value={rec.note || ''}
                          onChange={(e) => handleSetNote(sId, e.target.value)}
                          className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Sticky Bottom Summary Bar */}
          <div className="fixed bottom-16 lg:bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200 p-4 shadow-lg z-30">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-6 text-xs font-bold">
                <span className="text-slate-500">Total: {students.length}</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                  {countPresent} Hadir
                </span>
                <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                  {countSick} Sakit
                </span>
                <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                  {countPerm} Izin
                </span>
                <span className="text-red-700 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                  {countAbsent} Alpa
                </span>
              </div>

              <Button
                onClick={handleSaveAttendance}
                disabled={isSaving || students.length === 0}
                className="w-full sm:w-auto px-8"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Menyimpan...' : 'Simpan Presensi'}
              </Button>
            </div>
          </div>
        </>
      ) : (
        /* RECAP VIEW */
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Kelas:</label>
              <select
                value={recapClass}
                onChange={(e) => setRecapClass(e.target.value)}
                className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
              >
                {classes.map(c => <option key={c.id} value={c.name}>Kelas {c.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const headers = ['No', 'NIS', 'Nama Siswa', 'L/P', 'Hadir', 'Sakit', 'Izin', 'Alpa', '% Kehadiran'];
                const rows = recapData.map((r, i) => [
                  i + 1, r.nis, r.name, r.gender, r.hadir, r.sakit, r.izin, r.alpa, `${r.percentage}%`
                ]);
                exportToCSV(`Rekap_Absensi_Kelas_${recapClass}`, headers, rows);
              }}>
                <Download className="w-4 h-4 mr-1.5" /> Export Excel
              </Button>
              <Button variant="outline" size="sm" onClick={triggerPrint}>
                <Printer className="w-4 h-4 mr-1.5" /> Cetak
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 printable-area">
            <div className="text-center mb-6 pb-4 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 uppercase">MI SYURIYAH PEBATAN</h3>
              <p className="text-sm font-bold text-slate-700">REKAPITULASI PRESENSI SISWA — KELAS {recapClass}</p>
              <p className="text-xs text-slate-500">Tahun Pelajaran: 2026/2027 • Semester: Ganjil</p>
            </div>

            {isRecapLoading ? (
              <div className="py-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-500 text-sm">Menghitung statistik kehadiran kelas...</p>
              </div>
            ) : recapData.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                Belum ada catatan presensi untuk kelas ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 text-xs font-bold uppercase border border-slate-200">
                      <th className="px-4 py-3 border border-slate-200 text-center w-12">No</th>
                      <th className="px-4 py-3 border border-slate-200">NIS</th>
                      <th className="px-4 py-3 border border-slate-200">Nama Lengkap Siswa</th>
                      <th className="px-4 py-3 border border-slate-200 text-center w-12">L/P</th>
                      <th className="px-4 py-3 border border-slate-200 text-center text-emerald-700 w-16">Hadir</th>
                      <th className="px-4 py-3 border border-slate-200 text-center text-amber-700 w-16">Sakit</th>
                      <th className="px-4 py-3 border border-slate-200 text-center text-blue-700 w-16">Izin</th>
                      <th className="px-4 py-3 border border-slate-200 text-center text-red-700 w-16">Alpa</th>
                      <th className="px-4 py-3 border border-slate-200 text-center w-24">% Hadir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recapData.map((r, idx) => (
                      <tr key={r.studentId} className="hover:bg-slate-50 border border-slate-200">
                        <td className="px-4 py-2.5 text-center font-mono border border-slate-200 text-xs">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-mono text-xs border border-slate-200">{r.nis}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-800 border border-slate-200">{r.name}</td>
                        <td className="px-4 py-2.5 text-center text-xs border border-slate-200 font-bold">{r.gender}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-emerald-700 border border-slate-200">{r.hadir}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-amber-700 border border-slate-200">{r.sakit}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-blue-700 border border-slate-200">{r.izin}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-red-700 border border-slate-200">{r.alpa}</td>
                        <td className="px-4 py-2.5 text-center font-bold border border-slate-200">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            r.percentage >= 85 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {r.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Modal with direct flow to Jurnal */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Presensi Berhasil Disimpan!"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div>
            <p className="text-slate-600 text-sm">
              Data kehadiran siswa untuk <strong>Kelas {currentSchedule?.classId}</strong> ({selectedDate}) telah tersimpan ke sistem.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-bold">
            <div className="text-emerald-700">
              <p className="text-[10px] text-slate-400">HADIR</p>
              <p className="text-base">{savedStats.present}</p>
            </div>
            <div className="text-amber-700">
              <p className="text-[10px] text-slate-400">SAKIT</p>
              <p className="text-base">{savedStats.sick}</p>
            </div>
            <div className="text-blue-700">
              <p className="text-[10px] text-slate-400">IZIN</p>
              <p className="text-base">{savedStats.perm}</p>
            </div>
            <div className="text-red-700">
              <p className="text-[10px] text-slate-400">ALPA</p>
              <p className="text-base">{savedStats.absent}</p>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button
              className="w-full justify-center"
              onClick={() => {
                setIsSuccessModalOpen(false);
                if (currentSchedule) {
                  navigate(`/guru/jurnal?scheduleId=${currentSchedule.id}&classId=${currentSchedule.classId}&subjectId=${currentSchedule.subjectId}&date=${selectedDate}&day=${currentSchedule.day}&hour=${currentSchedule.lessonHour}`);
                } else {
                  navigate('/guru/jurnal');
                }
              }}
            >
              Lanjut Isi Jurnal Mengajar <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button variant="outline" onClick={() => setIsSuccessModalOpen(false)}>
              Selesai & Tetap di Halaman Ini
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
