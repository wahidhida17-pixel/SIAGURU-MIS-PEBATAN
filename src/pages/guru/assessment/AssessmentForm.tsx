import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Activity, ArrowLeft, Save, Calendar, BookOpen, 
  Award, CheckSquare, Square, AlertCircle, FileText 
} from 'lucide-react';
import { assessmentService, DEFAULT_ASSESSMENT_TYPES } from '../../../services/assessmentService';
import { learningService } from '../../../services/learningService';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { Assessment } from '../../../types/assessment';
import type { LearningObjective } from '../../../types/learning';

export const AssessmentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { teacherId, teacherName, subjects, classes, academicYear, semester, loading: assignLoading } = useTeacherAssignments();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [type, setType] = useState(DEFAULT_ASSESSMENT_TYPES[0]);
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [material, setMaterial] = useState('');
  const [weight, setWeight] = useState<number>(1);
  const [maxScore, setMaxScore] = useState<number>(100);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'active' | 'completed'>('active');

  // TP integration
  const [availableTps, setAvailableTps] = useState<LearningObjective[]>([]);
  const [selectedTpIds, setSelectedTpIds] = useState<string[]>([]);
  const [loadingTps, setLoadingTps] = useState(false);

  useEffect(() => {
    if (subjects.length > 0 && !subjectId) {
      setSubjectId(subjects[0].id);
    }
    if (classes.length > 0 && !classId) {
      setClassId(classes[0].id);
    }
  }, [subjects, classes]);

  // Load available TPs when subject/class change
  useEffect(() => {
    if (subjectId) {
      loadTps();
    }
  }, [subjectId, teacherId, academicYear, semester]);

  const loadTps = async () => {
    try {
      setLoadingTps(true);
      const tps = await learningService.getLearningObjectives({
        teacherId,
        subjectId,
        academicYear,
        semester
      });
      setAvailableTps(tps);
    } catch (err) {
      console.error('Failed to load TPs:', err);
    } finally {
      setLoadingTps(false);
    }
  };

  // Load existing assessment if editing
  useEffect(() => {
    if (isEditing && id) {
      loadExistingAssessment(id);
    }
  }, [id, isEditing]);

  const loadExistingAssessment = async (assessId: string) => {
    try {
      setLoading(true);
      const data = await assessmentService.getAssessmentById(assessId);
      if (!data) {
        setError('Data asesmen tidak ditemukan');
        return;
      }
      setTitle(data.title);
      setType(data.type);
      setSubjectId(data.subjectId);
      setClassId(data.classId);
      setDate(data.date);
      setMaterial(data.material || '');
      setWeight(data.weight || 1);
      setMaxScore(data.maxScore || 100);
      setDescription(data.description || '');
      setStatus(data.status as any || 'active');
      setSelectedTpIds(data.objectiveIds || []);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat asesmen');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTp = (tpId: string) => {
    setSelectedTpIds(prev => 
      prev.includes(tpId) ? prev.filter(i => i !== tpId) : [...prev, tpId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul asesmen wajib diisi.');
      return;
    }
    if (!subjectId || !classId) {
      setError('Mata pelajaran dan kelas wajib dipilih.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const selSubject = subjects.find(s => s.id === subjectId);
      const selClass = classes.find(c => c.id === classId);

      const objectiveCodes = availableTps
        .filter(t => selectedTpIds.includes(t.id || ''))
        .map(t => t.code);

      const payload: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        type,
        teacherId,
        teacherName,
        subjectId,
        subjectName: selSubject?.name || 'Mata Pelajaran',
        classId,
        className: selClass?.name || 'Kelas',
        objectiveIds: selectedTpIds,
        objectiveCodes,
        date,
        material: material.trim(),
        weight: Number(weight) || 1,
        maxScore: Number(maxScore) || 100,
        academicYear,
        semester,
        description: description.trim(),
        status
      };

      if (isEditing && id) {
        await assessmentService.updateAssessment(id, payload, { uid: teacherId, name: teacherName });
      } else {
        const newId = await assessmentService.createAssessment(payload, { uid: teacherId, name: teacherName });
        // Redirect directly to input grades for convenience
        navigate(`/guru/assessment/${newId}/grades`);
        return;
      }

      navigate('/guru/assessment/list');
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan data asesmen');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || assignLoading) {
    return (
      <div className="flex justify-center p-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/guru/assessment/list"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isEditing ? 'Edit Asesmen Pembelajaran' : 'Buat Asesmen Pembelajaran Baru'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              SIAGURU MI Syuriyah Pebatan &bull; TP {academicYear} ({semester})
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-6 p-6 sm:p-8">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <span>Informasi Asesmen</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Lengkapi rincian jenis asesmen, lingkup materi, serta kelas yang akan dinilai.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Judul Asesmen */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Nama / Judul Asesmen <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Formatif Bab 1 - Surah Al-Fatihah & Huruf Hijaiyyah"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Jenis Asesmen */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Jenis Asesmen <span className="text-rose-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {DEFAULT_ASSESSMENT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Tanggal Pelaksanaan */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tanggal Pelaksanaan <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Mata Pelajaran */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Mata Pelajaran <span className="text-rose-500">*</span>
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Kelas */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Kelas / Rombel <span className="text-rose-500">*</span>
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Lingkup Materi */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Lingkup Materi / Topik
            </label>
            <input
              type="text"
              placeholder="Contoh: Hukum Bacaan Nun Sukun dan Tanwin"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Bobot & Max Score */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Bobot Asesmen
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400">Pengali bobot nilai dalam perhitungan rekap</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Skor Maksimum (Skala)
            </label>
            <input
              type="number"
              min="10"
              max="100"
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400">Standar skala nilai adalah 100</p>
          </div>
        </div>

        {/* Tujuan Pembelajaran (TP) Terkait */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Tujuan Pembelajaran (TP) yang Dinilai</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pilih TP yang diukur dalam kegiatan asesmen ini untuk integrasi deskripsi capaian rapor.
              </p>
            </div>
            {availableTps.length > 0 && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                {selectedTpIds.length} / {availableTps.length} Terpilih
              </span>
            )}
          </div>

          {loadingTps ? (
            <div className="p-4 text-center text-xs text-slate-400">Memuat data TP...</div>
          ) : availableTps.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
              Belum ada Tujuan Pembelajaran (TP) yang dibuat di modul administrasi untuk mapel ini.
              Asesmen tetap dapat disimpan dan dikaitkan nanti.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
              {availableTps.map((tp) => {
                const isSelected = selectedTpIds.includes(tp.id || '');
                return (
                  <div
                    key={tp.id}
                    onClick={() => handleToggleTp(tp.id || '')}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected 
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium' 
                        : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="mt-0.5 text-emerald-700 shrink-0">
                      {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-300" />}
                    </div>
                    <div>
                      <span className="font-bold px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] mr-1.5 text-slate-700">
                        {tp.code}
                      </span>
                      <span>{tp.title}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Keterangan Tambahan */}
        <div className="pt-4 border-t border-slate-100 space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Catatan / Keterangan Asesmen
          </label>
          <textarea
            rows={2}
            placeholder="Petunjuk pengerjaan, rubrik penilaian singkat, atau catatan khusus guru..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
          <Link
            to="/guru/assessment/list"
            className="w-full sm:w-auto px-5 py-2.5 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl transition-colors text-center"
          >
            Batal
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat & Lanjut Input Nilai'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
