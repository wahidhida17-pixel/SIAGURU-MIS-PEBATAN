import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { 
  Sparkles, CheckSquare, Download, Copy, Printer, Check, 
  BookmarkPlus, AlertCircle, BookOpen, Layers
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { aiService } from '../../../../services/aiService';
import { copyToClipboard, exportTextAsDoc, printAIContent } from '../../../../utils/aiExportUtils';
import type { RubricGenParams } from '../../../../types/ai';

const SUBJECT_OPTIONS = [
  'Al-Qur\'an Hadis',
  'Akidah Akhlak',
  'Fikih',
  'Sejarah Kebudayaan Islam (SKI)',
  'Bahasa Arab',
  'Pendidikan Pancasila (PPKn)',
  'Bahasa Indonesia',
  'Matematika',
  'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
  'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)',
  'Seni Budaya & Prakarya',
  'Bahasa Jawa (Muatan Lokal)',
  'Bahasa Inggris'
];

export const AIRubricTab: React.FC = () => {
  const [formData, setFormData] = useState<RubricGenParams>({
    subjectName: 'Bahasa Arab',
    gradeLevel: 'Kelas 4',
    tpDescription: 'Peserta didik mampu melafalkan, mengidentifikasi kosakata nama-nama alat sekolah (Adawatul Madrasiyyah), dan menyusun kalimat sederhana dalam bahasa Arab.',
    rubricType: 'Deskriptif Interval 4 Kategori (Perlu Bimbingan, Cukup, Baik, Sangat Baik)',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tpDescription.trim()) {
      setErrorMsg('Deskripsi Tujuan Pembelajaran (TP) wajib diisi.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg('');
    setCopied(false);
    setSaved(false);

    try {
      const content = await aiService.generateRubric(formData);
      setGeneratedContent(content);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghasilkan Rubrik KKTP.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedContent) return;
    const ok = await copyToClipboard(generatedContent);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleExportWord = () => {
    if (!generatedContent) return;
    exportTextAsDoc(
      `Rubrik_KKTP_${formData.subjectName}_${formData.gradeLevel}`,
      generatedContent
    );
  };

  const handlePrint = () => {
    if (!generatedContent) return;
    printAIContent(
      `Rubrik KKTP ${formData.subjectName} ${formData.gradeLevel} - MI Syuriyah Pebatan`,
      generatedContent
    );
  };

  const handleSaveArtifact = () => {
    if (!generatedContent) return;
    aiService.saveItem({
      category: 'rubric',
      title: `Rubrik KKTP ${formData.subjectName} (${formData.gradeLevel}) - ${formData.tpDescription.slice(0, 40)}...`,
      content: generatedContent,
      subjectName: formData.subjectName,
      gradeLevel: formData.gradeLevel,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 space-y-6">
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Generator Rubrik & KKTP
            </CardTitle>
            <CardDescription>
              Kriteria Ketercapaian Tujuan Pembelajaran Kurikulum Merdeka
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Mata Pelajaran
                </label>
                <select
                  value={formData.subjectName}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                >
                  {SUBJECT_OPTIONS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Tingkat Kelas
                </label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="Kelas 1">Kelas 1</option>
                  <option value="Kelas 2">Kelas 2</option>
                  <option value="Kelas 3">Kelas 3</option>
                  <option value="Kelas 4">Kelas 4</option>
                  <option value="Kelas 5">Kelas 5</option>
                  <option value="Kelas 6">Kelas 6</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Tujuan Pembelajaran (TP) yang Dinilai *
                </label>
                <textarea
                  rows={4}
                  value={formData.tpDescription}
                  onChange={(e) => setFormData({ ...formData, tpDescription: e.target.value })}
                  placeholder="Salin atau ketik Tujuan Pembelajaran yang ingin dibuatkan rubrik penilaian..."
                  required
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Tipe Rubrik
                </label>
                <select
                  value={formData.rubricType}
                  onChange={(e) => setFormData({ ...formData, rubricType: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="Deskriptif Interval 4 Kategori (Perlu Bimbingan, Cukup, Baik, Sangat Baik)">
                    Deskriptif Interval 4 Kategori (Standar Kurikulum Merdeka)
                  </option>
                  <option value="Skala Kualitatif & Ceklis Indikator Praktik">
                    Skala Kualitatif & Ceklis Unjuk Kerja / Praktik
                  </option>
                  <option value="Rubrik Holistik Penilaian Proyek P5-PPRA">
                    Rubrik Holistik Penilaian Proyek P5-PPRA
                  </option>
                </select>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menyusun Rubrik KKTP...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Hasilkan Rubrik KKTP
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-7 space-y-6">
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm min-h-[640px] flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/60 rounded-t-3xl">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                Pratinjau Instrumen KKTP & Rubrik
              </h3>
            </div>

            {generatedContent && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="text-xs dark:border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copied ? 'Disalin' : 'Salin'}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportWord}
                  className="text-xs dark:border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Word (.doc)
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrint}
                  className="text-xs dark:border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Cetak
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveArtifact}
                  className="text-xs dark:border-slate-700"
                >
                  {saved ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <BookmarkPlus className="w-3.5 h-3.5 mr-1" />}
                  {saved ? 'Tersimpan' : 'Simpan Arsip'}
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 p-6 overflow-y-auto max-h-[700px]">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-80 space-y-4 text-center">
                <div className="w-12 h-12 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-900 animate-spin">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">
                    Sedang Merumuskan Rubrik KKTP
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    Menganalisis deskriptor kinerja tiap interval nilai dan rencana tindak lanjut...
                  </p>
                </div>
              </div>
            ) : generatedContent ? (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-p:leading-relaxed prose-table:border-collapse prose-th:border prose-th:border-slate-300 dark:prose-th:border-slate-700 prose-th:bg-slate-100 dark:prose-th:bg-slate-800 prose-th:p-2 prose-td:border prose-td:border-slate-300 dark:prose-td:border-slate-700 prose-td:p-2">
                <Markdown>{generatedContent}</Markdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-center space-y-3 text-slate-400 dark:text-slate-500">
                <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Layers className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                    Rubrik Belum Dihasilkan
                  </h4>
                  <p className="text-xs max-w-xs mt-1">
                    Silakan masukkan Tujuan Pembelajaran (TP) yang ingin dibuatkan instrumen rubrik penilaian.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
