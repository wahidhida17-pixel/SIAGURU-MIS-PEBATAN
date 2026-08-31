import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, FileText, Download, Copy, Printer, Check, 
  BookmarkPlus, ArrowRight, BookOpen, Layers, Clock, AlertCircle, RefreshCw,
  Heart
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { aiService } from '../../../../services/aiService';
import { copyToClipboard, exportTextAsDoc, printAIContent } from '../../../../utils/aiExportUtils';
import type { ModuleAjarGenParams } from '../../../../types/ai';

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
  'Bahasa Sunda (Muatan Lokal)',
  'Bahasa Inggris'
];

const KBC_THEMES_OPTIONS = [
  'Cinta Allah SWT (Mahabbah Ilahiyyah)',
  'Cinta Rasulullah SAW (Mahabbah Nabawiyyah)',
  'Cinta Diri Sendiri (Mahabbah Nafsiyyah)',
  'Cinta Sesama Manusia (Mahabbah Insaniyyah)',
  'Cinta Lingkungan & Alam (Mahabbah Bi\'iyyah)',
  'Cinta Bangsa & Tanah Air (Hubbul Wathan)'
];

const KBC_9K_PRINCIPLES = [
  'Keberagaman',
  'Kebersamaan',
  'Kekeluargaan',
  'Kemandirian',
  'Kesetaraan',
  'Kebermanfaatan',
  'Kejujuran',
  'Keikhlasan',
  'Kesinambungan'
];

const P5_PPRA_OPTIONS = [
  'Beriman & Bertakwa kepada Tuhan YME',
  'Berkeadaban (Ta\'addub)',
  'Keteladanan (Qudwah)',
  'Kewarganegaraan (Muwatanah)',
  'Gotong Royong & Tolong Menolong (Ta\'awun)',
  'Toleransi (Tasamuh)',
  'Bernalar Kritis & Inovatif (Tathawwur)',
  'Mandiri & Berimbang (Tawazun)'
];

export const AIModuleAjarTab: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ModuleAjarGenParams>({
    subjectName: 'Al-Qur\'an Hadis',
    gradeLevel: 'Kelas 4',
    phase: 'Fase B',
    topic: 'Membaca dan Memahami Surah Al-Ma\'un',
    duration: '2 JP (2 x 35 Menit) - 1 Pertemuan',
    learningModel: 'Problem Based Learning (PBL) & Talaqqi',
    curriculumStandard: 'KMA 450 Tahun 2024 (Edisi Pembaruan 2026/2027)',
    kbcThemes: ['Cinta Allah SWT (Mahabbah Ilahiyyah)', 'Cinta Sesama Manusia (Mahabbah Insaniyyah)'],
    kbcPrinciples: ['Kebersamaan', 'Keikhlasan', 'Kebermanfaatan'],
    p5ppra: ['Berkeadaban (Ta\'addub)', 'Keteladanan (Qudwah)', 'Gotong Royong & Tolong Menolong (Ta\'awun)'],
    targetStudents: 'Peserta didik reguler / tipikal (28 siswa)',
    specificNotes: 'Sertakan kegiatan hafalan berpasangan penuh kasih sayang dan stimulus video tilawah.',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGradeChange = (grade: string) => {
    let phase = 'Fase A';
    if (grade === 'Kelas 3' || grade === 'Kelas 4') phase = 'Fase B';
    if (grade === 'Kelas 5' || grade === 'Kelas 6') phase = 'Fase C';

    setFormData((prev) => ({
      ...prev,
      gradeLevel: grade,
      phase,
    }));
  };

  const handleToggleP5 = (item: string) => {
    setFormData((prev) => {
      const current = prev.p5ppra || [];
      const exists = current.includes(item);
      return {
        ...prev,
        p5ppra: exists ? current.filter((x) => x !== item) : [...current, item],
      };
    });
  };

  const handleToggleKBCTheme = (item: string) => {
    setFormData((prev) => {
      const current = prev.kbcThemes || [];
      const exists = current.includes(item);
      return {
        ...prev,
        kbcThemes: exists ? current.filter((x) => x !== item) : [...current, item],
      };
    });
  };

  const handleToggleKBCPrinciple = (item: string) => {
    setFormData((prev) => {
      const current = prev.kbcPrinciples || [];
      const exists = current.includes(item);
      return {
        ...prev,
        kbcPrinciples: exists ? current.filter((x) => x !== item) : [...current, item],
      };
    });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim()) {
      setErrorMsg('Materi pokok / topik pembelajaran wajib diisi.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg('');
    setCopied(false);
    setSaved(false);

    try {
      const content = await aiService.generateModuleAjar(formData);
      setGeneratedContent(content);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghasilkan Modul Ajar.');
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
      `Modul_Ajar_${formData.subjectName}_${formData.gradeLevel}_${formData.topic}`,
      generatedContent
    );
  };

  const handlePrint = () => {
    if (!generatedContent) return;
    printAIContent(
      `Modul Ajar ${formData.subjectName} ${formData.gradeLevel} - MI Syuriyah Pebatan`,
      generatedContent
    );
  };

  const handleSaveArtifact = () => {
    if (!generatedContent) return;
    aiService.saveItem({
      category: 'module_ajar',
      title: `Modul Ajar ${formData.subjectName} (${formData.gradeLevel}) - ${formData.topic}`,
      content: generatedContent,
      subjectName: formData.subjectName,
      gradeLevel: formData.gradeLevel,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Parameter Input Form Column */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Parameter Generator Modul Ajar
            </CardTitle>
            <CardDescription>
              Standar Kurikulum Merdeka Madrasah (KMA 450 Tahun 2024)
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
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium"
                >
                  {SUBJECT_OPTIONS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kelas & Fase */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Tingkat Kelas
                  </label>
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => handleGradeChange(e.target.value)}
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
                    Fase Kurikulum
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.phase}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold"
                  />
                </div>
              </div>

              {/* Topik / Materi Pokok */}
              <Input
                label="Materi Pokok / Bab / Pokok Bahasan *"
                placeholder="Contoh: Ketentuan Shalat Berjamaah / Siklus Air"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                required
              />

              {/* Alokasi Waktu */}
              <Input
                label="Alokasi Waktu"
                placeholder="Contoh: 2 JP (2 x 35 Menit)"
                value={formData.duration || ''}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />

              {/* Model Pembelajaran */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Model Pembelajaran Utama
                </label>
                <select
                  value={formData.learningModel}
                  onChange={(e) => setFormData({ ...formData, learningModel: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="Problem Based Learning (PBL) & Demonstrasi">Problem Based Learning (PBL) & Demonstrasi</option>
                  <option value="Project Based Learning (PjBL)">Project Based Learning (PjBL / Proyek)</option>
                  <option value="Discovery / Inkuiri Terbimbing">Discovery / Inkuiri Terbimbing</option>
                  <option value="Talaqqi, Drill & Praktik Langsung">Talaqqi, Drill & Praktik Langsung (PAI/B.Arab)</option>
                  <option value="Kooperatif Tipe Jigsaw & Diskusi Kelompok">Kooperatif Tipe Jigsaw & Diskusi Kelompok</option>
                  <option value="Game-Based Learning & Role Playing">Game-Based Learning & Bermain Peran</option>
                </select>
              </div>

              {/* Standar Kurikulum Madrasah & KMA Terkini */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Pedoman Kurikulum Madrasah
                </label>
                <select
                  value={formData.curriculumStandard || 'KMA 450 Tahun 2024 (Edisi Pembaruan 2026/2027)'}
                  onChange={(e) => setFormData({ ...formData, curriculumStandard: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
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

              {/* Kurikulum Berbasis Cinta (KBC Kemenag) Integration */}
              <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500/30 shrink-0" />
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    Integrasi Kurikulum Berbasis Cinta (KBC) Kemenag
                  </span>
                </div>

                {/* 6 Tema Cinta */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    6 Pilar Cinta Kemenag yang Ditanamkan:
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {KBC_THEMES_OPTIONS.map((theme) => {
                      const isSelected = formData.kbcThemes?.includes(theme);
                      return (
                        <button
                          key={theme}
                          type="button"
                          onClick={() => handleToggleKBCTheme(theme)}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-rose-500 border-rose-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900 text-slate-700 dark:text-slate-300 hover:border-rose-400'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {theme.split(' (')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 9K Principles */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Prinsip 9K Kemenag:
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {KBC_9K_PRINCIPLES.map((pr) => {
                      const isSelected = formData.kbcPrinciples?.includes(pr);
                      return (
                        <button
                          key={pr}
                          type="button"
                          onClick={() => handleToggleKBCPrinciple(pr)}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 border-amber-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {pr}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* P5-PPRA Tag Checklist */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Dimensi P5 & Rahmatan Lil Alamin (P5-PPRA)
                </label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {P5_PPRA_OPTIONS.map((item) => {
                    const isSelected = formData.p5ppra?.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleToggleP5(item)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Catatan Tambahan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Instruksi Khusus Guru (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formData.specificNotes || ''}
                  onChange={(e) => setFormData({ ...formData, specificNotes: e.target.value })}
                  placeholder="Misal: Sertakan kartu ayat untuk media kerja kelompok..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                />
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
                    AI sedang merancang Modul Ajar...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Hasilkan Modul Ajar Otomatis
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Output & Preview Column */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm min-h-[640px] flex flex-col">
          {/* Header Action Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/60 rounded-t-3xl">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                Pratinjau Modul Ajar
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

                <Button
                  size="sm"
                  onClick={() => navigate('/guru/learning/modul-ajar/wizard')}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Buka di Wizard
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
                    Sedang Merumuskan Modul Ajar
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    AI sedang menyelaraskan Capaian Pembelajaran, sintaks pembelajaran diferensiasi, asesmen, dan karakter P5-PPRA...
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
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                    Modul Ajar Belum Dihasilkan
                  </h4>
                  <p className="text-xs max-w-xs mt-1">
                    Silakan isi parameter di kolom sebelah kiri lalu klik tombol <strong>Hasilkan Modul Ajar Otomatis</strong>.
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
