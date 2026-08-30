import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Search,
  Filter,
  RefreshCw,
  Award,
  AlertCircle,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { reportService } from '../../../services/reportService';
import { classService } from '../../../services/classService';
import { settingsService } from '../../../services/settingsService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { ClassData, Semester, GeneralSettings } from '../../../types/academic';

export const AdminLegerView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [semester, setSemester] = useState<Semester>('Ganjil');
  const [schoolSettings, setSchoolSettings] = useState<GeneralSettings | null>(null);

  const [legerData, setLegerData] = useState<any>(null);
  const [showRank, setShowRank] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadLeger();
    }
  }, [selectedClassId, academicYear, semester]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const [allClasses, settings] = await Promise.all([
        classService.getAll(),
        settingsService.getGeneralSettings()
      ]);
      setClasses(allClasses);
      setSchoolSettings(settings);

      if (settings) {
        if (settings.academicYear) setAcademicYear(settings.academicYear);
        if (settings.semester) setSemester(settings.semester);
      }

      if (!selectedClassId && allClasses.length > 0) {
        setSelectedClassId(allClasses[0].id || '');
      }
    } catch (error) {
      console.error('Error loading classes for leger:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeger = async () => {
    if (!selectedClassId) return;
    try {
      setLoading(true);
      const data = await reportService.getLegerData(selectedClassId, academicYear, semester);
      setLegerData(data);
    } catch (error) {
      console.error('Error loading leger data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!legerData || !legerData.rows || legerData.rows.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    const currentClass = classes.find(c => c.id === selectedClassId);
    const className = currentClass?.name || 'Kelas';

    // Build worksheet data
    const excelRows = legerData.rows.map((r: any, idx: number) => {
      const rowObj: any = {
        No: idx + 1,
        NIS: r.nis,
        NISN: r.nisn,
        'Nama Siswa': r.name,
        L_P: r.gender
      };

      // Add scores for each subject
      legerData.subjects.forEach((sub: any) => {
        rowObj[sub.name] = r.scores[sub.id] || 0;
      });

      rowObj['Total Nilai'] = r.totalScore;
      rowObj['Rata-Rata'] = r.avgScore;
      if (showRank) {
        rowObj['Peringkat'] = r.rank;
      }
      rowObj['Sakit'] = r.attendance.sakit;
      rowObj['Izin'] = r.attendance.izin;
      rowObj['Alpa'] = r.attendance.alpa;
      rowObj['Status Rapor'] = r.status;

      return rowObj;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Leger ${className}`);

    const safeYear = academicYear.replace('/', '-');
    const filename = `Leger_Nilai_${className}_${safeYear}_${semester}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const filteredRows = (legerData?.rows || []).filter((r: any) =>
    (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.nis || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="no-print bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leger Nilai Kelas</h1>
          <p className="text-sm text-slate-500">
            Rekapitulasi nilai seluruh mata pelajaran, rata-rata kelas, dan kehadiran dalam format A4 landscape.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <select
              value={selectedClassId}
              onChange={e => {
                setSelectedClassId(e.target.value);
                setSearchParams({ classId: e.target.value });
              }}
              className="bg-transparent text-sm font-semibold text-slate-800 px-2 py-1 outline-none cursor-pointer"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name}
                </option>
              ))}
            </select>

            <span className="text-slate-300">|</span>

            <select
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-800 px-2 py-1 outline-none cursor-pointer"
            >
              <option value="2026/2027">2026/2027</option>
              <option value="2025/2026">2025/2026</option>
            </select>

            <span className="text-slate-300">|</span>

            <select
              value={semester}
              onChange={e => setSemester(e.target.value as Semester)}
              className="bg-transparent text-sm font-semibold text-slate-800 px-2 py-1 outline-none cursor-pointer"
            >
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>

          <button
            onClick={loadLeger}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Controls & Stats Summary */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari siswa di leger..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showRank}
              onChange={e => setShowRank(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            Tampilkan Kolom Peringkat (Opsional)
          </label>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] border border-emerald-300 rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            Export Excel (.xlsx)
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Cetak Leger (A4 Landscape)
          </button>
        </div>
      </div>

      {/* Class Statistics Badge */}
      {legerData?.stats && (
        <div className="no-print grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-semibold">Total Siswa</span>
            <div className="text-xl font-bold text-slate-800">{legerData.stats.totalStudents} Siswa</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-semibold">Rata-Rata Kelas</span>
            <div className="text-xl font-bold text-emerald-700">{legerData.stats.classAvg}</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-semibold">Nilai Tertinggi</span>
            <div className="text-xl font-bold text-blue-700">{legerData.stats.maxScore}</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-semibold">Nilai Terendah</span>
            <div className="text-xl font-bold text-amber-700">{legerData.stats.minScore}</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-semibold">Status Nilai</span>
            <div className="text-xs font-bold mt-1 text-slate-800">
              {legerData.stats.isFinal ? (
                <span className="text-emerald-700">🟢 Lengkap</span>
              ) : (
                <span className="text-amber-600">🟡 {legerData.stats.missingCount} Rapor Belum Lengkap</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printable Leger Table (Landscape style) */}
      <div
        ref={printRef}
        id="printable-leger"
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Printable Header */}
        <div className="text-center mb-4 pb-2 border-b-2 border-black">
          <h2 className="text-base font-bold uppercase tracking-wider font-serif">
            LEGER NILAI HASIL BELAJAR PESERTA DIDIK (RAPOR)
          </h2>
          <h3 className="text-sm font-bold uppercase font-serif">
            {schoolSettings?.schoolName || 'MI SYURIYAH PEBATAN'}
          </h3>
          <p className="text-xs text-slate-600 print:text-black font-sans mt-0.5">
            Kelas: <span className="font-bold">{currentClass?.name}</span> | Tahun Pelajaran:{' '}
            <span className="font-bold">{academicYear}</span> | Semester: <span className="font-bold">{semester}</span> | Wali Kelas:{' '}
            <span className="font-bold">{currentClass?.homeroomTeacherName || '-'}</span>
          </p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <table className="w-full border-collapse border border-black text-[10px] text-left">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200 font-bold text-center">
                <th rowSpan={2} className="border border-black p-1 w-7">No</th>
                <th rowSpan={2} className="border border-black p-1 w-16">NIS</th>
                <th rowSpan={2} className="border border-black p-1 min-w-[140px] text-left">Nama Siswa</th>
                <th rowSpan={2} className="border border-black p-1 w-6">L/P</th>

                {/* Dynamic Subject Headers */}
                {legerData?.subjects?.length > 0 && (
                  <th colSpan={legerData.subjects.length} className="border border-black p-1">
                    Mata Pelajaran
                  </th>
                )}

                <th rowSpan={2} className="border border-black p-1 w-12">Jumlah</th>
                <th rowSpan={2} className="border border-black p-1 w-12">Rata2</th>
                {showRank && <th rowSpan={2} className="border border-black p-1 w-8">Rank</th>}
                <th colSpan={3} className="border border-black p-1 w-20">Absensi</th>
              </tr>
              <tr className="bg-slate-50 print:bg-slate-100 font-bold text-center text-[9px]">
                {legerData?.subjects?.map((sub: any) => (
                  <th key={sub.id} className="border border-black p-1 w-10 truncate" title={sub.name}>
                    {sub.code || sub.name.slice(0, 4)}
                  </th>
                ))}
                <th className="border border-black p-0.5 w-6">S</th>
                <th className="border border-black p-0.5 w-6">I</th>
                <th className="border border-black p-0.5 w-6">A</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row: any, idx: number) => (
                <tr key={row.studentId} className="hover:bg-slate-50 print:hover:bg-transparent">
                  <td className="border border-black p-1 text-center font-medium">{idx + 1}</td>
                  <td className="border border-black p-1 text-center font-mono">{row.nis}</td>
                  <td className="border border-black p-1 font-semibold truncate">{row.name}</td>
                  <td className="border border-black p-1 text-center">{row.gender || 'L'}</td>

                  {/* Subject Scores */}
                  {legerData?.subjects?.map((sub: any) => {
                    const sc = row.scores[sub.id];
                    return (
                      <td
                        key={sub.id}
                        className={`border border-black p-1 text-center font-bold ${
                          sc && sc < sub.kktp ? 'text-red-600 print:text-black print:underline' : ''
                        }`}
                      >
                        {sc > 0 ? sc : '-'}
                      </td>
                    );
                  })}

                  <td className="border border-black p-1 text-center font-bold bg-slate-50 print:bg-transparent">
                    {row.totalScore > 0 ? row.totalScore : '-'}
                  </td>
                  <td className="border border-black p-1 text-center font-bold bg-slate-50 print:bg-transparent">
                    {row.avgScore > 0 ? row.avgScore : '-'}
                  </td>
                  {showRank && (
                    <td className="border border-black p-1 text-center font-bold text-emerald-800">
                      {row.rank}
                    </td>
                  )}
                  <td className="border border-black p-0.5 text-center">{row.attendance?.sakit || 0}</td>
                  <td className="border border-black p-0.5 text-center">{row.attendance?.izin || 0}</td>
                  <td className="border border-black p-0.5 text-center">{row.attendance?.alpa || 0}</td>
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={10 + (legerData?.subjects?.length || 0)} className="border border-black p-6 text-center italic text-slate-500">
                    Tidak ada data siswa untuk kelas ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Footer Tanda Tangan */}
        <div className="mt-8 pt-4 text-xs font-serif flex justify-between items-start print:flex">
          <div className="w-56 text-center">
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Madrasah</p>
            <div className="h-16 flex items-center justify-center">
              {/* Space stamp */}
            </div>
            <p className="font-bold underline uppercase">
              {schoolSettings?.principalName || "H. AHMAD SYAFI'I, S.Pd.I"}
            </p>
            <p className="text-[10px]">NIP. {schoolSettings?.principalNip || '197505122005011003'}</p>
          </div>

          <div className="w-56 text-center">
            <p>Pebatan, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold">Wali Kelas {currentClass?.name}</p>
            <div className="h-16 flex items-center justify-center">
              {/* Space signature */}
            </div>
            <p className="font-bold underline uppercase">
              {currentClass?.homeroomTeacherName || 'WALI KELAS'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
