import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Save, Download, Upload, CheckCircle2, 
  AlertCircle, Lock, Unlock, Users, FileSpreadsheet, 
  Copy, RefreshCw, Check, Sparkles, ChevronDown, Award
} from 'lucide-react';
import { assessmentService } from '../../../services/assessmentService';
import { studentService } from '../../../services/studentService';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';
import { excelAssessmentUtils, type ExcelImportSummary } from '../../../utils/excelAssessmentUtils';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { Assessment, Grade } from '../../../types/assessment';
import type { Student } from '../../../types/academic';

interface StudentGradeRow {
  student: Student;
  score: string; // string for smooth input handling
  note: string;
  isModified: boolean;
  isValid: boolean;
}

export const GradeInputView: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { teacherId, teacherName, academicYear, semester } = useTeacherAssignments();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [rows, setRows] = useState<StudentGradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Bulk / Fast Fill Modal
  const [isBulkFillOpen, setIsBulkFillOpen] = useState(false);
  const [bulkScore, setBulkScore] = useState<string>('80');
  const [bulkFillTarget, setBulkFillTarget] = useState<'empty_only' | 'all'>('empty_only');

  // Excel Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSummary, setImportSummary] = useState<ExcelImportSummary | null>(null);
  const [importingFile, setImportingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Input refs for Enter auto-focus next
  const inputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (assessmentId) {
      loadData(assessmentId);
    }
  }, [assessmentId]);

  const loadData = async (assessId: string) => {
    try {
      setLoading(true);
      const [assessData, existingGrades] = await Promise.all([
        assessmentService.getAssessmentById(assessId),
        assessmentService.getGradesByAssessment(assessId)
      ]);

      if (!assessData) {
        setErrorMessage('Asesmen tidak ditemukan');
        return;
      }
      setAssessment(assessData);

      // Load students in that class
      const classStudents = await studentService.getByClass(assessData.classId);
      setStudents(classStudents);

      // Build row states
      const initialRows: StudentGradeRow[] = classStudents.map((st) => {
        const foundGrade = existingGrades.find(g => g.studentId === st.id);
        const scoreVal = foundGrade && foundGrade.score !== undefined && foundGrade.score !== null
          ? String(foundGrade.score)
          : '';
        return {
          student: st,
          score: scoreVal,
          note: foundGrade?.note || '',
          isModified: false,
          isValid: true
        };
      });

      setRows(initialRows);
      setSaveStatus('saved');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal memuat data nilai');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (index: number, val: string) => {
    if (assessment?.isLocked) return;

    setRows(prev => {
      const next = [...prev];
      const num = Number(val);
      const isValid = val === '' || (!isNaN(num) && num >= 0 && num <= (assessment?.maxScore || 100));

      next[index] = {
        ...next[index],
        score: val,
        isModified: true,
        isValid
      };
      return next;
    });

    setSaveStatus('idle');
  };

  const handleNoteChange = (index: number, val: string) => {
    if (assessment?.isLocked) return;

    setRows(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        note: val,
        isModified: true
      };
      return next;
    });

    setSaveStatus('idle');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = currentIndex + 1;
      if (inputRefs.current[nextIdx]) {
        inputRefs.current[nextIdx]?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = currentIndex - 1;
      if (inputRefs.current[prevIdx]) {
        inputRefs.current[prevIdx]?.focus();
      }
    }
  };

  const handleSaveGrades = async () => {
    if (!assessment || assessment.isLocked) return;

    try {
      setSaving(true);
      setSaveStatus('saving');

      const gradesToSave: Array<Omit<Grade, 'id' | 'createdAt' | 'updatedAt'>> = [];

      for (const row of rows) {
        if (row.score.trim() !== '') {
          const numScore = Number(row.score);
          if (!isNaN(numScore)) {
            gradesToSave.push({
              assessmentId: assessment.id!,
              studentId: row.student.id!,
              studentNis: row.student.nis || '',
              studentName: row.student.name,
              teacherId,
              subjectId: assessment.subjectId,
              classId: assessment.classId,
              score: Math.min(assessment.maxScore || 100, Math.max(0, numScore)),
              note: row.note.trim(),
              academicYear: assessment.academicYear,
              semester: assessment.semester,
              isLocked: assessment.isLocked || false
            });
          }
        }
      }

      await assessmentService.saveGradesBatch(gradesToSave, { uid: teacherId, name: teacherName });

      // Mark rows as unmodified
      setRows(prev => prev.map(r => ({ ...r, isModified: false })));
      setSaveStatus('saved');
    } catch (err: any) {
      console.error('Error saving grades:', err);
      setSaveStatus('error');
      alert('Gagal menyimpan nilai: ' + (err?.message || 'Error'));
    } finally {
      setSaving(false);
    }
  };

  // Bulk fill handler
  const handleApplyBulkFill = () => {
    if (assessment?.isLocked) return;
    const num = Number(bulkScore);
    if (isNaN(num) || num < 0 || num > (assessment?.maxScore || 100)) {
      alert(`Nilai harus antara 0 dan ${assessment?.maxScore || 100}`);
      return;
    }

    setRows(prev =>
      prev.map(row => {
        if (bulkFillTarget === 'empty_only' && row.score !== '') {
          return row;
        }
        return {
          ...row,
          score: String(num),
          isModified: true,
          isValid: true
        };
      })
    );

    setIsBulkFillOpen(false);
    setSaveStatus('idle');
  };

  // Download template
  const handleDownloadTemplate = () => {
    if (!assessment) return;
    excelAssessmentUtils.downloadGradingTemplate(assessment, students);
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !assessment) return;

    try {
      setImportingFile(true);
      const summary = await excelAssessmentUtils.parseAndValidateExcel(file, students);
      setImportSummary(summary);
    } catch (err: any) {
      alert('Error membaca file Excel: ' + (err?.message || ''));
    } finally {
      setImportingFile(false);
    }
  };

  const handleApplyImport = async () => {
    if (!importSummary || !assessment) return;

    const updatedRows = [...rows];

    importSummary.rows.forEach(importedRow => {
      if (importedRow.isValid && importedRow.studentId) {
        const targetIdx = updatedRows.findIndex(r => r.student.id === importedRow.studentId);
        if (targetIdx !== -1) {
          updatedRows[targetIdx] = {
            ...updatedRows[targetIdx],
            score: importedRow.score > 0 ? String(importedRow.score) : '',
            note: importedRow.note || updatedRows[targetIdx].note,
            isModified: true,
            isValid: true
          };
        }
      }
    });

    setRows(updatedRows);
    setIsImportModalOpen(false);
    setImportSummary(null);
    setSaveStatus('idle');

    // Auto save imported grades
    setTimeout(() => {
      handleSaveGrades();
    }, 200);
  };

  // Stats calculation
  const enteredCount = rows.filter(r => r.score.trim() !== '' && !isNaN(Number(r.score))).length;
  const totalCount = rows.length;
  const progressPct = totalCount > 0 ? Math.round((enteredCount / totalCount) * 100) : 0;

  const validScores = rows
    .map(r => Number(r.score))
    .filter(n => !isNaN(n) && n > 0);

  const averageScore = validScores.length > 0 
    ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
    : '0';
  const highestScore = validScores.length > 0 ? Math.max(...validScores) : 0;
  const lowestScore = validScores.length > 0 ? Math.min(...validScores) : 0;

  if (loading) {
    return (
      <div className="flex justify-center p-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="font-bold text-slate-800">Asesmen Tidak Ditemukan</h3>
        <Link to="/guru/assessment/list" className="mt-4 inline-block text-xs font-bold text-emerald-700 underline">
          Kembali ke Daftar Asesmen
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Info Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link
              to="/guru/assessment/list"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shrink-0 mt-0.5"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {assessment.type}
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  {assessment.subjectName} &bull; {assessment.className}
                </span>
                {assessment.isLocked && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <Lock className="w-3 h-3" /> Nilai Terkunci
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {assessment.title}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Materi: <span className="font-medium text-slate-700">{assessment.material || '-'}</span> &bull; Tgl: {assessment.date} &bull; Bobot: {assessment.weight}
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Format Excel</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              disabled={assessment.isLocked}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-40"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Import Excel</span>
            </button>

            <button
              onClick={() => setIsBulkFillOpen(true)}
              disabled={assessment.isLocked}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl transition-colors disabled:opacity-40"
            >
              <Copy className="w-4 h-4 text-amber-700" />
              <span>Isi Cepat</span>
            </button>

            <button
              onClick={handleSaveGrades}
              disabled={saving || assessment.isLocked}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Nilai'}</span>
            </button>
          </div>
        </div>

        {/* Progress and Live Status Bar */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {/* Progress % */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600">Keterisian Nilai Siswa</span>
              <span className="text-emerald-700">{enteredCount} / {totalCount} Siswa ({progressPct}%)</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center justify-around sm:justify-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 py-2 px-3 rounded-xl border border-slate-100">
            <div>Rata-rata: <strong className="text-slate-900">{averageScore}</strong></div>
            <div>Tertinggi: <strong className="text-emerald-700">{highestScore}</strong></div>
            <div>Terendah: <strong className="text-amber-700">{lowestScore}</strong></div>
          </div>

          {/* Autosave Status */}
          <div className="flex items-center justify-end gap-2 text-xs">
            {saveStatus === 'saving' && (
              <span className="text-amber-600 font-semibold flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menyimpan nilai ke server...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Semua data tersimpan
              </span>
            )}
            {saveStatus === 'idle' && (
              <span className="text-slate-400 font-medium">Ada perubahan belum disimpan</span>
            )}
          </div>
        </div>
      </div>

      {/* Input Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="font-bold text-slate-700 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Daftar Siswa Kelas {assessment.className} ({rows.length} Siswa)</span>
          </div>
          <div className="text-slate-500">
            <span className="font-semibold text-emerald-800">Tips Cepat:</span> Tekan <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Enter</kbd> atau <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">&darr;</kbd> untuk berpindah ke siswa berikutnya.
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-28">NIS</th>
                <th className="py-3 px-4 min-w-[200px]">Nama Lengkap Siswa</th>
                <th className="py-3 px-4 w-36 text-center">Nilai (0 - {assessment.maxScore || 100})</th>
                <th className="py-3 px-4 w-28 text-center">Capaian</th>
                <th className="py-3 px-4 min-w-[250px]">Catatan / Evaluasi Perkembangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => {
                const numScore = Number(row.score);
                const hasScore = row.score.trim() !== '' && !isNaN(numScore);
                
                let badgeClass = 'bg-slate-100 text-slate-500';
                let badgeText = 'Belum Dinilai';

                if (hasScore) {
                  if (numScore >= 85) {
                    badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    badgeText = 'Sangat Baik';
                  } else if (numScore >= 75) {
                    badgeClass = 'bg-teal-100 text-teal-800 border-teal-200';
                    badgeText = 'Baik';
                  } else if (numScore >= 65) {
                    badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
                    badgeText = 'Cukup';
                  } else {
                    badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
                    badgeText = 'Perlu Bimbingan';
                  }
                }

                return (
                  <tr
                    key={row.student.id}
                    className={`hover:bg-emerald-50/40 transition-colors ${row.isModified ? 'bg-amber-50/30' : ''}`}
                  >
                    <td className="py-3 px-4 text-center font-bold text-slate-500">
                      {row.student.absentNumber || index + 1}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {row.student.nis || '-'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {row.student.name}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <input
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="number"
                        min="0"
                        max={assessment.maxScore || 100}
                        step="any"
                        disabled={assessment.isLocked}
                        value={row.score}
                        onChange={(e) => handleScoreChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        placeholder="0"
                        className={`w-24 text-center font-bold py-1.5 px-2 rounded-xl text-sm border transition-all focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 ${
                          !row.isValid 
                            ? 'border-rose-400 bg-rose-50 text-rose-700 focus:ring-rose-400' 
                            : hasScore 
                            ? 'border-emerald-300 bg-emerald-50/50 text-emerald-950 focus:ring-emerald-500' 
                            : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-emerald-500'
                        }`}
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                        {badgeText}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        disabled={assessment.isLocked}
                        value={row.note}
                        onChange={(e) => handleNoteChange(index, e.target.value)}
                        placeholder="Catatan perkembangan khusus..."
                        className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer sticky bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Total <strong className="text-slate-800">{rows.length}</strong> siswa terdaftar dalam rombel ini.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveGrades}
              disabled={saving || assessment.isLocked}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Semua Nilai'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Bulk Fill */}
      {isBulkFillOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Copy className="w-4 h-4 text-amber-600" />
                <span>Pengisian Cepat / Massal</span>
              </h3>
              <button onClick={() => setIsBulkFillOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nilai yang akan diisikan (0 - {assessment.maxScore || 100})
                </label>
                <input
                  type="number"
                  min="0"
                  max={assessment.maxScore || 100}
                  value={bulkScore}
                  onChange={(e) => setBulkScore(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="block font-bold text-slate-700">Terapkan Pada:</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="target"
                      checked={bulkFillTarget === 'empty_only'}
                      onChange={() => setBulkFillTarget('empty_only')}
                      className="text-emerald-600"
                    />
                    <span>Hanya siswa yang nilainya masih kosong</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="target"
                      checked={bulkFillTarget === 'all'}
                      onChange={() => setBulkFillTarget('all')}
                      className="text-emerald-600"
                    />
                    <span>Seluruh siswa di kelas ini (timpa nilai yang ada)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsBulkFillOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleApplyBulkFill}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs"
              >
                Terapkan Nilai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Import Excel */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Import Nilai dari File Excel</span>
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Unggah file Excel hasil pengisian template nilai. Sistem akan memverifikasi NIS dan nama siswa dengan data resmi kelas ini sebelum menyimpan.
              </p>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors bg-slate-50/50">
                <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-slate-800">Pilih file spreadsheet (.xlsx / .xls)</p>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                />
              </div>

              {/* Import Preview */}
              {importSummary && (
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between font-bold">
                    <span>Hasil Validasi:</span>
                    <span className="text-emerald-700">{importSummary.validCount} Valid / {importSummary.invalidCount} Bermasalah</span>
                  </div>

                  {importSummary.errors.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-rose-50 rounded-lg text-[11px] text-rose-700">
                      {importSummary.errors.map((err, i) => (
                        <div key={i}>&bull; {err}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                onClick={() => { setIsImportModalOpen(false); setImportSummary(null); }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
              >
                Tutup
              </button>
              <button
                onClick={handleApplyImport}
                disabled={!importSummary || importSummary.validCount === 0}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs disabled:opacity-40"
              >
                Terapkan {importSummary?.validCount || 0} Nilai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
