import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { 
  Sparkles, HelpCircle, Download, Copy, Printer, Check, 
  BookmarkPlus, CheckCircle2, AlertCircle, FileCheck, Layers, Heart
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { aiService } from '../../../../services/aiService';
import { copyToClipboard, exportTextAsDoc, printAIContent } from '../../../../utils/aiExportUtils';
import type { QuizGenParams } from '../../../../types/ai';

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

const QUESTION_TYPES = [
  'Campuran (Pilihan Ganda & Uraian)',
  'Pilihan Ganda Saja (4 Opsi A-B-C-D)',
  'Pilihan Ganda Kompleks & Menjodohkan',
  'Isian Singkat & Uraian / Essay HOTS',
  'Praktik & Unjuk Kerja Keterampilan (PAI/B.Arab)'
];

export const AIQuizTab: React.FC = () => {
  const [formData, setFormData] = useState<QuizGenParams>({
    subjectName: 'Fikih',
    gradeLevel: 'Kelas 4',
    topic: 'Ketentuan Shalat Berjamaah dan Masbuq',
    questionType: 'Campuran (Pilihan Ganda & Uraian)',
    count: 10,
    cognitiveLevels: '30% LOTS (C1-C2), 40% MOTS (C3), 30% HOTS (C4-C5)',
    withAnswerKey: true,
    withGridTable: true,
    curriculumStandard: 'KMA 450 Tahun 2024 (Edisi Pembaruan 2026/2027)',
    kbcIntegration: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim()) {
      setErrorMsg('Topik / materi soal asesmen wajib diisi.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg('');
    setCopied(false);
    setSaved(false);

    try {
      const content = await aiService.generateQuiz(formData);
      setGeneratedContent(content);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghasilkan Bank Soal.');
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
      `Paket_Soal_Asesmen_${formData.subjectName}_${formData.gradeLevel}_${formData.topic}`,
      generatedContent
    );
  };

  const handlePrint = () => {
    if (!generatedContent) return;
    printAIContent(
      `Bank Soal ${formData.subjectName} ${formData.gradeLevel} - MI Syuriyah Pebatan`,
      generatedContent
    );
  };

  const handleSaveArtifact = () => {
    if (!generatedContent) return;
    aiService.saveItem({
      category: 'quiz',
      title: `Bank Soal ${formData.subjectName} (${formData.gradeLevel}) - ${formData.topic}`,
      content: generatedContent,
      subjectName: formData.subjectName,
      gradeLevel: formData.gradeLevel,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Configuration Column */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Generator Bank Soal & Kisi-Kisi
            </CardTitle>
            <CardDescription>
              Otomasi perumusan soal asesmen sumatif / formatif berbasis HOTS & LOTS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Mata Pelajaran */}
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

              {/* Kelas & Jumlah Soal */}
              <div className="grid grid-cols-2 gap-3">
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
                    Jumlah Soal
                  </label>
                  <select
                    value={formData.count}
                    onChange={(e) => setFormData({ ...formData, count: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value={5}>5 Butir Soal</option>
                    <option value={10}>10 Butir Soal</option>
                    <option value={15}>15 Butir Soal</option>
                    <option value={20}>20 Butir Soal</option>
                    <option value={25}>25 Butir Soal</option>
                  </select>
                </div>
              </div>

              {/* Topik / Materi */}
              <Input
                label="Pokok Bahasan / Materi Ujian *"
                placeholder="Contoh: Ketentuan Zakat Fitrah & Zakat Mal"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                required
              />

              {/* Bentuk Soal */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Bentuk / Tipe Soal
                </label>
                <select
                  value={formData.questionType}
                  onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  {QUESTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Proporsi Level Kognitif */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Distribusi Kognitif (Bloom)
                </label>
                <select
                  value={formData.cognitiveLevels}
                  onChange={(e) => setFormData({ ...formData, cognitiveLevels: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="Seimbang: 30% LOTS (C1-C2), 40% MOTS (C3), 30% HOTS (C4-C5)">
                    Seimbang: 30% LOTS, 40% MOTS, 30% HOTS
                  </option>
                  <option value="Dominan HOTS: 20% LOTS, 30% MOTS, 50% HOTS (Penalaran Kritis)">
                    Dominan HOTS: 20% LOTS, 30% MOTS, 50% HOTS
                  </option>
                  <option value="Dominan Dasar (LOTS/MOTS): 50% LOTS, 40% MOTS, 10% HOTS">
                    Dominan Dasar: 50% LOTS, 40% MOTS, 10% HOTS
                  </option>
                </select>
              </div>

              {/* Standar Kurikulum */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Pedoman Kurikulum & Regulasi
                </label>
                <select
                  value={formData.curriculumStandard || 'KMA 450 Tahun 2024 (Edisi Pembaruan 2026/2027)'}
                  onChange={(e) => setFormData({ ...formData, curriculumStandard: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="KMA 450 Tahun 2024 (Edisi Pembaruan 2026/2027)">
                    KMA 450 Tahun 2024 (Edisi Pembaruan 2026/2027) - Resmi Kemenag
                  </option>
                  <option value="Kurikulum Merdeka Mandiri Berbagi">
                    Kurikulum Merdeka Mandiri Berbagi
                  </option>
                  <option value="Kurikulum 2013 Revisi">
                    Kurikulum 2013 Revisi
                  </option>
                </select>
              </div>

              {/* Checkboxes for Extras */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.kbcIntegration !== false}
                    onChange={(e) => setFormData({ ...formData, kbcIntegration: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                  />
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/30" />
                    Sisipkan Stimulus Kontekstual Kurikulum Berbasis Cinta (KBC Kemenag)
                  </span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.withGridTable}
                    onChange={(e) => setFormData({ ...formData, withGridTable: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span>Sertakan Matriks Tabel Kisi-Kisi Asesmen</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.withAnswerKey}
                    onChange={(e) => setFormData({ ...formData, withAnswerKey: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span>Sertakan Kunci Jawaban & Rubrik Penskoran</span>
                </label>
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
                    AI sedang merumuskan Soal & Kisi-Kisi...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Hasilkan Bank Soal & Kisi-Kisi
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Output Preview Column */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm min-h-[640px] flex flex-col">
          {/* Header Action Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/60 rounded-t-3xl">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                Pratinjau Naskah Soal & Kisi-Kisi
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

          {/* Content Body */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[700px]">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-80 space-y-4 text-center">
                <div className="w-12 h-12 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-900 animate-spin">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">
                    Sedang Merumuskan Butir Soal Asesmen
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    Menyusun stimulus kontekstual, indikator soal, kunci jawaban, dan rubrik penskoran...
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
                  <HelpCircle className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                    Bank Soal Belum Dihasilkan
                  </h4>
                  <p className="text-xs max-w-xs mt-1">
                    Silakan tentukan mata pelajaran, materi, dan jumlah soal pada panel sebelah kiri lalu klik tombol buat.
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
