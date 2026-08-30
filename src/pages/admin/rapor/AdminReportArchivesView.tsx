import React, { useState, useEffect } from 'react';
import {
  Archive,
  Search,
  Filter,
  Calendar,
  Eye,
  Printer,
  Download,
  BookOpen,
  User,
  History,
  RefreshCw
} from 'lucide-react';
import { reportService } from '../../../services/reportService';
import { classService } from '../../../services/classService';
import { studentService } from '../../../services/studentService';
import { settingsService } from '../../../services/settingsService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ReportPrintDocument } from '../../../components/report/ReportPrintDocument';
import type { Report, ReportArchive } from '../../../types/report';
import type { ClassData, GeneralSettings, Semester, Student } from '../../../types/academic';

export const AdminReportArchivesView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<GeneralSettings | null>(null);

  const [academicYear, setAcademicYear] = useState('all');
  const [semester, setSemester] = useState('all');
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [previewReport, setPreviewReport] = useState<Report | null>(null);

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    loadArchives();
  }, [academicYear, semester, selectedClassId, selectedStudentId]);

  const loadInitial = async () => {
    try {
      const [allClasses, allStudents, settings] = await Promise.all([
        classService.getAll(),
        studentService.getAll(),
        settingsService.getGeneralSettings()
      ]);
      setClasses(allClasses);
      setStudents(allStudents);
      setSchoolSettings(settings);
    } catch (error) {
      console.error('Error loading archives initial data:', error);
    }
  };

  const loadArchives = async () => {
    try {
      setLoading(true);
      const list = await reportService.getReports({
        classId: selectedClassId === 'all' ? undefined : selectedClassId,
        academicYear: academicYear === 'all' ? undefined : academicYear,
        semester: semester === 'all' ? undefined : (semester as Semester),
        studentId: selectedStudentId === 'all' ? undefined : selectedStudentId
      });
      setReports(list);
    } catch (error) {
      console.error('Error loading archives:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(r =>
    (r.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.studentNis || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.className || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (previewReport) {
    return (
      <ReportPrintDocument
        report={previewReport}
        schoolSettings={schoolSettings}
        onBack={() => setPreviewReport(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Arsip Rapor & Riwayat Akademik</h1>
          <p className="text-sm text-slate-500">
            Penelusuran dokumen hasil belajar peserta didik lintas semester dan tahun pelajaran secara permanen.
          </p>
        </div>

        <button
          onClick={loadArchives}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all self-start md:self-auto"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Bar Multi-Year */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-44">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tahun Pelajaran</label>
          <select
            value={academicYear}
            onChange={e => setAcademicYear(e.target.value)}
            className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2 bg-white text-slate-800 outline-none"
          >
            <option value="all">Semua Tahun Pelajaran</option>
            <option value="2026/2027">2026/2027</option>
            <option value="2025/2026">2025/2026</option>
            <option value="2024/2025">2024/2025</option>
          </select>
        </div>

        <div className="w-full sm:w-36">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Semester</label>
          <select
            value={semester}
            onChange={e => setSemester(e.target.value)}
            className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2 bg-white text-slate-800 outline-none"
          >
            <option value="all">Semua Semester</option>
            <option value="Ganjil">Semester Ganjil</option>
            <option value="Genap">Semester Genap</option>
          </select>
        </div>

        <div className="w-full sm:w-44">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kelas</label>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2 bg-white text-slate-800 outline-none"
          >
            <option value="all">Semua Kelas</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                Kelas {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pencarian Siswa</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ketik nama siswa atau NIS..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Archives Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-600">Dokumen Arsip Akademik</span>
          <span className="text-slate-500">{filteredReports.length} Dokumen Rapor Ditemukan</span>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4 w-10 text-center">No</th>
                  <th className="py-3 px-4">Nama Peserta Didik</th>
                  <th className="py-3 px-4">Tahun Pelajaran & Semester</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Nomor Rapor</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredReports.map((rep, idx) => (
                  <tr key={rep.id || idx} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 text-center text-slate-500 font-medium">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{rep.studentName}</div>
                      <div className="text-[11px] text-slate-400">NIS: {rep.studentNis}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{rep.academicYear}</span> —{' '}
                      <span className="text-slate-600">{rep.semester}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {rep.className}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {rep.reportNumber || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                        {rep.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setPreviewReport(rep)}
                        className="px-3 py-1.5 bg-[#064E3B] hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Buka & Cetak
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredReports.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                      Tidak ada dokumen arsip rapor yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
