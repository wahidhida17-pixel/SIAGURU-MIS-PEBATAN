import React, { useState, useEffect } from 'react';
import { useSchoolSettings } from '../../../contexts/SchoolSettingsContext';
import { useAuth } from '../../../hooks/useAuth';
import { authService } from '../../../services/authService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ImageUploader } from '../../../components/settings/ImageUploader';
import { LetterheadLivePreview } from '../../../components/settings/LetterheadLivePreview';
import type { GeneralSettings, Semester } from '../../../types/academic';
import { 
  Building2, Image as ImageIcon, UserCheck, MapPin, 
  Calendar, FileText, Key, Save, RotateCcw, 
  CheckCircle2, AlertCircle, Sparkles, School, ShieldCheck, Mail,
  Heart, BookOpen, Check, Compass
} from 'lucide-react';

const PRESET_LOGOS = [
  {
    name: 'Logo MI Syuriyah (Default)',
    url: '/logo.svg',
    category: 'MI Syuriyah'
  },
  {
    name: 'Logo Kemenag RI (Ikhlas Beramal)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Kementerian_Agama_RI.svg/240px-Kementerian_Agama_RI.svg.png',
    category: 'Kementerian Agama'
  },
  {
    name: 'Logo Tut Wuri Handayani',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg/240px-Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg.png',
    category: 'Kemdikbudristek'
  },
  {
    name: 'Logo Garuda Pancasila',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Coat_of_arms_of_Indonesia_Garuda_Pancasila.svg/240px-Coat_of_arms_of_Indonesia_Garuda_Pancasila.svg.png',
    category: 'Nasional'
  }
];

export const SchoolSettings: React.FC = () => {
  const { settings, isLoading, updateSettings, resetToDefaults } = useSchoolSettings();
  const { currentUser, userProfile } = useAuth();

  const [formData, setFormData] = useState<GeneralSettings>(settings);
  const [activeTab, setActiveTab] = useState<
    'identitas' | 'logo' | 'pejabat' | 'alamat' | 'akademik' | 'kurikulum' | 'kop' | 'akun'
  >('identitas');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Account reset password states
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Sync state when settings context updates initially
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (field: keyof GeneralSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
    setSaveSuccess(false);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      await updateSettings(formData);
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setErrorMessage(err.message || 'Gagal menyimpan pengaturan sekolah.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan seluruh pengaturan ke standar awal MI Syuriyah Pebatan?')) {
      setIsSaving(true);
      try {
        await resetToDefaults();
        setIsDirty(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } catch (err: any) {
        setErrorMessage(err.message || 'Gagal memulihkan pengaturan awal.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    setResetLoading(true);
    setResetError(null);
    try {
      await authService.resetPassword(currentUser.email);
      setResetSent(true);
    } catch (err: any) {
      setResetError(err.message || 'Gagal mengirim tautan reset password.');
    } finally {
      setResetLoading(false);
    }
  };

  const tabs = [
    { id: 'identitas', label: 'Identitas Madrasah', icon: Building2 },
    { id: 'logo', label: 'Logo & Cap Stempel', icon: ImageIcon },
    { id: 'pejabat', label: 'Kepala Sekolah & Pejabat', icon: UserCheck },
    { id: 'alamat', label: 'Alamat & Kontak', icon: MapPin },
    { id: 'akademik', label: 'Tahun Pelajaran & Periode', icon: Calendar },
    { id: 'kurikulum', label: 'Kurikulum & KBC Kemenag', icon: Heart },
    { id: 'kop', label: 'Kop Surat & Cetak', icon: FileText },
    { id: 'akun', label: 'Pengaturan Akun', icon: Key },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
            <School className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Pengaturan Madrasah & Sekolah
              </h1>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                Lengkap
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Kelola identitas resmi, unggah logo & stempel cap basah, data kepala madrasah, kop surat, dan kalender akademik.
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSaving || isLoading}
            className="text-xs font-semibold dark:border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset Default
          </Button>

          <Button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving || isLoading}
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Pengaturan Berhasil Disimpan!
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Seluruh kop surat, rapor, header dokumen, dan logo telah diperbarui secara otomatis.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Tersimpan
          </span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Unsaved changes prompt bar */}
      {isDirty && !saveSuccess && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
              Terdapat perubahan yang belum disimpan. Jangan lupa klik tombol <strong>Simpan Perubahan</strong>.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => handleSave()}
            className="text-xs py-1 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold"
          >
            Simpan Sekarang
          </Button>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-1.5 bg-slate-200/70 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/40 dark:hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: IDENTITAS MADRASAH */}
      {activeTab === 'identitas' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                Identitas Resmi Madrasah / Satuan Pendidikan
              </CardTitle>
              <CardDescription>
                Informasi pokok yang akan dicetak pada buku rapor, surat dinas, dan kartu identitas siswa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nama Satuan Pendidikan / Madrasah"
                  placeholder="Contoh: MI Syuriyah Pebatan"
                  value={formData.schoolName}
                  onChange={(e) => handleChange('schoolName', e.target.value)}
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Jenjang Pendidikan
                  </label>
                  <select
                    value={formData.schoolLevel}
                    onChange={(e) => handleChange('schoolLevel', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  >
                    <option value="Madrasah Ibtidaiyah">Madrasah Ibtidaiyah (MI)</option>
                    <option value="Raudhatul Athfal">Raudhatul Athfal (RA)</option>
                    <option value="Madrasah Tsanawiyah">Madrasah Tsanawiyah (MTs)</option>
                    <option value="Madrasah Aliyah">Madrasah Aliyah (MA)</option>
                    <option value="Sekolah Dasar">Sekolah Dasar (SD)</option>
                    <option value="Sekolah Menengah Pertama">Sekolah Menengah Pertama (SMP)</option>
                    <option value="Sekolah Menengah Atas">Sekolah Menengah Atas (SMA)</option>
                    <option value="Sekolah Menengah Kejuruan">Sekolah Menengah Kejuruan (SMK)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Status Madrasah
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange('schoolStatus', 'Swasta')}
                      className={`py-2.5 px-4 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        formData.schoolStatus === 'Swasta' || !formData.schoolStatus
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Swasta (Yayasan)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('schoolStatus', 'Negeri')}
                      className={`py-2.5 px-4 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        formData.schoolStatus === 'Negeri'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Negeri (Kemenag/Pemda)
                    </button>
                  </div>
                </div>

                <Input
                  label="Nama Yayasan / Lembaga Penyelenggara"
                  placeholder="Contoh: Yayasan Pendidikan dan Sosial Syuriyah"
                  value={formData.foundationName || ''}
                  onChange={(e) => handleChange('foundationName', e.target.value)}
                />

                <Input
                  label="NPSN (Nomor Pokok Sekolah Nasional)"
                  placeholder="8 Digit NPSN (Contoh: 60712345)"
                  value={formData.npsn || ''}
                  onChange={(e) => handleChange('npsn', e.target.value)}
                />

                <Input
                  label="NSM / NSS (Nomor Statistik Madrasah)"
                  placeholder="12 Digit NSM (Contoh: 111233290001)"
                  value={formData.nsm || ''}
                  onChange={(e) => handleChange('nsm', e.target.value)}
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Status Akreditasi
                  </label>
                  <select
                    value={formData.accreditation || 'A (Unggul)'}
                    onChange={(e) => handleChange('accreditation', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  >
                    <option value="A (Unggul)">A (Unggul / Sangat Baik)</option>
                    <option value="B (Baik)">B (Baik)</option>
                    <option value="C (Cukup)">C (Cukup)</option>
                    <option value="Belum Terakreditasi">Belum Terakreditasi</option>
                  </select>
                </div>

                <Input
                  label="Nomor SK Akreditasi (BAN-SM / Kemenag)"
                  placeholder="Contoh: 134/BAN-SM/SK/2023"
                  value={formData.accreditationNo || ''}
                  onChange={(e) => handleChange('accreditationNo', e.target.value)}
                />

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Kurikulum Utama yang Diterapkan
                  </label>
                  <select
                    value={formData.curriculum || 'Kurikulum Merdeka'}
                    onChange={(e) => handleChange('curriculum', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  >
                    <option value="Kurikulum Merdeka">Kurikulum Merdeka (KMA 450 Tahun 2024 / Permendikbudristek No. 12 Tahun 2024)</option>
                    <option value="Kurikulum 2013 (K13)">Kurikulum 2013 (K13 Madrasah Revisi)</option>
                    <option value="Kurikulum Kombinasi / Transisi">Kurikulum Kombinasi / Transisi</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 2: LOGO & CAP STEMPEL */}
      {activeTab === 'logo' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                Manajemen Logo Utama Madrasah
              </CardTitle>
              <CardDescription>
                Logo ini akan ditampilkan pada navigasi samping, kop surat resmi, lembar rapor, kartu ujian, dan cetak modul.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader
                label="Logo Utama Madrasah / Sekolah"
                sublabel="Disarankan menggunakan format PNG transparan dengan resolusi tajam."
                value={formData.logoURL}
                onChange={(newUrl) => handleChange('logoURL', newUrl)}
                presetOptions={PRESET_LOGOS}
                placeholderText="Tarik dan lepas logo madrasah di sini atau klik untuk memilih"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Sekunder / Logo Yayasan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <School className="w-4 h-4 text-emerald-600" />
                  Logo Yayasan / Kemenag (Opsional)
                </CardTitle>
                <CardDescription className="text-xs">
                  Akan ditampilkan di sebelah kanan kop surat bila diaktifkan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  label="Logo Yayasan / Lembaga"
                  sublabel="Ditampilkan pada kop surat kanan."
                  value={formData.logoFoundationURL || ''}
                  onChange={(val) => handleChange('logoFoundationURL', val)}
                  presetOptions={PRESET_LOGOS}
                  placeholderText="Pilih logo yayasan atau kemenag"
                />
              </CardContent>
            </Card>

            {/* Stempel Cap Basah / Digital */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Stempel / Cap Resmi Madrasah
                </CardTitle>
                <CardDescription className="text-xs">
                  Gunakan gambar PNG transparan cap stempel untuk pengesahan otomatis lembar rapor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  label="Stempel Cap Digital"
                  sublabel="Format PNG dengan latar transparan disarankan."
                  value={formData.stampURL || ''}
                  onChange={(val) => handleChange('stampURL', val)}
                  placeholderText="Unggah stempel resmi madrasah"
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Icon Aplikasi PWA */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  Icon Aplikasi (PWA / Mobile)
                </CardTitle>
                <CardDescription className="text-xs">
                  Ikon persegi (resolusi 512x512) untuk ikon aplikasi di perangkat seluler (Home Screen).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  label="Icon Aplikasi (1:1)"
                  sublabel="Disarankan rasio 1:1 format PNG atau WebP."
                  value={formData.appIconURL || ''}
                  onChange={(val) => handleChange('appIconURL', val)}
                  placeholderText="Unggah icon aplikasi"
                />
              </CardContent>
            </Card>

            {/* Favicon Browser */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  Favicon Website (Browser)
                </CardTitle>
                <CardDescription className="text-xs">
                  Ikon kecil yang muncul di tab browser Anda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  label="Favicon (1:1)"
                  sublabel="Disarankan rasio 1:1 format PNG / ICO."
                  value={formData.faviconURL || ''}
                  onChange={(val) => handleChange('faviconURL', val)}
                  placeholderText="Unggah favicon browser"
                />
              </CardContent>
            </Card>
          </div>

          {/* Tanda Tangan Digital Kepala Sekolah */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Tanda Tangan Digital Kepala Madrasah
              </CardTitle>
              <CardDescription className="text-xs">
                Digunakan untuk otomatisasi tanda tangan kepala madrasah pada pencetakan dokumen legal & buku rapor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader
                label="Tanda Tangan Digital (TTD)"
                sublabel="Disarankan berupa coretan tanda tangan berlatar belakang transparan (PNG)."
                value={formData.principalSignatureURL || ''}
                onChange={(val) => handleChange('principalSignatureURL', val)}
                aspectRatio="wide"
                placeholderText="Unggah scan tanda tangan kepala sekolah"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 3: KEPALA SEKOLAH & PEJABAT */}
      {activeTab === 'pejabat' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                Data Kepala Madrasah & Pejabat Sekolah
              </CardTitle>
              <CardDescription>
                Pejabat yang berwenang menandatangani surat keputusan, kalender akademik, dan buku rapor siswa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nama Lengkap Kepala Madrasah (Beserta Gelar)"
                  placeholder="Contoh: H. AHMAD SYAFI'I, S.Pd.I"
                  value={formData.principalName || ''}
                  onChange={(e) => handleChange('principalName', e.target.value)}
                  required
                />

                <Input
                  label="NIP / NPK / NUPTK Kepala Madrasah"
                  placeholder="Contoh: 197505122005011003 atau -"
                  value={formData.principalNip || ''}
                  onChange={(e) => handleChange('principalNip', e.target.value)}
                />

                <Input
                  label="Kota / Tempat Titimangsa Tanda Tangan"
                  placeholder="Contoh: Pebatan atau Subang"
                  value={formData.signaturePlace || ''}
                  onChange={(e) => handleChange('signaturePlace', e.target.value)}
                />

                <Input
                  label="Nama Wakil Kepala Madrasah / Kurikulum"
                  placeholder="Contoh: Wahid Hidayat, S.Pd"
                  value={formData.vicePrincipalName || ''}
                  onChange={(e) => handleChange('vicePrincipalName', e.target.value)}
                />

                <Input
                  label="Nama Bendahara Madrasah / Tata Usaha"
                  placeholder="Contoh: Siti Masitoh, S.Pd"
                  value={formData.treasurerName || ''}
                  onChange={(e) => handleChange('treasurerName', e.target.value)}
                />

                <Input
                  label="Nama Ketua Komite Madrasah"
                  placeholder="Contoh: H. Mustofa, M.Ag"
                  value={formData.committeeHeadName || ''}
                  onChange={(e) => handleChange('committeeHeadName', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 4: ALAMAT & KONTAK LENGKAP */}
      {activeTab === 'alamat' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                Alamat Geografis & Kontak Resmi
              </CardTitle>
              <CardDescription>
                Detail lokasi fisik dan kontak komunikasi resmi madrasah.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Alamat Jalan / Blok / Dusun"
                    placeholder="Contoh: Jl. KH. Syuriyah No. 12, Dusun Pebatan"
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    required
                  />
                </div>

                <Input
                  label="RT / RW"
                  placeholder="Contoh: 003/002"
                  value={formData.rtRw || ''}
                  onChange={(e) => handleChange('rtRw', e.target.value)}
                />

                <Input
                  label="Desa / Kelurahan"
                  placeholder="Contoh: Pebatan"
                  value={formData.village || ''}
                  onChange={(e) => handleChange('village', e.target.value)}
                />

                <Input
                  label="Kecamatan"
                  placeholder="Contoh: Pusakajaya"
                  value={formData.district || ''}
                  onChange={(e) => handleChange('district', e.target.value)}
                />

                <Input
                  label="Kabupaten / Kota"
                  placeholder="Contoh: Kab. Subang"
                  value={formData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                />

                <Input
                  label="Provinsi"
                  placeholder="Contoh: Jawa Barat"
                  value={formData.province || ''}
                  onChange={(e) => handleChange('province', e.target.value)}
                />

                <Input
                  label="Kode Pos"
                  placeholder="Contoh: 41255"
                  value={formData.postalCode || ''}
                  onChange={(e) => handleChange('postalCode', e.target.value)}
                />

                <Input
                  label="Nomor Telepon / WhatsApp Madrasah"
                  placeholder="Contoh: (0260) 123456 atau 08123456789"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  required
                />

                <Input
                  label="Nomor Fax (Opsional)"
                  placeholder="Contoh: (0260) 123457"
                  value={formData.fax || ''}
                  onChange={(e) => handleChange('fax', e.target.value)}
                />

                <Input
                  label="Email Resmi Madrasah"
                  type="email"
                  placeholder="Contoh: misyuriyahpebatan@gmail.com"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />

                <Input
                  label="Website / Portal Resmi"
                  type="url"
                  placeholder="Contoh: https://misyuriyahpebatan.sch.id"
                  value={formData.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 5: TAHUN AJARAN & PERIODE AKADEMIK */}
      {activeTab === 'akademik' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                Tahun Pelajaran & Semester Aktif
              </CardTitle>
              <CardDescription>
                Pengaturan periode yang berlaku untuk seluruh pengisian nilai, presensi harian, dan modul ajar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Tahun Pelajaran Aktif"
                  placeholder="Contoh: 2026/2027"
                  value={formData.academicYear}
                  onChange={(e) => handleChange('academicYear', e.target.value)}
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Semester Aktif
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange('semester', 'Ganjil' as Semester)}
                      className={`py-2.5 px-4 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        formData.semester === 'Ganjil'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Semester Ganjil (1)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('semester', 'Genap' as Semester)}
                      className={`py-2.5 px-4 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        formData.semester === 'Genap'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Semester Genap (2)
                    </button>
                  </div>
                </div>

                <Input
                  label="Tanggal Mulai Semester"
                  type="date"
                  value={formData.semesterStartDate || ''}
                  onChange={(e) => handleChange('semesterStartDate', e.target.value)}
                />

                <Input
                  label="Tanggal Akhir Semester"
                  type="date"
                  value={formData.semesterEndDate || ''}
                  onChange={(e) => handleChange('semesterEndDate', e.target.value)}
                />

                <Input
                  label="Tanggal Titimangsa Pembagian Rapor Semester Ganjil"
                  type="date"
                  value={formData.reportDateGanjil || ''}
                  onChange={(e) => handleChange('reportDateGanjil', e.target.value)}
                />

                <Input
                  label="Tanggal Titimangsa Pembagian Rapor Semester Genap"
                  type="date"
                  value={formData.reportDateGenap || ''}
                  onChange={(e) => handleChange('reportDateGenap', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: KURIKULUM KMA 450 (2026) & KURIKULUM BERBASIS CINTA (KBC) KEMENAG */}
      {activeTab === 'kurikulum' && (
        <div className="space-y-6">
          {/* Banner Kurikulum */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-emerald-500/10 border border-rose-200/80 dark:border-rose-900/40 space-y-3">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6 fill-rose-500/30 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Kurikulum Merdeka Madrasah (KMA Terkini) & Kurikulum Berbasis Cinta (KBC)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200">
                    Edisi 2026/2027
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                    Resmi Kemenag RI
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Integrasi panduan Keputusan Menteri Agama (KMA) No. 450 Tahun 2024 / Edisi Pembaruan 2026 dengan Gerakan <strong>Kurikulum Berbasis Cinta (KBC) Kemenag RI</strong> yang berlandaskan 9 Prinsip K dan 6 Pilar Mahabbah (Cinta). Pengaturan ini akan disinkronkan ke seluruh AI Generator Modul Ajar, Bank Soal, Rubrik KKTP, dan Deskripsi Rapor.
                </p>
              </div>
            </div>
          </div>

          {/* Standar Kurikulum Utama */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                Standar Pedoman Kurikulum Madrasah
              </CardTitle>
              <CardDescription>
                Pilih pedoman kurikulum yang menjadi acuan penyusunan Kurikulum Operasional Madrasah (KOM).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Pedoman Kurikulum yang Diberlakukan
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'KMA 450 Tahun 2024 (Edisi Pembaruan 2026/2027)',
                      title: 'KMA 450 (Pembaruan 2026/2027)',
                      desc: 'Pedoman IKM Madrasah resmi Kemenag + CP BSKAP 032/2024 (Rekomendasi Utama)',
                      recommended: true
                    },
                    {
                      id: 'Kurikulum Merdeka Mandiri Berbagi',
                      title: 'Kurikulum Merdeka Mandiri',
                      desc: 'Implementasi mandiri standar Kemendikbudristek & Kemenag',
                      recommended: false
                    },
                    {
                      id: 'Kurikulum 2013 Revisi',
                      title: 'Kurikulum 2013 Terpadu',
                      desc: 'Format K13 dengan struktur KI/KD untuk kelas transisi',
                      recommended: false
                    }
                  ].map((item) => {
                    const isSelected = (formData.curriculum || 'KMA 450 Tahun 2024 (Edisi Pembaruan 2026/2027)') === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleChange('curriculum', item.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 dark:border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {item.title}
                            </span>
                            {item.recommended && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-600 text-white">
                                Kemenag 2026
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-semibold text-slate-500">
                            {isSelected ? 'Aktif Terpasang' : 'Klik untuk Pilih'}
                          </span>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isSelected ? 'bg-emerald-600 text-white' : 'border border-slate-300 dark:border-slate-600'}`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Konfigurasi Kurikulum Berbasis Cinta (KBC) Kemenag */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
                  Integrasi Kurikulum Berbasis Cinta (KBC) Kemenag RI
                </CardTitle>
                <CardDescription>
                  Aktifkan pembiasaan ekosistem madrasah berlandaskan kasih sayang, humanisme religius, dan anti kekerasan.
                </CardDescription>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.kbcEnabled !== false}
                  onChange={(e) => handleChange('kbcEnabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-rose-500"></div>
              </label>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 6 Tema Cinta KBC */}
              <div className="space-y-2.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Fokus 6 Pilar Cinta KBC Kemenag yang Dibiasakan di Madrasah:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'Cinta Allah SWT (Mahabbah Ilahiyyah)',
                      title: '1. Cinta Allah SWT',
                      sub: 'Ibadah ikhlas, tadarus, dzikir, & rasa syukur mendalam'
                    },
                    {
                      id: 'Cinta Rasulullah SAW (Mahabbah Nabawiyyah)',
                      title: '2. Cinta Rasulullah SAW',
                      sub: 'Keteladanan akhlak (Qudwah), shalawat, & sunnah nabi'
                    },
                    {
                      id: 'Cinta Diri Sendiri (Mahabbah Nafsiyyah)',
                      title: '3. Cinta Diri Sendiri',
                      sub: 'Kesehatan fisik & mental, percaya diri, & menjaga kehormatan'
                    },
                    {
                      id: 'Cinta Sesama Manusia (Mahabbah Insaniyyah)',
                      title: '4. Cinta Sesama Manusia',
                      sub: 'Empati, anti-perundungan (bullying), toleransi, & tolong-menolong'
                    },
                    {
                      id: 'Cinta Lingkungan & Alam (Mahabbah Bi\'iyyah)',
                      title: '5. Cinta Lingkungan & Alam',
                      sub: 'Madrasah adiwiyata, bersih sampah, menanam pohon, & hemat energi'
                    },
                    {
                      id: 'Cinta Bangsa & Tanah Air (Hubbul Wathan)',
                      title: '6. Cinta Bangsa & Tanah Air',
                      sub: 'Moderasi beragama, nasionalisme, persatuan NKRI, & kebinekaan'
                    }
                  ].map((theme) => {
                    const currentThemes = formData.kbcFocusThemes || [
                      'Cinta Allah SWT (Mahabbah Ilahiyyah)',
                      'Cinta Rasulullah SAW (Mahabbah Nabawiyyah)',
                      'Cinta Diri Sendiri (Mahabbah Nafsiyyah)',
                      'Cinta Sesama Manusia (Mahabbah Insaniyyah)',
                      'Cinta Lingkungan & Alam (Mahabbah Bi\'iyyah)',
                      'Cinta Bangsa & Tanah Air (Hubbul Wathan)'
                    ];
                    const isChecked = currentThemes.includes(theme.id);

                    const toggleTheme = () => {
                      let updated: string[];
                      if (isChecked) {
                        updated = currentThemes.filter((t) => t !== theme.id);
                      } else {
                        updated = [...currentThemes, theme.id];
                      }
                      handleChange('kbcFocusThemes', updated);
                    };

                    return (
                      <div
                        key={theme.id}
                        onClick={toggleTheme}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isChecked
                            ? 'border-rose-400/80 bg-rose-50/70 dark:bg-rose-950/30 dark:border-rose-800 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-60'
                        }`}
                      >
                        <div className={`w-4 h-4 mt-0.5 rounded-md flex items-center justify-center shrink-0 ${isChecked ? 'bg-rose-500 text-white' : 'border border-slate-300 dark:border-slate-600'}`}>
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {theme.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            {theme.sub}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Catatan / Visi Cinta Madrasah */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Catatan Pembiasaan Budaya Cinta & Penguatan Karakter Madrasah:
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors placeholder:text-slate-400"
                  placeholder="Contoh: Pembiasaan Senyum Salam Sapa (3S), Gerakan Sedekah Subuh, Infak Jumat Berkah, Apresiasi Sahabat Peduli, dan Sekolah Ramah Anak Bebas Bullying."
                  value={formData.kbcNotes || ''}
                  onChange={(e) => handleChange('kbcNotes', e.target.value)}
                />
              </div>

              {/* Rangkuman 9 Nilai K Kemenag */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    9 Prinsip Kemenag dalam Kurikulum Berbasis Cinta (9K)
                  </h4>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 text-center text-[10px] font-bold">
                  {['Keberagaman', 'Kebersamaan', 'Kekeluargaan', 'Kemandirian', 'Kesetaraan', 'Kebermanfaatan', 'Kejujuran', 'Keikhlasan', 'Kesinambungan'].map((k) => (
                    <div key={k} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      {k}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 6: KOP SURAT & CETAK DOKUMEN + LIVE PREVIEW */}
      {activeTab === 'kop' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                Format Teks Header & Kop Surat Resmi
              </CardTitle>
              <CardDescription>
                Sesuaikan teks 4-baris kop surat standar madrasah untuk cetak dokumen dan pengumuman resmi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Input
                  label="Kop Baris 1 (Instansi Atas / Yayasan)"
                  placeholder="Contoh: YAYASAN PENDIDIKAN DAN SOSIAL SYURIYAH"
                  value={formData.letterheadLine1 || ''}
                  onChange={(e) => handleChange('letterheadLine1', e.target.value)}
                />

                <Input
                  label="Kop Baris 2 (Instansi Wilayah / Kemenag)"
                  placeholder="Contoh: KANTOR KEMENTERIAN AGAMA KABUPATEN SUBANG"
                  value={formData.letterheadLine2 || ''}
                  onChange={(e) => handleChange('letterheadLine2', e.target.value)}
                />

                <Input
                  label="Kop Baris 3 (Nama Satuan Pendidikan / Madrasah)"
                  placeholder="Contoh: MADRASAH IBTIDAIYAH SYURIYAH PEBATAN"
                  value={formData.letterheadLine3 || ''}
                  onChange={(e) => handleChange('letterheadLine3', e.target.value)}
                />

                <Input
                  label="Kop Baris 4 (Alamat, Kontak & Web)"
                  placeholder="Contoh: Jl. KH. Syuriyah No. 12, Pebatan, Kec. Pusakajaya, Kab. Subang 41255 | Telp: (0260) 123456"
                  value={formData.letterheadLine4 || ''}
                  onChange={(e) => handleChange('letterheadLine4', e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <input
                      id="showDoubleLine"
                      type="checkbox"
                      checked={formData.showDoubleLine !== false}
                      onChange={(e) => handleChange('showDoubleLine', e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="showDoubleLine" className="text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                      Garis Ganda Tebal & Tipis di Bawah Kop
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <input
                      id="autoStampInReports"
                      type="checkbox"
                      checked={formData.autoStampInReports !== false}
                      onChange={(e) => handleChange('autoStampInReports', e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="autoStampInReports" className="text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                      Sertakan Stempel Digital Otomatis pada Lembar Pengesahan
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Live Preview Component */}
          <LetterheadLivePreview settings={formData} />
        </div>
      )}

      {/* TAB CONTENT 7: PENGATURAN AKUN */}
      {activeTab === 'akun' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-slate-500" />
                    Informasi Pengguna
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nama Pengguna</label>
                    <p className="text-slate-900 dark:text-slate-100 font-bold mt-1 text-sm">{userProfile?.name || userProfile?.displayName || 'Administrator'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Peran / Hak Akses</label>
                    <div className="mt-1 inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {userProfile?.role || 'Admin'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="w-5 h-5 text-slate-500" />
                    Alamat Email Administrator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Terdaftar</label>
                    <Input 
                      value={currentUser?.email || ''} 
                      readOnly 
                      disabled
                      className="bg-slate-50 dark:bg-slate-900"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Alamat email ini digunakan untuk login dan menerima notifikasi sistem SIAGURU.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="w-5 h-5 text-slate-500" />
                    Keamanan & Reset Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Reset Password Administrator</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                      Kirimkan tautan aman ke email terdaftar (<strong>{currentUser?.email}</strong>) untuk mengatur kata sandi baru.
                    </p>
                    
                    {resetError && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs font-medium">
                        {resetError}
                      </div>
                    )}
                    
                    {resetSent ? (
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
                        <CheckCircle2 className="w-5 h-5" />
                        Tautan reset password berhasil dikirim ke email Anda!
                      </div>
                    ) : (
                      <Button 
                        onClick={handlePasswordReset} 
                        disabled={resetLoading}
                        variant="outline"
                        className="w-full sm:w-auto dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {resetLoading ? 'Mengirim Tautan...' : 'Kirim Tautan Reset Password'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
