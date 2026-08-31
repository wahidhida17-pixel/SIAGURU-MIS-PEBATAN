import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { 
  Heart, Sparkles, Download, Copy, Printer, Check, 
  BookmarkPlus, Compass, AlertCircle, RefreshCw, Sun, Users, TreePine, Flag, Smile
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { aiService } from '../../../../services/aiService';
import { copyToClipboard, exportTextAsDoc, printAIContent } from '../../../../utils/aiExportUtils';
import type { KBCActivityGenParams } from '../../../../types/ai';

const KBC_THEMES_DETAILS = [
  {
    id: 'Cinta Allah SWT (Mahabbah Ilahiyyah)',
    title: '1. Cinta Allah SWT',
    desc: 'Ibadah ikhlas, tadarus Al-Quran, doa & zikir harian, shalat dhuha/dhuhur berjamaah',
    icon: Sun
  },
  {
    id: 'Cinta Rasulullah SAW (Mahabbah Nabawiyyah)',
    title: '2. Cinta Rasulullah SAW',
    desc: 'Keteladanan adab mulia, shalawat nabi, menghidupkan sunnah harian, kisah sirah nabawiyah',
    icon: Heart
  },
  {
    id: 'Cinta Diri Sendiri (Mahabbah Nafsiyyah)',
    title: '3. Cinta Diri Sendiri',
    desc: 'Kesehatan fisik & mental, percaya diri, kebersihan diri, motivasi diri, anti merusak diri',
    icon: Smile
  },
  {
    id: 'Cinta Sesama Manusia (Mahabbah Insaniyyah)',
    title: '4. Cinta Sesama Manusia',
    desc: 'Empati mendalam, anti perundungan (bullying), tolong-menolong, saling memaafkan, sedekah',
    icon: Users
  },
  {
    id: 'Cinta Lingkungan & Alam (Mahabbah Bi\'iyyah)',
    title: '5. Cinta Lingkungan & Alam',
    desc: 'Madrasah asri, memilah sampah, menanam pohon berkah, hemat air & energi, peduli ciptaan Allah',
    icon: TreePine
  },
  {
    id: 'Cinta Bangsa & Tanah Air (Hubbul Wathan)',
    title: '6. Cinta Bangsa & Tanah Air',
    desc: 'Moderasi beragama, nasionalisme, menghargai kebinekaan, cinta produk nusantara, persatuan NKRI',
    icon: Flag
  }
];

const KBC_9K_VALUES = [
  { name: 'Keberagaman', desc: 'Menghargai perbedaan suku, bahasa, & kemampuan' },
  { name: 'Kebersamaan', desc: 'Gotong royong, kolaborasi tim, & rasa senasib' },
  { name: 'Kekeluargaan', desc: 'Suasana madrasah yang hangat, ramah & mengayomi' },
  { name: 'Kemandirian', desc: 'Tanggung jawab pribadi & inisiatif positif' },
  { name: 'Kesetaraan', desc: 'Keadilan perlakuan tanpa diskriminasi' },
  { name: 'Kebermanfaatan', desc: 'Ilmu dan amal yang memberi manfaat nyata' },
  { name: 'Kejujuran', desc: 'Integritas, amanah, & ketulusan bersikap' },
  { name: 'Keikhlasan', desc: 'Niat lillahi ta\'ala & tanpa pamrih duniawi' },
  { name: 'Kesinambungan', desc: 'Konsistensi (istiqamah) dalam kebaikan' }
];

export const AIKBCTab: React.FC = () => {
  const [formData, setFormData] = useState<KBCActivityGenParams>({
    primaryTheme: 'Cinta Sesama Manusia (Mahabbah Insaniyyah)',
    secondaryTheme: 'Cinta Allah SWT (Mahabbah Ilahiyyah)',
    targetAudience: 'Siswa Kelas 4 (Fase B) & Seluruh Warga Madrasah',
    activityType: 'Proyek Pembiasaan Karakter & Aksi Nyata Kolaboratif',
    duration: '1 Bulan Pembiasaan Terpadu (4 Minggu)',
    principles9K: ['Kebersamaan', 'Keikhlasan', 'Kebermanfaatan', 'Kekeluargaan'],
    specificGoals: 'Mencegah perundungan (anti-bullying), menumbuhkan budaya sahabat peduli, dan sedekah jumat berkah.'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleToggle9K = (item: string) => {
    setFormData((prev) => {
      const current = prev.principles9K || [];
      const exists = current.includes(item);
      return {
        ...prev,
        principles9K: exists ? current.filter((x) => x !== item) : [...current, item],
      };
    });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.targetAudience.trim() || !formData.primaryTheme.trim()) {
      setErrorMsg('Fokus tema utama dan target sasaran wajib diisi.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg('');
    setCopied(false);
    setSaved(false);

    try {
      const content = await aiService.generateKBCActivity(formData);
      setGeneratedContent(content);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghasilkan Program Kurikulum Berbasis Cinta.');
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
      `Program_KBC_${formData.primaryTheme.split(' (')[0].replace(/\s+/g, '_')}`,
      generatedContent
    );
  };

  const handlePrint = () => {
    if (!generatedContent) return;
    printAIContent(
      `Program Kurikulum Berbasis Cinta (KBC) - MI Syuriyah Pebatan`,
      generatedContent
    );
  };

  const handleSaveArtifact = () => {
    if (!generatedContent) return;
    aiService.saveItem({
      category: 'kbc_activity',
      title: `Program KBC: ${formData.primaryTheme.split(' (')[0]} (${formData.targetAudience})`,
      content: generatedContent,
      subjectName: 'Kurikulum Berbasis Cinta (KBC)',
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Parameter Input Column */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="rounded-3xl border-rose-200 dark:border-rose-900/40 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-rose-50/80 to-amber-50/50 dark:from-rose-950/30 dark:to-amber-950/20 rounded-t-3xl border-b border-rose-100 dark:border-rose-900/30">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Heart className="w-5 h-5 fill-rose-500/40 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Generator Kurikulum Berbasis Cinta (KBC)
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500 text-white">
                    Kemenag RI
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-rose-800/80 dark:text-rose-300">
                  Rancang proyek aksi cinta, pembiasaan budaya madrasah, & panduan guru
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Tema Cinta Utama */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Pilar Utama Tema Cinta KBC (Kemenag) *
                </label>
                <select
                  value={formData.primaryTheme}
                  onChange={(e) => setFormData({ ...formData, primaryTheme: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none font-semibold"
                >
                  {KBC_THEMES_DETAILS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tema Cinta Pendukung */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Tema Cinta Pendukung / Integrasi (Opsional)
                </label>
                <select
                  value={formData.secondaryTheme || ''}
                  onChange={(e) => setFormData({ ...formData, secondaryTheme: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Tanpa Tema Pendukung --</option>
                  {KBC_THEMES_DETAILS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jenis Program / Format Kegiatan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Bentuk / Format Program KBC
                </label>
                <select
                  value={formData.activityType}
                  onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="Proyek Pembiasaan Karakter & Aksi Nyata Kolaboratif">
                    Proyek Pembiasaan Karakter & Aksi Nyata (Kokurikuler / P5-PPRA)
                  </option>
                  <option value="Skenario Integrasi Pembelajaran di Kelas (Intrakurikuler)">
                    Integrasi Kegiatan Pembelajaran di Kelas (Intrakurikuler)
                  </option>
                  <option value="Gerakan Budaya Madrasah & Apresiasi Karakter">
                    Gerakan Budaya Ekosistem Madrasah Ramah Anak & Positif
                  </option>
                  <option value="Kegiatan Ekstrakurikuler & Pengabdian Sosial">
                    Kegiatan Ekstrakurikuler & Bakti Sosial Berbasis Cinta
                  </option>
                  <option value="Panduan Guru: Pendampingan & Restoratif Disiplin Positif">
                    Panduan Guru: Disiplin Positif Tanpa Kekerasan (Restoratif)
                  </option>
                </select>
              </div>

              {/* Sasaran & Durasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Sasaran Peserta / Kelas *"
                  placeholder="Misal: Siswa Kelas 4 MI"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  required
                />
                <Input
                  label="Durasi Pelaksanaan"
                  placeholder="Misal: 1 Bulan / 2 Pekan"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>

              {/* Pilihan Prinsip 9K */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Nilai 9K Kemenag yang Dikuatkan:
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {(formData.principles9K || []).length} terpilih
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {KBC_9K_VALUES.map((val) => {
                    const isSelected = formData.principles9K?.includes(val.name);
                    return (
                      <button
                        key={val.name}
                        type="button"
                        onClick={() => handleToggle9K(val.name)}
                        className={`text-[11px] px-2.5 py-1 rounded-xl border font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500 border-rose-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-rose-300'
                        }`}
                        title={val.desc}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {val.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tujuan & Instruksi Khusus */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Tujuan Spesifik & Catatan Khusus Guru
                </label>
                <textarea
                  rows={2}
                  value={formData.specificGoals || ''}
                  onChange={(e) => setFormData({ ...formData, specificGoals: e.target.value })}
                  placeholder="Misal: Ingin fokus pada budaya tolong menolong, menanam pohon berkah, atau mengatasi rasa minder anak..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none resize-none"
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
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold rounded-2xl shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    AI sedang merancang Program KBC...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Hasilkan Program Kurikulum Cinta
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Output & Preview Column */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm min-h-[580px] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/80 py-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
                Dokumen Panduan & Skenario KBC
              </CardTitle>
              <CardDescription className="text-xs">
                Format lengkap mencakup Latar Belakang, Tahapan Aksi, Refleksi, & Rubrik Observasi
              </CardDescription>
            </div>

            {generatedContent && (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="text-xs h-8 px-2.5 rounded-xl dark:border-slate-700"
                  title="Salin ke Clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline ml-1">{copied ? 'Tersalin' : 'Salin'}</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportWord}
                  className="text-xs h-8 px-2.5 rounded-xl dark:border-slate-700"
                  title="Download Word (.doc)"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline ml-1">Word</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrint}
                  className="text-xs h-8 px-2.5 rounded-xl dark:border-slate-700"
                  title="Cetak Dokumen"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline ml-1">Cetak</span>
                </Button>

                <Button
                  size="sm"
                  onClick={handleSaveArtifact}
                  className="text-xs h-8 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                  title="Simpan ke Arsip AI"
                >
                  {saved ? <Check className="w-3.5 h-3.5 mr-1" /> : <BookmarkPlus className="w-3.5 h-3.5 mr-1" />}
                  <span>{saved ? 'Tersimpan' : 'Simpan'}</span>
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-6 flex-1 flex flex-col justify-center">
            {isGenerating ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 animate-pulse">
                    <Heart className="w-8 h-8 fill-rose-500/30" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs animate-spin">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Menyusun Program Kurikulum Berbasis Cinta (KBC)...
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Mengintegrasikan 6 Pilar Cinta, 9 Nilai K Kemenag RI, serta skenario pembiasaan beradab dan kasih sayang.
                  </p>
                </div>
              </div>
            ) : generatedContent ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed font-sans overflow-x-auto space-y-3">
                <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-2xl flex items-center justify-between text-xs text-rose-900 dark:text-rose-200 mb-4 not-prose">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-600 fill-rose-500/30 shrink-0" />
                    <span className="font-semibold">
                      Standar KBC Kemenag RI &bullet; Terintegrasi KMA No. 450 (Pembaruan 2026/2027)
                    </span>
                  </div>
                  <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900/60">
                    Siap Pakai
                  </span>
                </div>
                <Markdown>{generatedContent}</Markdown>
              </div>
            ) : (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 text-rose-500 flex items-center justify-center">
                  <Heart className="w-8 h-8 fill-rose-500/20 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="max-w-md mx-auto">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Belum Ada Program KBC yang Dihasilkan
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Tentukan tema cinta utama, bentuk kegiatan, dan target sasaran siswa di kolom kiri, lalu klik tombol <strong>Hasilkan Program Kurikulum Cinta</strong>.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
