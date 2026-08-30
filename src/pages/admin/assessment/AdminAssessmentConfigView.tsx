import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Plus, Trash2, CheckCircle2, 
  AlertCircle, ShieldCheck, Scale, Sliders, Layers 
} from 'lucide-react';
import { assessmentService } from '../../../services/assessmentService';
import { useAuth } from '../../../hooks/useAuth';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { AssessmentConfig } from '../../../types/assessment';

export const AdminAssessmentConfigView: React.FC = () => {
  const { userProfile } = useAuth();

  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  const [scaleMin, setScaleMin] = useState<number>(0);
  const [scaleMax, setScaleMax] = useState<number>(100);
  const [rounding, setRounding] = useState<'0' | '1' | '2'>('1');
  const [passThreshold, setPassThreshold] = useState<number>(75);

  // Weights
  const [formatifWeight, setFormatifWeight] = useState<number>(40);
  const [sumatifMateriWeight, setSumatifMateriWeight] = useState<number>(30);
  const [sumatifAkhirWeight, setSumatifAkhirWeight] = useState<number>(30);

  // Types
  const [assessmentTypes, setAssessmentTypes] = useState<string[]>([
    'Formatif (Tugas/Harian)',
    'Sumatif Lingkup Materi',
    'Sumatif Tengah Semester (STS)',
    'Sumatif Akhir Semester (SAS)',
    'Unjuk Kerja / Praktik',
    'Proyek P5 / PPRA',
    'Tes Lisan / Hafalan',
    'Portofolio'
  ]);
  const [newTypeName, setNewTypeName] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, [academicYear, semester]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const conf = await assessmentService.getAssessmentConfig(academicYear, semester);
      if (conf) {
        setScaleMin(conf.scaleMin ?? 0);
        setScaleMax(conf.scaleMax ?? 100);
        setRounding(conf.rounding ?? '1');
        setPassThreshold(conf.passThreshold ?? 75);
        if (conf.weightCategories) {
          setFormatifWeight(conf.weightCategories.formatif ?? 40);
          setSumatifMateriWeight(conf.weightCategories.sumatifMateri ?? 30);
          setSumatifAkhirWeight(conf.weightCategories.sumatifAkhir ?? 30);
        }
        if (conf.activeAssessmentTypes && conf.activeAssessmentTypes.length > 0) {
          setAssessmentTypes(conf.activeAssessmentTypes);
        }
      }
    } catch (err) {
      console.error('Error loading config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddType = () => {
    if (!newTypeName.trim()) return;
    if (assessmentTypes.includes(newTypeName.trim())) {
      alert('Jenis asesmen ini sudah ada.');
      return;
    }
    setAssessmentTypes(prev => [...prev, newTypeName.trim()]);
    setNewTypeName('');
  };

  const handleRemoveType = (typeToRemove: string) => {
    if (assessmentTypes.length <= 1) {
      alert('Minimal harus ada 1 jenis asesmen.');
      return;
    }
    setAssessmentTypes(prev => prev.filter(t => t !== typeToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalWeight = formatifWeight + sumatifMateriWeight + sumatifAkhirWeight;
    if (totalWeight !== 100) {
      alert(`Total pembobotan harus sama dengan 100%. Saat ini total = ${totalWeight}%`);
      return;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      const payload: AssessmentConfig = {
        academicYear,
        semester,
        scaleMin,
        scaleMax,
        rounding,
        passThreshold,
        weightCategories: {
          formatif: formatifWeight,
          sumatifMateri: sumatifMateriWeight,
          sumatifAkhir: sumatifAkhirWeight
        },
        activeAssessmentTypes: assessmentTypes
      };

      await assessmentService.saveAssessmentConfig(payload, {
        uid: userProfile?.uid || 'admin',
        name: userProfile?.displayName || 'Administrator'
      });

      setStatusMessage('Konfigurasi penilaian madrasah berhasil disimpan.');
    } catch (err: any) {
      alert('Gagal menyimpan konfigurasi: ' + (err?.message || 'Error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            <span>Konfigurasi Penilaian Madrasah</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengaturan standar pembobotan, skala penilaian, dan jenis asesmen &bull; MI Syuriyah Pebatan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
          >
            <option value="2026/2027">2026/2027</option>
            <option value="2025/2026">2025/2026</option>
          </select>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
          >
            <option value="Ganjil">Semester Ganjil</option>
            <option value="Genap">Semester Genap</option>
          </select>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-16">
          <LoadingSpinner />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Skala & Pembulatan */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>1. Skala Nilai & Aturan Pembulatan</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Skala Nilai Minimum</label>
                <input
                  type="number"
                  value={scaleMin}
                  onChange={(e) => setScaleMin(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Skala Nilai Maksimum</label>
                <input
                  type="number"
                  value={scaleMax}
                  onChange={(e) => setScaleMax(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Presisi Pembulatan Rapor</label>
                <select
                  value={rounding}
                  onChange={(e) => setRounding(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="0">0 Desimal (Bulat, cth: 85)</option>
                  <option value="1">1 Desimal (cth: 84.6)</option>
                  <option value="2">2 Desimal (cth: 84.62)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Pembobotan Komponen Nilai Rapor */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>2. Pembobotan Komponen Nilai Rapor Akhir</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bobot Formatif / Tugas (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formatifWeight}
                  onChange={(e) => setFormatifWeight(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bobot Sumatif Lingkup Materi (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={sumatifMateriWeight}
                  onChange={(e) => setSumatifMateriWeight(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bobot Sumatif Akhir Semester (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={sumatifAkhirWeight}
                  onChange={(e) => setSumatifAkhirWeight(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between ${
              formatifWeight + sumatifMateriWeight + sumatifAkhirWeight === 100 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <span>Total Persentase Bobot:</span>
              <span>{formatifWeight + sumatifMateriWeight + sumatifAkhirWeight} % (Harus Tepat 100%)</span>
            </div>
          </div>

          {/* Section 3: Jenis Asesmen yang Diizinkan */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>3. Daftar Jenis Asesmen Aktif</span>
            </h2>

            <div className="space-y-2">
              {assessmentTypes.map((type, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium">
                  <span className="font-bold text-slate-800">{type}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveType(type)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Type */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Tambah jenis asesmen baru (cth: Ujian Praktik Ibadah)..."
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddType}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan Konfigurasi...' : 'Simpan Seluruh Konfigurasi'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
