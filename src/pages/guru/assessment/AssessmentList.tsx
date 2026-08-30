import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Activity, Plus, Search, Filter, BookOpen, Calendar, 
  Trash2, Edit, CheckCircle2, Clock, Lock, Unlock, 
  ArrowRight, FileSpreadsheet, Eye, ChevronRight
} from 'lucide-react';
import { assessmentService, DEFAULT_ASSESSMENT_TYPES } from '../../../services/assessmentService';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { Assessment, Grade } from '../../../types/assessment';

export const AssessmentList: React.FC = () => {
  const navigate = useNavigate();
  const { teacherId, teacherName, subjects, classes, academicYear, semester, loading: assignLoading } = useTeacherAssignments();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadAssessments();
  }, [teacherId, academicYear, semester]);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const data = await assessmentService.getAssessments({
        teacherId,
        academicYear,
        semester
      });
      setAssessments(data);
    } catch (err) {
      console.error('Failed to load assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus asesmen "${title}" beserta seluruh nilai siswa di dalamnya?`)) {
      try {
        await assessmentService.deleteAssessment(id, { uid: teacherId, name: teacherName });
        setAssessments(prev => prev.filter(a => a.id !== id));
      } catch (err: any) {
        alert('Gagal menghapus asesmen: ' + (err?.message || 'Error'));
      }
    }
  };

  const handleToggleLock = async (item: Assessment) => {
    const newLockState = !item.isLocked;
    const confirmMsg = newLockState
      ? `Kunci asesmen "${item.title}"? Nilai tidak dapat diubah lagi sampai dibuka kembali.`
      : `Buka kunci asesmen "${item.title}"?`;

    if (window.confirm(confirmMsg)) {
      try {
        await assessmentService.toggleLockAssessment(item.id!, newLockState, { uid: teacherId, name: teacherName });
        setAssessments(prev => prev.map(a => a.id === item.id ? { ...a, isLocked: newLockState } : a));
      } catch (err: any) {
        alert('Gagal mengubah status kunci: ' + (err?.message || 'Error'));
      }
    }
  };

  const filteredAssessments = assessments.filter(item => {
    if (selectedSubject !== 'all' && item.subjectId !== selectedSubject) return false;
    if (selectedClass !== 'all' && item.classId !== selectedClass) return false;
    if (selectedType !== 'all' && item.type !== selectedType) return false;
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchMaterial = (item.material || '').toLowerCase().includes(q);
      const matchMapel = (item.subjectName || '').toLowerCase().includes(q);
      const matchKelas = (item.className || '').toLowerCase().includes(q);
      if (!matchTitle && !matchMaterial && !matchMapel && !matchKelas) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Asesmen Saya</h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar tugas harian, penilaian formatif, sumatif, PTS, dan PAS &bull; TP {academicYear} ({semester})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/guru/assessment/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Asesmen Baru</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari judul, materi, mapel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Filter Mapel */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Mata Pelajaran</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Kelas */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Jenis Asesmen */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Jenis Asesmen</option>
              {DEFAULT_ASSESSMENT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assessment Cards List */}
      {loading || assignLoading ? (
        <div className="flex justify-center p-16">
          <LoadingSpinner />
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Activity className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak ada asesmen ditemukan</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery || selectedSubject !== 'all' || selectedClass !== 'all'
              ? 'Tidak ada asesmen yang cocok dengan kriteria filter saat ini.'
              : 'Anda belum membuat asesmen untuk semester ini. Buat asesmen untuk mulai menilai siswa.'}
          </p>
          <Link
            to="/guru/assessment/create"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Asesmen Baru</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssessments.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border ${item.isLocked ? 'border-amber-200 bg-amber-50/10' : 'border-slate-200'} shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden`}
            >
              <div className="p-5 space-y-3">
                {/* Badge Top */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {item.type}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {item.isLocked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <Lock className="w-3 h-3" /> Terkunci
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        <Unlock className="w-3 h-3" /> Terbuka
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-700 mt-1">
                    {item.subjectName || 'Mapel'} &bull; {item.className || 'Kelas'}
                  </p>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <p className="line-clamp-1">
                    <strong className="text-slate-700">Materi:</strong> {item.material || '-'}
                  </p>
                  <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60 text-[11px]">
                    <span>Tgl: {item.date || '-'}</span>
                    <span>Bobot: {item.weight || 1} &bull; Max: {item.maxScore || 100}</span>
                  </div>
                </div>

                {item.objectiveCodes && item.objectiveCodes.length > 0 && (
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">TP:</span>
                    {item.objectiveCodes.map((code, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">
                        {code}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleLock(item)}
                    title={item.isLocked ? "Buka Kunci Nilai" : "Kunci Nilai"}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {item.isLocked ? <Lock className="w-4 h-4 text-amber-600" /> : <Unlock className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => navigate(`/guru/assessment/edit/${item.id}`)}
                    title="Edit Asesmen"
                    disabled={item.isLocked}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id!, item.title)}
                    title="Hapus Asesmen"
                    disabled={item.isLocked}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <Link
                  to={`/guru/assessment/${item.id}/grades`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  <span>Input Nilai</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
