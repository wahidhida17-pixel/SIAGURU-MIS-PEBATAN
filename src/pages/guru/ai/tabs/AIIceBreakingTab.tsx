import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { 
  Sparkles, Gamepad2, Download, Copy, Printer, Check, 
  BookmarkPlus, AlertCircle, Smile, HeartHandshake
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { aiService } from '../../../../services/aiService';
import { copyToClipboard, exportTextAsDoc, printAIContent } from '../../../../utils/aiExportUtils';
import type { IceBreakingGenParams } from '../../../../types/ai';

const VIBE_OPTIONS = [
  'Siswa mengantuk & kurang fokus di jam siang',
  'Awal pembelajaran / penyemangat sebelum mulai materi',
  'Membangun kekompakan kelompok (Ta\'awun)',
  'Penyegaran fisik (Brain Gym / Motorik)',
  'Penguatan hafalan & kosa kata bernuansa islami'
];

const PPRA_THEMES = [
  'Ta\'addub (Berkeadaban & Sopan Santun)',
  'Qudwah (Keteladanan & Kepemimpinan)',
  'Ta\'awun (Gotong Royong & Saling Menolong)',
  'Tasamuh (Toleransi & Saling Menghargai)',
  'Syura (Musyawarah & Kerjasama)',
  'Saja\'ah (Keberanian & Percaya Diri)'
];

export const AIIceBreakingTab: React.FC = () => {
  const [formData, setFormData] = useState<IceBreakingGenParams>({
    gradeLevel: 'Kelas 1 - 3 (Fase A)',
    classroomVibe: 'Siswa mengantuk & kurang fokus di jam siang',
    duration: '5 - 10 Menit',
    p5ppraTheme: 'Ta\'awun (Gotong Royong & Saling Menolong)',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setErrorMsg('');
    setCopied(false);
    setSaved(false);

    try {
      const content = await aiService.generateIceBreaking(formData);
      setGeneratedContent(content);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghasilkan Ide Ice Breaking.');
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
      `Ice_Breaking_Islami_${formData.gradeLevel}`,
      generatedContent
    );
  };

  const handlePrint = () => {
    if (!generatedContent) return;
    printAIContent(
      `Ice Breaking Edukatif Islami - MI Syuriyah Pebatan`,
      generatedContent
    );
  };

  const handleSaveArtifact = () => {
    if (!generatedContent) return;
    aiService.saveItem({
      category: 'ice_breaking',
      title: `Ice Breaking (${formData.gradeLevel}) - ${formData.p5ppraTheme}`,
      content: generatedContent,
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
              Generator Ice Breaking Edukatif
            </CardTitle>
            <CardDescription>
              Permainan edukatif, energizer & penguatan karakter P5-PPRA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Sasaran Jenjang Kelas
                </label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="Kelas 1 - 2 (Fase A - Awal)">Kelas 1 - 2 (Fase A - Sederhana, Gerak & Nyanyi)</option>
                  <option value="Kelas 3 - 4 (Fase B - Menengah)">Kelas 3 - 4 (Fase B - Konsentrasi & Kerjasama)</option>
                  <option value="Kelas 5 - 6 (Fase C - Tingkat Atas)">Kelas 5 - 6 (Fase C - Strategi & Cepat Tepat)</option>
                  <option value="Semua Jenjang MI (Umum)">Semua Jenjang MI (Acara Bersama / Apel Pagi)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Kebutuhan / Suasana Kelas
                </label>
                <select
                  value={formData.classroomVibe}
                  onChange={(e) => setFormData({ ...formData, classroomVibe: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                >
                  {VIBE_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Target Durasi Permainan
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="3 - 5 Menit (Cepat & Praktis)">3 - 5 Menit (Cepat & Praktis)</option>
                  <option value="5 - 10 Menit (Standar Energizer)">5 - 10 Menit (Standar Energizer)</option>
                  <option value="10 - 15 Menit (Permainan Tim Mendalam)">10 - 15 Menit (Permainan Tim Mendalam)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Karakter P5-PPRA yang Diintegrasikan
                </label>
                <select
                  value={formData.p5ppraTheme}
                  onChange={(e) => setFormData({ ...formData, p5ppraTheme: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  {PPRA_THEMES.map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
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
                    Merancang Ide Ice Breaking...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Hasilkan 3 Ide Ice Breaking Islami
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
              <Gamepad2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                Pratinjau Ide Ice Breaking
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
                    Sedang Merancang Ice Breaking Seru
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    Menyusun aturan main, stimulus fisik/motorik, dan hikmah karakter islami...
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
                  <Smile className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                    Ice Breaking Belum Dihasilkan
                  </h4>
                  <p className="text-xs max-w-xs mt-1">
                    Pilih sasaran kelas dan suasana belajar untuk mendapatkan rekomendasi permainan edukatif seru.
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
