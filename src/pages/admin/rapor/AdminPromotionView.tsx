import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Save,
  CheckSquare,
  RefreshCw,
  HelpCircle,
  Clock
} from 'lucide-react';
import { reportService } from '../../../services/reportService';
import { classService } from '../../../services/classService';
import { studentService } from '../../../services/studentService';
import { settingsService } from '../../../services/settingsService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useAuth } from '../../../hooks/useAuth';
import type { ClassData, Semester } from '../../../types/academic';
import type { Report, PromotionDecision } from '../../../types/report';

export const AdminPromotionView: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [semester, setSemester] = useState<Semester>('Genap');

  const [reports, setReports] = useState<Report[]>([]);
  const [decisions, setDecisions] = useState<
    Record<
      string,
      {
        decision: PromotionDecision;
        nextClassId: string;
        decisionNote: string;
      }
    >
  >({});
  const [isMigrating, setIsMigrating] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadClassReports();
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
      if (!selectedClassId && allClasses.length > 0) {
        setSelectedClassId(allClasses[0].id || '');
      }
      if (settings?.academicYear) setAcademicYear(settings.academicYear);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClassReports = async () => {
    if (!selectedClassId) return;
    try {
      setLoading(true);
      const list = await reportService.getReports({
        classId: selectedClassId,
        academicYear,
        semester
      });
      setReports(list);

      // Initialize decisions state
      const initialDecisions: Record<string, any> = {};
      list.forEach(r => {
        const studentId = r.studentId;
        const currentDec = r.promotionStatus?.decision;
        const recommendation = r.promotionStatus?.status;

        let defaultDecision: PromotionDecision = 'Naik ke Kelas';
        if (currentDec) {
          defaultDecision = currentDec as PromotionDecision;
        } else if (recommendation === 'Direkomendasikan mengulang') {
          defaultDecision = 'Tinggal di Kelas';
        }

        initialDecisions[studentId] = {
          decision: defaultDecision,
          nextClassId: r.promotionStatus?.nextClassId || targetClassId || '',
          decisionNote: r.promotionStatus?.decisionNote || ''
        };
      });
      setDecisions(initialDecisions);
    } catch (error) {
      console.error('Error loading reports for promotion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionChange = (studentId: string, field: string, value: any) => {
    setDecisions(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSaveDecisions = async () => {
    try {
      setLoading(true);
      const decisionList = reports.map(r => ({
        reportId: r.id,
        studentId: r.studentId,
        decision: decisions[r.studentId]?.decision || 'Naik ke Kelas',
        nextClassId: decisions[r.studentId]?.nextClassId || targetClassId,
        nextClassName: classes.find(c => c.id === (decisions[r.studentId]?.nextClassId || targetClassId))?.name || '',
        decisionNote: decisions[r.studentId]?.decisionNote || ''
      }));

      await reportService.finalizePromotionDecisions(decisionList, {
        uid: userProfile?.uid || 'admin',
        name: userProfile?.name || 'Administrator'
      });

      setSuccessMessage('Keputusan kenaikan kelas berhasil disimpan ke dalam rapor siswa.');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadClassReports();
    } catch (error) {
      console.error('Error saving decisions:', error);
      alert('Gagal menyimpan keputusan kenaikan kelas.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteMigration = async () => {
    try {
      setIsMigrating(true);
      const migrationPayload = reports.map(r => {
        const dec = decisions[r.studentId]?.decision || 'Naik ke Kelas';
        const targetId =
          dec === 'Tinggal di Kelas'
            ? selectedClassId
            : decisions[r.studentId]?.nextClassId || targetClassId;

        return {
          studentId: r.studentId,
          currentClassId: selectedClassId,
          targetClassId: targetId,
          decision: dec
        };
      });

      const res = await reportService.executeClassMigration(migrationPayload, {
        uid: userProfile?.uid || 'admin',
        name: userProfile?.name || 'Administrator'
      });

      setIsPreviewModalOpen(false);
      setSuccessMessage(`Migrasi kelas selesai. ${res.successCount} siswa berhasil dipindahkan ke kelas tujuan.`);
      setTimeout(() => setSuccessMessage(null), 5000);
      await loadClassReports();
    } catch (error: any) {
      console.error('Error migrating class:', error);
      alert(error.message || 'Gagal menjalankan migrasi kelas.');
    } finally {
      setIsMigrating(false);
    }
  };

  const currentClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kenaikan Kelas & Kelulusan</h1>
          <p className="text-sm text-slate-500">
            Penetapan keputusan kenaikan kelas berdasarkan rekomendasi wali kelas, rekap nilai akhir, dan kehadiran siswa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
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
              <option value="Genap">Semester Genap (Akhir Tahun)</option>
              <option value="Ganjil">Semester Ganjil</option>
            </select>
          </div>

          <button
            onClick={loadClassReports}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {/* Target Class Setup for Bulk Operation */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">Target Kelas Tujuan Default:</span>
            <select
              value={targetClassId}
              onChange={e => {
                setTargetClassId(e.target.value);
                // Apply to all currently designated "Naik ke Kelas"
                setDecisions(prev => {
                  const updated = { ...prev };
                  Object.keys(updated).forEach(k => {
                    if (updated[k].decision === 'Naik ke Kelas') {
                      updated[k].nextClassId = e.target.value;
                    }
                  });
                  return updated;
                });
              }}
              className="text-xs font-bold border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">-- Pilih Kelas Tujuan --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name} (Tingkat {c.level})
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Contoh: Seluruh siswa Kelas 5A yang naik kelas akan dipindahkan ke Kelas 6A saat migrasi tahun pelajaran baru.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDecisions}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Save className="w-4 h-4" />
            Simpan Keputusan Rapor
          </button>

          <button
            onClick={() => setIsPreviewModalOpen(true)}
            disabled={reports.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#064E3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
          >
            <TrendingUp className="w-4 h-4" />
            Proses Migrasi Kelas
          </button>
        </div>
      </div>

      {/* Promotion Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-600">
            Daftar Siswa Kelas {currentClass?.name} ({reports.length} Siswa)
          </span>
          <span className="text-slate-500">Wali Kelas: {currentClass?.homeroomTeacherName || '-'}</span>
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
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4 text-center">Rata2 Nilai</th>
                  <th className="py-3 px-4 text-center">Presensi (S/I/A)</th>
                  <th className="py-3 px-4">Rekomendasi Wali Kelas</th>
                  <th className="py-3 px-4">Keputusan Sekolah</th>
                  <th className="py-3 px-4">Kelas Tujuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reports.map((rep, idx) => {
                  const studentId = rep.studentId;
                  const currentDecision = decisions[studentId] || {
                    decision: 'Naik ke Kelas',
                    nextClassId: targetClassId,
                    decisionNote: ''
                  };

                  // calculate avg score
                  const scored = rep.subjects?.filter(s => s.finalScore > 0) || [];
                  const avg =
                    scored.length > 0
                      ? Math.round((scored.reduce((a, b) => a + b.finalScore, 0) / scored.length) * 10) / 10
                      : 0;

                  return (
                    <tr key={rep.id || idx} className="hover:bg-slate-50/60 transition-all">
                      <td className="py-3 px-4 text-center text-slate-500 font-medium">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{rep.studentName}</div>
                        <div className="text-[11px] text-slate-400">NIS: {rep.studentNis}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {avg > 0 ? avg : '-'}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">
                        {rep.attendance?.sakit || 0}/{rep.attendance?.izin || 0}/{rep.attendance?.alpa || 0}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            rep.promotionStatus?.status === 'Direkomendasikan naik'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rep.promotionStatus?.status === 'Direkomendasikan mengulang'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {rep.promotionStatus?.status || 'Belum ditentukan'}
                        </span>
                        {rep.promotionStatus?.recommendationNote && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">
                            "{rep.promotionStatus.recommendationNote}"
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={currentDecision.decision}
                          onChange={e =>
                            handleDecisionChange(studentId, 'decision', e.target.value as PromotionDecision)
                          }
                          className="text-xs font-semibold border border-slate-300 rounded-lg p-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                          <option value="Naik ke Kelas">Naik ke Kelas</option>
                          <option value="Tinggal di Kelas">Tinggal di Kelas</option>
                          <option value="Lulus">Lulus</option>
                          <option value="Tidak Lulus">Tidak Lulus</option>
                          <option value="Ditentukan sekolah">Ditentukan Sekolah</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        {currentDecision.decision === 'Naik ke Kelas' ? (
                          <select
                            value={currentDecision.nextClassId || targetClassId}
                            onChange={e => handleDecisionChange(studentId, 'nextClassId', e.target.value)}
                            className="text-xs border border-slate-300 rounded-lg p-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                          >
                            <option value="">Pilih Kelas</option>
                            {classes.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        ) : currentDecision.decision === 'Tinggal di Kelas' ? (
                          <span className="text-rose-700 font-bold text-xs">Tetap di {currentClass?.name}</span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {reports.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                      Belum ada draft rapor untuk kelas ini. Generate rapor terlebih dahulu di menu Dashboard Rapor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Migration Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[85vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Konfirmasi & Pratinjau Migrasi Kenaikan Kelas
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Sistem akan memindahkan data kelas aktif siswa tanpa menghapus nilai, absensi, jurnal, atau arsip lama.
            </p>

            <div className="space-y-3 text-xs mb-6">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                <div className="font-bold mb-1">Ringkasan Migrasi Kelas {currentClass?.name}:</div>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Total Siswa Diproses: {reports.length} siswa</li>
                  <li>
                    Naik Kelas:{' '}
                    {(Object.values(decisions) as any[]).filter(d => d.decision === 'Naik ke Kelas').length} siswa
                  </li>
                  <li>
                    Tinggal Kelas:{' '}
                    {(Object.values(decisions) as any[]).filter(d => d.decision === 'Tinggal di Kelas').length} siswa
                  </li>
                  <li>
                    Lulus / Lainnya:{' '}
                    {(Object.values(decisions) as any[]).filter(d => d.decision === 'Lulus' || d.decision === 'Tidak Lulus').length} siswa
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                <div className="font-semibold text-slate-900 mb-1">Jaminan Keamanan Riwayat Akademik:</div>
                <p className="text-[11px] leading-relaxed">
                  Seluruh rapor, nilai asesmen, presensi semester ini akan tetap tersimpan permanen dan dapat
                  diakses kapan saja melalui menu <strong>Arsip Rapor & Riwayat Akademik</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isMigrating}
                onClick={handleExecuteMigration}
                className="px-5 py-2 bg-[#064E3B] hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {isMigrating ? 'Memproses Migrasi...' : 'Konfirmasi & Jalankan Migrasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
