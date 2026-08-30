import React, { useEffect, useState } from 'react';
import { Calendar, Users, Download, Printer, Filter, Eye, CheckCircle2, AlertCircle, HelpCircle, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { attendanceService } from '../../../services/attendanceService';
import { classService } from '../../../services/classService';
import { teacherService } from '../../../services/teacherService';
import { subjectService } from '../../../services/subjectService';
import { exportToCSV, triggerPrint } from '../../../utils/exportUtils';
import type { AttendanceSession, AttendanceRecord, StudentAttendanceRecap } from '../../../types/attendance';
import type { ClassData, Subject } from '../../../types/academic';
import type { Teacher } from '../../../types/teacher';

export const AttendanceList: React.FC = () => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<'sessions' | 'recap'>('sessions');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');

  // Recap data
  const [recapClass, setRecapClass] = useState<string>('');
  const [recapData, setRecapData] = useState<StudentAttendanceRecap[]>([]);
  const [isRecapLoading, setIsRecapLoading] = useState(false);

  // Detail Modal
  const [viewingSession, setViewingSession] = useState<AttendanceSession | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (classes.length > 0 && !recapClass) {
      setRecapClass(classes[0].name);
    }
  }, [classes]);

  useEffect(() => {
    if (activeTab === 'recap' && recapClass) {
      loadClassRecap(recapClass);
    }
  }, [activeTab, recapClass]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [sData, cData, tData, subData] = await Promise.all([
        attendanceService.getAll(),
        classService.getAll(),
        teacherService.getAll(),
        subjectService.getAll()
      ]);
      setSessions(sData);
      setClasses(cData);
      setTeachers(tData);
      setSubjects(subData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClassRecap = async (className: string) => {
    setIsRecapLoading(true);
    try {
      const data = await attendanceService.getRecapByClass(className);
      setRecapData(data);
    } catch (error) {
      console.error('Error loading class recap:', error);
    } finally {
      setIsRecapLoading(false);
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

  const filteredSessions = sessions.filter(s => {
    if (selectedDate && s.date !== selectedDate) return false;
    if (selectedClass !== 'all' && s.classId !== selectedClass) return false;
    if (selectedTeacher !== 'all' && s.teacherId !== selectedTeacher) return false;
    return true;
  });

  const handleExportRecap = () => {
    const headers = ['No', 'NIS', 'Nama Siswa', 'L/P', 'Hadir', 'Sakit', 'Izin', 'Alpa', '% Kehadiran'];
    const rows = recapData.map((r, i) => [
      i + 1,
      r.nis,
      r.name,
      r.gender,
      r.hadir,
      r.sakit,
      r.izin,
      r.alpa,
      `${r.percentage}%`
    ]);
    exportToCSV(`Rekap_Absensi_Kelas_${recapClass}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Calendar className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Absensi Siswa</h2>
          </div>
          <p className="text-slate-500 text-sm mt-1">Monitoring kehadiran siswa dan rekap absensi madrasah</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'sessions' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sesi Absensi
            </button>
            <button
              onClick={() => setActiveTab('recap')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'recap' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rekap Kelas
            </button>
          </div>
          {activeTab === 'recap' && (
            <>
              <Button variant="outline" size="sm" onClick={handleExportRecap}>
                <Download className="w-4 h-4 mr-1.5" /> Export Excel
              </Button>
              <Button variant="outline" size="sm" onClick={triggerPrint}>
                <Printer className="w-4 h-4 mr-1.5" /> Cetak
              </Button>
            </>
          )}
        </div>
      </div>

      {activeTab === 'sessions' ? (
        <>
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kelas:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
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
                className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Guru</option>
                {teachers.map(t => <option key={t.id} value={t.teacherCode}>{t.name} ({t.teacherCode})</option>)}
              </select>
            </div>
            
            <button
              onClick={() => { setSelectedDate(''); setSelectedClass('all'); setSelectedTeacher('all'); }}
              className="text-xs text-blue-600 font-bold hover:underline ml-auto"
            >
              Reset Filter
            </button>
          </div>

          {/* Sessions Table */}
          {isLoading ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-500 text-sm font-medium">Memuat data absensi...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Tanggal</th>
                      <th className="px-6 py-4">Kelas & Mapel</th>
                      <th className="px-6 py-4">Guru</th>
                      <th className="px-6 py-4 text-center">Kehadiran Siswa</th>
                      <th className="px-6 py-4 text-right">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredSessions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          Tidak ada sesi absensi yang ditemukan pada tanggal atau kriteria ini.
                        </td>
                      </tr>
                    ) : (
                      filteredSessions.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">{s.date}</div>
                            <div className="text-xs text-slate-400">{s.academicYear} • {s.semester}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                                Kelas {s.classId}
                              </span>
                              <span className="font-bold text-slate-800">{getSubjectName(s.subjectId)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{getTeacherName(s.teacherId)}</div>
                            <div className="text-xs text-slate-400">Kode: {s.teacherId}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2 text-xs">
                              <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {s.presentCount ?? 0}
                              </span>
                              <span className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                                <HelpCircle className="w-3 h-3 text-amber-600" /> {s.sickCount ?? 0}
                              </span>
                              <span className="flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                                <AlertCircle className="w-3 h-3 text-blue-600" /> {s.permissionCount ?? 0}
                              </span>
                              <span className="flex items-center gap-1 font-bold text-red-700 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                                <XCircle className="w-3 h-3 text-red-600" /> {s.absentCount ?? 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="outline" size="sm" onClick={() => setViewingSession(s)}>
                              <Eye className="w-3.5 h-3.5 mr-1" /> Lihat
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* RECAP VIEW */
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Kelas:</label>
            <select
              value={recapClass}
              onChange={(e) => setRecapClass(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 printable-area">
            {/* Print Header */}
            <div className="text-center mb-6 pb-4 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 uppercase">MI SYURIYAH PEBATAN</h3>
              <p className="text-sm font-bold text-slate-700">REKAPITULASI PRESENSI SISWA — KELAS {recapClass}</p>
              <p className="text-xs text-slate-500">Tahun Pelajaran: 2026/2027 • Semester: Ganjil</p>
            </div>

            {isRecapLoading ? (
              <div className="py-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-500 text-sm">Menghitung statistik absensi kelas...</p>
              </div>
            ) : recapData.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                Belum ada siswa atau catatan absensi untuk kelas ini.
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

      {/* Detail Session Modal */}
      {viewingSession && (
        <Modal
          isOpen={!!viewingSession}
          onClose={() => setViewingSession(null)}
          title={`Detail Presensi — Kelas ${viewingSession.classId}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Mata Pelajaran:</span>
                <span className="font-bold text-slate-800">{getSubjectName(viewingSession.subjectId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Guru Pengampu:</span>
                <span className="font-bold text-slate-800">{getTeacherName(viewingSession.teacherId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span className="font-bold text-slate-800">{viewingSession.date}</span>
              </div>
              {viewingSession.notes && (
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Catatan Sesi:</span>
                  <span className="font-medium text-slate-700">{viewingSession.notes}</span>
                </div>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {(Object.values(viewingSession.records || {}) as AttendanceRecord[]).map((record, index) => (
                <div key={record.studentId || index} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg text-sm">
                  <div>
                    <p className="font-bold text-slate-800">{record.studentName || record.studentId}</p>
                    {record.note && <p className="text-xs text-slate-400 italic">Ket: {record.note}</p>}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    record.status === 'hadir' ? 'bg-emerald-100 text-emerald-800' :
                    record.status === 'sakit' ? 'bg-amber-100 text-amber-800' :
                    record.status === 'izin' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setViewingSession(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
