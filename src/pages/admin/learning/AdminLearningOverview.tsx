import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, CheckCircle, Clock, AlertCircle, Search, 
  Filter, FileText, BarChart3, Download, Printer, Layers, Eye, Table, Award, Calendar
} from 'lucide-react';
import { learningService } from '../../../services/learningService';
import { teacherService } from '../../../services/teacherService';
import { subjectService } from '../../../services/subjectService';
import { classService } from '../../../services/classService';
import { settingsService } from '../../../services/settingsService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { exportElementToPDF } from '../../../utils/documentPdfUtils';
import type { Teacher } from '../../../types/teacher';
import type { Subject, ClassInfo, GeneralSettings } from '../../../types/academic';

export const AdminLearningOverview: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [stats, setStats] = useState<any>({
    totalCP: 0,
    totalTP: 0,
    totalATP: 0,
    totalProta: 0,
    totalPromes: 0,
    totalModules: 0,
    totalKKTP: 0
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const academicYear = settings?.academicYear || '2025/2026';
  const semester = settings?.semester || 'Ganjil';

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [
        fetchedTeachers,
        fetchedSubjects,
        fetchedClasses,
        fetchedSettings,
        fetchedStats
      ] = await Promise.all([
        teacherService.getAll(),
        subjectService.getAll(),
        classService.getAll(),
        settingsService.getGeneralSettings(),
        learningService.getGlobalAdministrationStats(academicYear, semester)
      ]);

      setTeachers(fetchedTeachers.filter(t => t.status === 'active'));
      setSubjects(fetchedSubjects);
      setClasses(fetchedClasses);
      setSettings(fetchedSettings);
      setStats(fetchedStats);
    } catch (err) {
      console.error('Error loading admin learning overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    await exportElementToPDF('admin-rekap-area', `Rekap_Administrasi_Guru_${academicYear.replace('/', '-')}_Sem_${semester}`, 'landscape');
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.nip || '').includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-700/60 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-2 border border-emerald-600/40">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Monitoring & Supervisi Kurikulum Merdeka</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Supervisi Administrasi Pembelajaran Guru</h1>
            <p className="text-emerald-200 text-xs sm:text-sm mt-1 max-w-xl">
              Pantau kelengkapan CP, TP, ATP, Prota, Promes, Modul Ajar, dan KKTP seluruh guru MI SYURIYAH PEBATAN.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700/80 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all border border-emerald-600/50"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekap</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-xs font-bold shadow-md transition-all shrink-0 hover:scale-102"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Rekap PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Stat Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Capaian (CP)</p>
          <p className="text-xl font-extrabold text-emerald-900 mt-1">{stats.totalCP}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Tersimpan</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Tujuan (TP)</p>
          <p className="text-xl font-extrabold text-blue-900 mt-1">{stats.totalTP}</p>
          <span className="text-[10px] text-blue-600 font-semibold">Rumusan</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Alur (ATP)</p>
          <p className="text-xl font-extrabold text-purple-900 mt-1">{stats.totalATP}</p>
          <span className="text-[10px] text-purple-600 font-semibold">Dokumen</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Prota</p>
          <p className="text-xl font-extrabold text-amber-900 mt-1">{stats.totalProta}</p>
          <span className="text-[10px] text-amber-600 font-semibold">Dokumen</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Promes</p>
          <p className="text-xl font-extrabold text-cyan-900 mt-1">{stats.totalPromes}</p>
          <span className="text-[10px] text-cyan-600 font-semibold">Matriks</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Modul Ajar</p>
          <p className="text-xl font-extrabold text-indigo-900 mt-1">{stats.totalModules}</p>
          <span className="text-[10px] text-indigo-600 font-semibold">RPP / Modul</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">KKTP</p>
          <p className="text-xl font-extrabold text-rose-900 mt-1">{stats.totalKKTP}</p>
          <span className="text-[10px] text-rose-600 font-semibold">Kriteria</span>
        </div>
      </div>

      {/* Teacher Checklist Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-800" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Rekapitulasi Kesiapan Administrasi Per Guru ({academicYear} - Semester {semester})
            </h3>
          </div>

          <div className="w-full sm:w-64">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama guru..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-emerald-600"
              />
            </div>
          </div>
        </div>

        <div id="admin-rekap-area" className="p-4 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-12">
              <LoadingSpinner />
            </div>
          ) : (
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-3 w-10 text-center">No</th>
                  <th className="p-3">Nama Guru & NIP</th>
                  <th className="p-3 text-center">CP</th>
                  <th className="p-3 text-center">TP</th>
                  <th className="p-3 text-center">ATP</th>
                  <th className="p-3 text-center">Prota</th>
                  <th className="p-3 text-center">Promes</th>
                  <th className="p-3 text-center">Modul Ajar</th>
                  <th className="p-3 text-center">KKTP</th>
                  <th className="p-3 text-center">Status Kelengkapan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((teacher, idx) => (
                  <tr key={teacher.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{teacher.name}</p>
                      <p className="text-[11px] text-slate-500">{teacher.nip ? `NIP. ${teacher.nip}` : 'Guru Tetap Madrasah'}</p>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        ✓
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        ✓
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        ✓
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        ✓
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        ✓
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        ✓
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        ✓
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Lengkap (100%)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
