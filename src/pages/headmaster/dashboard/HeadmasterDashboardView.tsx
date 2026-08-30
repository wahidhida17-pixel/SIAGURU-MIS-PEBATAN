import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { headmasterService, type HeadmasterStats } from '../../../services/headmasterService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { 
  Users, BookOpen, Activity, AlertTriangle, 
  CheckCircle, Clock, FileText, Calendar, PieChart
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const HeadmasterDashboardView: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<HeadmasterStats | null>(null);

  // Filters
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [semester, setSemester] = useState('Ganjil');

  useEffect(() => {
    loadStats();
  }, [academicYear, semester]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await headmasterService.getDashboardStats(academicYear, semester);
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
  if (!stats) return <div className="text-center py-10">Data tidak dapat dimuat. <button onClick={loadStats} className="text-emerald-600 underline">Coba Lagi</button></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Kepala Madrasah</h1>
          <p className="text-slate-500">Selamat datang, {userProfile?.displayName}</p>
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
            onChange={(e) => setSemester(e.target.value)}
            className="text-sm border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-600">Guru</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.totalTeachers}</p>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-600">Siswa</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.totalStudents}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-600">Kelas</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.totalClasses}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-600">Mata Pelajaran</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.totalSubjects}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Administrasi */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Kelengkapan Administrasi Guru
          </h2>
          
          <div className="flex items-center justify-between mb-8">
            <div className="text-4xl font-bold text-emerald-600">
              {stats.adminCompletion.percentage}%
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="flex items-center gap-1 text-sm font-medium text-slate-600 mb-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Lengkap
                </div>
                <p className="text-xl font-bold">{stats.adminCompletion.lengkap}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-sm font-medium text-slate-600 mb-1">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span> Sebagian
                </div>
                <p className="text-xl font-bold">{stats.adminCompletion.sebagian}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-sm font-medium text-slate-600 mb-1">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span> Belum
                </div>
                <p className="text-xl font-bold">{stats.adminCompletion.belum}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-600">Jurnal Mengajar</span>
                <span className="font-bold text-slate-800">{stats.journalCompletion.percentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.journalCompletion.percentage}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-600">Penilaian</span>
                <span className="font-bold text-slate-800">{stats.assessmentCompletion.percentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${stats.assessmentCompletion.percentage}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-600">Rapor</span>
                <span className="font-bold text-slate-800">{stats.reportCompletion.percentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${stats.reportCompletion.percentage}%` }}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Link to="/headmaster/teachers" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Lihat Monitoring Guru &rarr;
            </Link>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Perlu Perhatian
          </h2>
          
          <div className="flex-1 space-y-4">
            <Link to="/headmaster/teachers" className="block p-4 rounded-lg bg-red-50 hover:bg-red-100 transition-colors border border-red-100">
              <div className="flex items-start gap-3">
                <div className="mt-0.5"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                <div>
                  <p className="font-medium text-red-800">{stats.adminCompletion.belum} guru belum melengkapi administrasi dasar</p>
                  <p className="text-xs text-red-600 mt-1">Klik untuk melihat detail guru</p>
                </div>
              </div>
            </Link>

            <Link to="/headmaster/rapor" className="block p-4 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-100">
              <div className="flex items-start gap-3">
                <div className="mt-0.5"><Clock className="w-5 h-5 text-amber-500" /></div>
                <div>
                  <p className="font-medium text-amber-800">{stats.reportCompletion.total - stats.reportCompletion.completed} rapor belum lengkap</p>
                  <p className="text-xs text-amber-600 mt-1">Persiapan rapor akhir semester</p>
                </div>
              </div>
            </Link>
            
            <Link to="/headmaster/calendar" className="block p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="mt-0.5"><Calendar className="w-5 h-5 text-blue-500" /></div>
                <div>
                  <p className="font-medium text-blue-800">3 agenda minggu ini</p>
                  <p className="text-xs text-blue-600 mt-1">Lihat kalender madrasah</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
