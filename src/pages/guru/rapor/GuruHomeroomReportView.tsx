import React, { useState, useEffect } from 'react';
import {
  Award,
  Users,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  Printer,
  Edit3,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  X,
  FileText,
  Activity,
  Heart,
  TrendingUp,
  HelpCircle
} from 'lucide-react';
import { reportService } from '../../../services/reportService';
import { classService } from '../../../services/classService';
import { settingsService } from '../../../services/settingsService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ReportPrintDocument } from '../../../components/report/ReportPrintDocument';
import { useAuth } from '../../../hooks/useAuth';
import type { Report, ReportPeriod, PromotionRecommendation } from '../../../types/report';
import type { ClassData, GeneralSettings, Semester } from '../../../types/academic';

export const GuruHomeroomReportView: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myClass, setMyClass] = useState<ClassData | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [periods, setPeriods] = useState<ReportPeriod[]>([]);
  const [activePeriod, setActivePeriod] = useState<ReportPeriod | null>(null);
  const [schoolSettings, setSchoolSettings] = useState<GeneralSettings | null>(null);

  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [semester, setSemester] = useState<Semester>('Ganjil');

  // Editing student report drawer/modal
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [previewPrintReport, setPreviewPrintReport] = useState<Report | null>(null);

  // Form states for homeroom input (Ekstra, Prestasi, Catatan, Fisik, Rekomendasi Kenaikan)
  const [attendance, setAttendance] = useState({ sakit: 0, izin: 0, alpa: 0 });
  const [homeroomNote, setHomeroomNote] = useState('');
  const [extracurriculars, setExtracurriculars] = useState<{ name: string; score: string; description: string }[]>([]);
  const [achievements, setAchievements] = useState<{ type: string; name: string; description: string }[]>([]);
  const [physicalDevelopment, setPhysicalDevelopment] = useState({
    height: 0,
    weight: 0,
    hearing: 'Baik',
    vision: 'Baik',
    dental: 'Baik'
  });
  const [growthNotes, setGrowthNotes] = useState('');
  const [promotionRecommendation, setPromotionRecommendation] = useState<PromotionRecommendation>('Direkomendasikan naik');
  const [recommendationNote, setRecommendationNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadHomeroomData();
  }, [academicYear, semester]);

  const loadHomeroomData = async () => {
    try {
      setLoading(true);
      const [allClasses, allPeriods, settings] = await Promise.all([
        classService.getAll(),
        reportService.getPeriods(),
        settingsService.getGeneralSettings()
      ]);

      setPeriods(allPeriods);
      setSchoolSettings(settings);

      if (settings) {
        if (settings.academicYear) setAcademicYear(settings.academicYear);
        if (settings.semester) setSemester(settings.semester);
      }

      // Find class where current user is homeroom teacher
      const homeroomClass = allClasses.find(
        c => c.homeroomTeacherId === userProfile?.uid
      ) || allClasses[0]; // fallback for demo

      setMyClass(homeroomClass || null);

      const active = allPeriods.find(p => p.academicYear === academicYear && p.semester === semester);
      setActivePeriod(active || null);

      if (homeroomClass?.id) {
        const repList = await reportService.getReports({
          classId: homeroomClass.id,
          academicYear,
          semester
        });
        setReports(repList);
      }
    } catch (error) {
      console.error('Error loading homeroom report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (report: Report) => {
    setEditingReport(report);
    setAttendance({
      sakit: report.attendance?.sakit || 0,
      izin: report.attendance?.izin || 0,
      alpa: report.attendance?.alpa || 0
    });
    setHomeroomNote(report.homeroomNote || '');
    setExtracurriculars(
      (report.extracurriculars || []).map(e => ({
        name: e.activity || '',
        score: e.result || 'Baik',
        description: e.description || ''
      }))
    );
    setAchievements(
      (report.achievements || []).map(a => ({
        type: a.type || 'Akademik',
        name: a.name || '',
        description: a.description || ''
      }))
    );
    setPhysicalDevelopment({
      height: 0,
      weight: 0,
      hearing: 'Baik',
      vision: 'Baik',
      dental: 'Baik'
    });
    setGrowthNotes(report.studentGrowth?.generalGrowthNote || '');
    setPromotionRecommendation(report.promotionStatus?.status || 'Direkomendasikan naik');
    setRecommendationNote(report.promotionStatus?.recommendationNote || '');
  };

  const handleAddExtracurricular = () => {
    setExtracurriculars([...extracurriculars, { name: '', score: 'A', description: '' }]);
  };

  const handleRemoveExtracurricular = (index: number) => {
    setExtracurriculars(extracurriculars.filter((_, i) => i !== index));
  };

  const handleAddAchievement = () => {
    setAchievements([...achievements, { type: 'Akademik', name: '', description: '' }]);
  };

  const handleRemoveAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const handleSaveHomeroomInputs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport?.id) return;

    if (editingReport.isLocked) {
      alert('Rapor ini telah dikunci oleh Admin dan tidak dapat diedit secara langsung.');
      return;
    }

    try {
      setIsSaving(true);
      await reportService.updateHomeroomInputs(
        editingReport.id,
        {
          attendance,
          homeroomNote,
          extracurriculars,
          achievements,
          physicalDevelopment,
          growthNotes,
          promotionStatus: {
            status: promotionRecommendation,
            recommendationNote
          }
        },
        { uid: userProfile?.uid || 'guru', name: userProfile?.name || 'Wali Kelas' }
      );

      setActionSuccess(`Data rapor untuk ${editingReport.studentName} berhasil diperbarui.`);
      setTimeout(() => setActionSuccess(null), 4000);
      setEditingReport(null);
      await loadHomeroomData();
    } catch (error: any) {
      alert(error.message || 'Gagal menyimpan data rapor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoGenerateTemplates = () => {
    const templates = [
      'Alhamdulillah, ananda menunjukkan perkembangan yang sangat baik dalam memahami materi pelajaran dan berakhlak mulia. Pertahankan semangat belajarnya!',
      'Ananda memiliki potensi yang tinggi. Tingkatkan terus kedisiplinan dan keaktifan saat berdiskusi di kelas.',
      'Perkembangan hafalan dan ibadah ananda sangat membanggakan. Teruslah istiqomah dalam belajar dan berbuat baik.'
    ];
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    setHomeroomNote(randomTemplate);
  };

  if (previewPrintReport) {
    return (
      <ReportPrintDocument
        report={previewPrintReport}
        schoolSettings={schoolSettings}
        onBack={() => setPreviewPrintReport(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-[#064E3B]">
              Ruang Kerja Wali Kelas
            </span>
            {myClass && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Kelas: {myClass.name}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Rapor Siswa Kelas</h1>
          <p className="text-sm text-slate-500">
            Lengkapi catatan wali kelas, kegiatan ekstrakurikuler, prestasi, perkembangan fisik, dan rekomendasi kenaikan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
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
            onClick={loadHomeroomData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium">{actionSuccess}</p>
        </div>
      )}

      {/* Reports List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-600">
            Daftar Rapor Siswa Kelas {myClass?.name || ''} ({reports.length} Siswa)
          </span>
          <span className="text-slate-500">
            {reports.filter(r => r.status === 'Lengkap' || r.status === 'Dikunci').length} dari {reports.length} rapor lengkap
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4 w-10 text-center">No</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Nilai Mapel</th>
                <th className="py-3 px-4 text-center">Presensi</th>
                <th className="py-3 px-4">Catatan Wali Kelas</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reports.map((rep, idx) => {
                const totalMapel = rep.subjects?.length || 0;
                const scoredMapel = rep.subjects?.filter(s => s.finalScore > 0).length || 0;

                return (
                  <tr key={rep.id || idx} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 text-center text-slate-500 font-medium">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{rep.studentName}</div>
                      <div className="text-[11px] text-slate-400">NIS: {rep.studentNis}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">
                          {scoredMapel}/{totalMapel} Terisi
                        </span>
                        {scoredMapel === totalMapel ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700">
                      S: {rep.attendance?.sakit || 0} | I: {rep.attendance?.izin || 0} | A: {rep.attendance?.alpa || 0}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      {rep.homeroomNote ? (
                        <p className="text-slate-700 italic truncate">{rep.homeroomNote}</p>
                      ) : (
                        <span className="text-amber-600 font-medium italic">Belum diisi</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {rep.isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
                          <Lock className="w-3 h-3" /> Dikunci
                        </span>
                      ) : rep.status === 'Lengkap' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Lengkap
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3" /> Perlu Diperiksa
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(rep)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] border border-emerald-200 rounded-lg font-semibold inline-flex items-center gap-1 transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Input Catatan
                        </button>
                        <button
                          onClick={() => setPreviewPrintReport(rep)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-all"
                          title="Pratinjau / Cetak"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {reports.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    Belum ada data rapor untuk kelas ini. Hubungi Admin untuk melakukan generate draft rapor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal/Drawer Input Catatan & Ekstrakurikuler */}
      {editingReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingReport(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Input Catatan & Data Rapor Peserta Didik
              </h2>
              <p className="text-xs text-slate-500">
                {editingReport.studentName} ({editingReport.studentNis}) — Kelas {editingReport.className}
              </p>
            </div>

            <form onSubmit={handleSaveHomeroomInputs} className="space-y-6">
              {/* Presensi / Kehadiran */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  1. Rekap Ketidakhadiran (Hari)
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sakit (S)</label>
                    <input
                      type="number"
                      min={0}
                      value={attendance.sakit}
                      onChange={e => setAttendance({ ...attendance, sakit: parseInt(e.target.value) || 0 })}
                      className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Izin (I)</label>
                    <input
                      type="number"
                      min={0}
                      value={attendance.izin}
                      onChange={e => setAttendance({ ...attendance, izin: parseInt(e.target.value) || 0 })}
                      className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tanpa Keterangan / Alpa (A)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={attendance.alpa}
                      onChange={e => setAttendance({ ...attendance, alpa: parseInt(e.target.value) || 0 })}
                      className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Catatan Wali Kelas */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    2. Catatan Wali Kelas
                  </h3>
                  <button
                    type="button"
                    onClick={handleAutoGenerateTemplates}
                    className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline"
                  >
                    Gunakan Contoh Narasi
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={homeroomNote}
                  onChange={e => setHomeroomNote(e.target.value)}
                  placeholder="Tuliskan motivasi, perkembangan karakter, dan bimbingan untuk ananda..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
                  required
                />
              </div>

              {/* Ekstrakurikuler */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    3. Kegiatan Ekstrakurikuler
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddExtracurricular}
                    className="text-xs font-semibold text-emerald-800 flex items-center gap-1 hover:text-emerald-950"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Kegiatan
                  </button>
                </div>

                {extracurriculars.map((ekstra, idx) => (
                  <div key={idx} className="flex gap-2 items-start bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Nama Ekstrakurikuler (Contoh: Pramuka, Qiro'ah)"
                            value={ekstra.name}
                            onChange={e => {
                              const updated = [...extracurriculars];
                              updated[idx].name = e.target.value;
                              setExtracurriculars(updated);
                            }}
                            className="w-full text-xs border border-slate-300 rounded-lg p-1.5 font-semibold"
                            required
                          />
                        </div>
                        <div>
                          <select
                            value={ekstra.score}
                            onChange={e => {
                              const updated = [...extracurriculars];
                              updated[idx].score = e.target.value;
                              setExtracurriculars(updated);
                            }}
                            className="w-full text-xs border border-slate-300 rounded-lg p-1.5 font-bold"
                          >
                            <option value="Sangat Baik">Sangat Baik (A)</option>
                            <option value="Baik">Baik (B)</option>
                            <option value="Cukup">Cukup (C)</option>
                          </select>
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Keterangan capaian/keaktifan..."
                        value={ekstra.description}
                        onChange={e => {
                          const updated = [...extracurriculars];
                          updated[idx].description = e.target.value;
                          setExtracurriculars(updated);
                        }}
                        className="w-full text-[11px] border border-slate-300 rounded-lg p-1.5 text-slate-700"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExtracurricular(idx)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {extracurriculars.length === 0 && (
                  <p className="text-xs text-slate-500 italic">Belum ada kegiatan ekstrakurikuler yang ditambahkan.</p>
                )}
              </div>

              {/* Prestasi Siswa */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    4. Prestasi & Penghargaan
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddAchievement}
                    className="text-xs font-semibold text-emerald-800 flex items-center gap-1 hover:text-emerald-950"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Prestasi
                  </button>
                </div>

                {achievements.map((ach, idx) => (
                  <div key={idx} className="flex gap-2 items-start bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <select
                            value={ach.type}
                            onChange={e => {
                              const updated = [...achievements];
                              updated[idx].type = e.target.value;
                              setAchievements(updated);
                            }}
                            className="w-full text-xs border border-slate-300 rounded-lg p-1.5 font-semibold"
                          >
                            <option value="Akademik">Akademik</option>
                            <option value="Keagamaan">Keagamaan / MTQ</option>
                            <option value="Seni">Seni & Budaya</option>
                            <option value="Olahraga">Olahraga</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Nama Kejuaraan / Prestasi (Contoh: Juara 1 Tahfidz Juz 30)"
                            value={ach.name}
                            onChange={e => {
                              const updated = [...achievements];
                              updated[idx].name = e.target.value;
                              setAchievements(updated);
                            }}
                            className="w-full text-xs border border-slate-300 rounded-lg p-1.5 font-semibold"
                            required
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Tingkat / Keterangan (Contoh: Tingkat Kecamatan Jatibarang)"
                        value={ach.description}
                        onChange={e => {
                          const updated = [...achievements];
                          updated[idx].description = e.target.value;
                          setAchievements(updated);
                        }}
                        className="w-full text-[11px] border border-slate-300 rounded-lg p-1.5 text-slate-700"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAchievement(idx)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {achievements.length === 0 && (
                  <p className="text-xs text-slate-500 italic">Belum ada prestasi yang ditambahkan.</p>
                )}
              </div>

              {/* Perkembangan Fisik & Kesehatan */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  5. Perkembangan Fisik & Kesehatan
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Tinggi (cm)</label>
                    <input
                      type="number"
                      value={physicalDevelopment.height || ''}
                      onChange={e =>
                        setPhysicalDevelopment({
                          ...physicalDevelopment,
                          height: parseFloat(e.target.value) || 0
                        })
                      }
                      className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Berat (kg)</label>
                    <input
                      type="number"
                      value={physicalDevelopment.weight || ''}
                      onChange={e =>
                        setPhysicalDevelopment({
                          ...physicalDevelopment,
                          weight: parseFloat(e.target.value) || 0
                        })
                      }
                      className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Pendengaran</label>
                    <input
                      type="text"
                      value={physicalDevelopment.hearing}
                      onChange={e =>
                        setPhysicalDevelopment({ ...physicalDevelopment, hearing: e.target.value })
                      }
                      className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Penglihatan</label>
                    <input
                      type="text"
                      value={physicalDevelopment.vision}
                      onChange={e =>
                        setPhysicalDevelopment({ ...physicalDevelopment, vision: e.target.value })
                      }
                      className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Gigi</label>
                    <input
                      type="text"
                      value={physicalDevelopment.dental}
                      onChange={e =>
                        setPhysicalDevelopment({ ...physicalDevelopment, dental: e.target.value })
                      }
                      className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Rekomendasi Kenaikan Kelas */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  6. Rekomendasi Kenaikan Kelas (Wali Kelas)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Status Rekomendasi</label>
                    <select
                      value={promotionRecommendation}
                      onChange={e => setPromotionRecommendation(e.target.value as any)}
                      className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2 bg-white"
                    >
                      <option value="Direkomendasikan naik">Direkomendasikan Naik Kelas</option>
                      <option value="Direkomendasikan mengulang">Direkomendasikan Mengulang</option>
                      <option value="Lulus">Lulus (Tingkat 6)</option>
                      <option value="Perlu pendampingan khusus">Perlu Pendampingan Khusus</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Rekomendasi (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Catatan pendukung untuk rapat dewan guru..."
                      value={recommendationNote}
                      onChange={e => setRecommendationNote(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#064E3B] hover:bg-emerald-800 rounded-lg transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Data Rapor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
