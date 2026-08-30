import React, { useState } from 'react';
import { FileText, Download, Printer, Filter } from 'lucide-react';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

export const HeadmasterReportsView: React.FC = () => {
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [semester, setSemester] = useState('Ganjil');
  const [reportType, setReportType] = useState('administrasi');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = (type: 'pdf' | 'excel' | 'print') => {
    setIsExporting(true);
    // Simulate export
    setTimeout(() => {
      setIsExporting(false);
      alert(`Laporan ${reportType} berhasil di-export sebagai ${type.toUpperCase()}`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Laporan Madrasah</h1>
        <p className="text-slate-500">Unduh laporan akademik dan administrasi sekolah.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Filter:</span>
            </div>
            
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="text-sm border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
            </select>

            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="text-sm border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>

            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="text-sm border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 min-w-[200px]"
            >
              <option value="administrasi">Laporan Kelengkapan Administrasi</option>
              <option value="jurnal">Laporan Jurnal Mengajar</option>
              <option value="penilaian">Laporan Penilaian Siswa</option>
              <option value="rapor">Laporan Kesiapan Rapor</option>
              <option value="kehadiran">Laporan Kehadiran Siswa</option>
              <option value="kegiatan">Laporan Kegiatan/Agenda</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('excel')}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              {isExporting ? <LoadingSpinner size="sm" /> : <Download className="w-4 h-4" />}
              PDF
            </button>
            <button
              onClick={() => handleExport('print')}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>

        <div className="p-8 text-center min-h-[300px] flex items-center justify-center bg-slate-50/50">
          {isExporting ? (
            <div className="flex flex-col items-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-slate-500 font-medium">Menyiapkan dokumen...</p>
            </div>
          ) : (
            <div className="max-w-md">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Pratinjau Laporan Belum Tersedia</h3>
              <p className="text-slate-500 text-sm">
                Gunakan tombol export di atas untuk mengunduh laporan dalam format PDF atau Excel. Laporan mencakup data {reportType} untuk periode {semester} {academicYear}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
