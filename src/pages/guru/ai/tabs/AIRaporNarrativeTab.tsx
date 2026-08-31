import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { 
  Sparkles, FileSpreadsheet, Download, Copy, Printer, Check, 
  BookmarkPlus, AlertCircle, UserCheck, MessageSquareQuote, Heart
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { aiService } from '../../../../services/aiService';
import { copyToClipboard, exportTextAsDoc, printAIContent } from '../../../../utils/aiExportUtils';
import type { RaporNarrativeGenParams } from '../../../../types/ai';

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

const KBC_RAPOR_TAGS = [
  'Cinta Allah (Tadarus & Ibadah)',
  'Cinta Rasulullah (Adab & Akhlak Santun)',
  'Cinta Diri Sendiri (Percaya Diri & Mandiri)',
  'Cinta Sesama (Empati & Tolong Menolong)',
  'Cinta Lingkungan (Peduli Kebersihan)',
  'Cinta Bangsa & Tanah Air (Toleran & Moderat)',
  'Prinsip Keikhlasan & Kejujuran',
  'Prinsip Kebersamaan & Kekeluargaan'
];

export const AIRaporNarrativeTab: React.FC = () => {
  const [formData, setFormData] = useState<RaporNarrativeGenParams>({
    studentName: 'Muhammad Rizky Pratama',
    subjectName: 'Al-Qur\'an Hadis',
    highestTp: 'Membaca dan menghafal Surah Al-Ma\'un dengan makhraj dan hukum tajwid yang fasih.',
    lowestTp: 'Memahami arti kosa kata dan asbabun nuzul surah pilihan secara mandiri.',
    score: 88,
    characterNotes: 'Sangat rajin tadarus pagi, berakhlak santun dan suka membantu teman sekelas.',
    kbcCharacterValues: ['Cinta Allah (Tadarus & Ibadah)', 'Cinta Sesama (Empati & Tolong Menolong)', 'Prinsip Kebersamaan & Kekeluargaan'],
    curriculumStandard: 'KMA 450 Tahun 2024 (Edisi Pembaruan 2026/2027)'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleToggleKBCTag = (tag: string) => {
    setFormData((prev) => {
      const current = prev.kbcCharacterValues || [];
      const exists = current.includes(tag);
      return {
        ...prev,
        kbcCharacterValues: exists ? current.filter((x) => x !== tag) : [...current, tag]
      };
    });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim() || !formData.highestTp.trim()) {
      setErrorMsg('Nama siswa dan Capaian TP Tertinggi wajib diisi.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg('');
    setCopied(false);
    setSaved(false);

    try {
      const content = await aiService.generateRaporNarrative(formData);
      setGeneratedContent(content);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghasilkan Narasi Rapor.');
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
      `Narasi_Rapor_${formData.studentName}_${formData.subjectName}`,
      generatedContent
    );
  };

  const handlePrint = () => {
    if (!generatedContent) return;
    printAIContent(
      `Deskripsi Rapor ${formData.studentName} - MI Syuriyah Pebatan`,
      generatedContent
    );
  };

  const handleSaveArtifact = () => {
    if (!generatedContent) return;
    aiService.saveItem({
      category: 'rapor',
      title: `Deskripsi Rapor ${formData.studentName} (${formData.subjectName})`,
      content: generatedContent,
      subjectName: formData.subjectName,
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
              Generator Deskripsi Rapor
            </CardTitle>
            <CardDescription>
              Otomasi kalimat capaian kompetensi e-Rapor resmi Kemenag
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Nama Siswa *"
                  placeholder="Nama Lengkap Siswa"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  required
                />
                <Input
                  label="Nilai Akhir (0-100)"
                  type="number"
                  placeholder="85"
                  value={formData.score || ''}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                />
              </div>

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
                  Capaian TP Tertinggi (Sangat Dikuasai) *
                </label>
                <textarea
                  rows={2}
                  value={formData.highestTp}
                  onChange={(e) => setFormData({ ...formData, highestTp: e.target.value })}
                  placeholder="Materi atau TP yang paling dikuasai dengan sangat baik oleh siswa..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Capaian TP yang Perlu Bimbingan / Peningkatan *
                </label>
                <textarea
                  rows={2}
                  value={formData.lowestTp}
                  onChange={(e) => setFormData({ ...formData, lowestTp: e.target.value })}
                  placeholder="Materi atau TP yang masih membutuhkan pendampingan..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Catatan Karakter / Sikap Siswa (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.characterNotes || ''}
                  onChange={(e) => setFormData({ ...formData, characterNotes: e.target.value })}
                  placeholder="Contoh: Sangat tekun, santun, dan suka tolong-menolong"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              {/* Kurikulum Berbasis Cinta (KBC Kemenag) Character Tags */}
              <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500/30 shrink-0" />
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    Nilai Karakter Kurikulum Berbasis Cinta (KBC):
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {KBC_RAPOR_TAGS.map((tag) => {
                    const isSelected = formData.kbcCharacterValues?.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleKBCTag(tag)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500 border-rose-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900 text-slate-700 dark:text-slate-300 hover:border-rose-400'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>
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
                    Menyusun Narasi Rapor...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Hasilkan Narasi Rapor Otomatis
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
              <MessageSquareQuote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                Pratinjau Alternatif Narasi e-Rapor
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
                    Sedang Merumuskan Narasi Rapor
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    Menyusun kalimat deskripsi capaian tertinggi dan rekomendasi pembinaan yang konstruktif...
                  </p>
                </div>
              </div>
            ) : generatedContent ? (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-p:leading-relaxed">
                <Markdown>{generatedContent}</Markdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-center space-y-3 text-slate-400 dark:text-slate-500">
                <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                    Narasi Rapor Belum Dihasilkan
                  </h4>
                  <p className="text-xs max-w-xs mt-1">
                    Silakan isi data siswa dan capaian kompetensi untuk membuat narasi otomatis berstandar Kemenag.
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
