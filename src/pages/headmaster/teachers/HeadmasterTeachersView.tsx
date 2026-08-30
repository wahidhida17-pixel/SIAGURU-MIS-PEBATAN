import React, { useState, useEffect } from 'react';
import { checklistService, type TeacherAdminChecklist } from '../../../services/checklistService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Search, Filter, ChevronRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HeadmasterTeachersView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [checklists, setChecklists] = useState<TeacherAdminChecklist[]>([]);
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [academicYear, semester]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await checklistService.getTeachersChecklist(academicYear, semester);
      setChecklists(data);
    } catch (error) {
      console.error('Error loading teachers checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 90) return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">🟢 Lengkap</span>;
    if (percentage >= 50) return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">🟡 Sebagian</span>;
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">🔴 Belum</span>;
  };

  const getSimpleStatus = (statusText: string) => {
    if (statusText === 'Lengkap') return <span className="text-emerald-600 font-medium text-sm">Lengkap</span>;
    if (statusText === 'Sebagian') return <span className="text-amber-600 font-medium text-sm">Sebagian</span>;
    return <span className="text-red-600 font-medium text-sm">Belum</span>;
  };

  const filteredData = checklists.filter(c => c.teacherName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Monitoring Guru</h1>
          <p className="text-slate-500">Pantau progres administrasi, jurnal, dan penilaian guru.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
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
            onChange={(e) => setSemester(e.target.value as any)}
            className="text-sm border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama guru..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
            <Filter className="h-4 w-4" />
            Filter Role
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><LoadingSpinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Guru</th>
                  <th className="px-6 py-4 font-semibold">Administrasi</th>
                  <th className="px-6 py-4 font-semibold">Jurnal</th>
                  <th className="px-6 py-4 font-semibold">Nilai</th>
                  <th className="px-6 py-4 font-semibold text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredData.map((row) => (
                  <tr key={row.teacherId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{row.teacherName}</div>
                      <div className="text-xs text-slate-500 mt-1">{row.totalDocumentsCount} dokumen dikumpulkan</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(row.overallScorePercentage)}
                        <span className="text-xs text-slate-500">{Math.round(row.overallScorePercentage)}% Lengkap</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getSimpleStatus(row.jurnalStatus)}</td>
                    <td className="px-6 py-4">{getSimpleStatus(row.nilaiStatus)}</td>
                    <td className="px-6 py-4 text-center">
                      <Link 
                        to={`/headmaster/teachers/${row.teacherId}`}
                        className="inline-flex items-center justify-center p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Lihat Detail"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      Tidak ada data guru yang sesuai pencarian.
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
