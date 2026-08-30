import React, { useEffect, useState } from 'react';
import { BookOpen, Calendar, User, Eye, Printer, Filter, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { journalService } from '../../../services/journalService';
import { teacherService } from '../../../services/teacherService';
import { classService } from '../../../services/classService';
import { subjectService } from '../../../services/subjectService';
import { triggerPrint } from '../../../utils/exportUtils';
import type { Journal } from '../../../types/journal';
import type { Teacher } from '../../../types/teacher';
import type { ClassData, Subject } from '../../../types/academic';

export const JournalList: React.FC = () => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Detail / Print Modal
  const [activeJournal, setActiveJournal] = useState<Journal | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [jData, tData, cData, sData] = await Promise.all([
        journalService.getAll(),
        teacherService.getAll(),
        classService.getAll(),
        subjectService.getAll()
      ]);
      setJournals(jData);
      setTeachers(tData);
      setClasses(cData);
      setSubjects(sData);
    } catch (error) {
      console.error('Error loading journals:', error);
    } finally {
      setIsLoading(false);
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

  const filteredJournals = journals.filter(j => {
    if (selectedTeacher !== 'all' && j.teacherId !== selectedTeacher) return false;
    if (selectedClass !== 'all' && j.classId !== selectedClass) return false;
    if (selectedDate && j.date !== selectedDate) return false;
    if (selectedStatus !== 'all' && j.status !== selectedStatus) return false;
    return true;
  });

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
          <p className="text-slate-500 text-sm mt-1">Monitoring dan arsip jurnal mengajar guru MI Syuriyah Pebatan</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap gap-4 items-center">
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
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Status</option>
            <option value="Lengkap">Lengkap</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        <button
          onClick={() => { setSelectedTeacher('all'); setSelectedClass('all'); setSelectedDate(''); setSelectedStatus('all'); }}
          className="text-xs text-emerald-600 font-bold hover:underline ml-auto"
        >
          Reset Filter
        </button>
      </div>

      {/* Journal Table */}
      {isLoading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm font-medium">Memuat data jurnal mengajar...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Tanggal & Jam</th>
                  <th className="px-6 py-4">Guru</th>
                  <th className="px-6 py-4">Kelas & Mapel</th>
                  <th className="px-6 py-4">Materi Pembelajaran</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredJournals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      Tidak ada jurnal yang sesuai dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredJournals.map(j => (
                    <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{j.date}</div>
                        <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                          {j.day || 'Hari'} • Jam ke-{j.lessonHour}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{getTeacherName(j.teacherId)}</div>
                        <div className="text-xs text-slate-400">Kode: {j.teacherId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                            Kelas {j.classId}
                          </span>
                          <span className="font-bold text-slate-800">{getSubjectName(j.subjectId)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="font-medium text-slate-800 truncate">{j.material}</p>
                        <p className="text-xs text-slate-400 truncate">{j.activities}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          j.status === 'Lengkap' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {j.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => setActiveJournal(j)}>
                          <Eye className="w-3.5 h-3.5 mr-1" /> Buka
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

      {/* Journal View & Print Modal */}
      {activeJournal && (
        <Modal
          isOpen={!!activeJournal}
          onClose={() => setActiveJournal(null)}
          title="Jurnal Mengajar Guru"
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-slate-800 printable-journal space-y-6">
              {/* Header Madrasah */}
              <div className="text-center pb-4 border-b-2 border-slate-800">
                <h3 className="text-lg font-bold uppercase tracking-wider text-slate-900">MI SYURIYAH PEBATAN</h3>
                <p className="text-xs font-bold uppercase text-slate-600">JURNAL PELAKSANAAN PEMBELAJARAN GURU</p>
                <p className="text-[11px] text-slate-500">Tahun Pelajaran: {activeJournal.academicYear} • Semester: {activeJournal.semester}</p>
              </div>

              {/* Basic Info Table */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <p><strong className="text-slate-600">Guru Pengampu:</strong> {getTeacherName(activeJournal.teacherId)} ({activeJournal.teacherId})</p>
                  <p className="mt-1"><strong className="text-slate-600">Mata Pelajaran:</strong> {getSubjectName(activeJournal.subjectId)}</p>
                  <p className="mt-1"><strong className="text-slate-600">Kelas / Rombel:</strong> Kelas {activeJournal.classId}</p>
                </div>
                <div>
                  <p><strong className="text-slate-600">Hari / Tanggal:</strong> {activeJournal.day || 'Senin'}, {activeJournal.date}</p>
                  <p className="mt-1"><strong className="text-slate-600">Jam Pembelajaran:</strong> Jam ke-{activeJournal.lessonHour} ({activeJournal.duration || 40} Menit)</p>
                  <p className="mt-1"><strong className="text-slate-600">Status Jurnal:</strong> <span className="font-bold text-emerald-700">{activeJournal.status}</span></p>
                </div>
              </div>

              {/* Attendance Breakdown */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex justify-between items-center text-emerald-900">
                <span className="font-bold">Kehadiran Siswa:</span>
                <span>Total: <strong>{activeJournal.totalStudents ?? '-'}</strong></span>
                <span>Hadir: <strong>{activeJournal.present ?? '-'}</strong></span>
                <span>Sakit: <strong>{activeJournal.sick ?? '-'}</strong></span>
                <span>Izin: <strong>{activeJournal.permission ?? '-'}</strong></span>
                <span>Alpa: <strong>{activeJournal.absent ?? '-'}</strong></span>
              </div>

              {/* Pedagogical Sections */}
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">1. Materi Pokok / Topik Pembelajaran:</h4>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-800 whitespace-pre-wrap">
                    {activeJournal.material}
                  </div>
                </div>

                {activeJournal.objectives && (
                  <div>
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">2. Tujuan Pembelajaran (TP):</h4>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700 whitespace-pre-wrap">
                      {activeJournal.objectives}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {activeJournal.method && (
                    <div>
                      <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">3. Metode Pembelajaran:</h4>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700">
                        {activeJournal.method}
                      </div>
                    </div>
                  )}
                  {activeJournal.media && (
                    <div>
                      <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">4. Media & Sumber Belajar:</h4>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700">
                        {activeJournal.media}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">5. Kegiatan Pembelajaran (Apersepsi, Inti, Penutup):</h4>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700 whitespace-pre-wrap">
                    {activeJournal.activities}
                  </div>
                </div>

                {activeJournal.assessment && (
                  <div>
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">6. Penilaian / Asesmen:</h4>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700 whitespace-pre-wrap">
                      {activeJournal.assessment}
                    </div>
                  </div>
                )}

                {(activeJournal.reflection || activeJournal.followUp) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">7. Refleksi Guru:</h4>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700">
                        {activeJournal.reflection || '-'}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">8. Tindak Lanjut:</h4>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700">
                        {activeJournal.followUp || '-'}
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
                  <p>Pebatan, {activeJournal.date}</p>
                  <p className="font-bold">Guru Pengampu</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">{getTeacherName(activeJournal.teacherId)}</p>
                  <p className="text-[10px] text-slate-500">Kode: {activeJournal.teacherId}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" onClick={() => triggerPrint()}>
                <Printer className="w-4 h-4 mr-2" /> Cetak Jurnal (A4)
              </Button>
              <Button onClick={() => setActiveJournal(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
