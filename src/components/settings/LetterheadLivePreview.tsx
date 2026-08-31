import React, { useState } from 'react';
import type { GeneralSettings } from '../../types/academic';
import { Eye, FileText, Award, Layers, CheckCircle2 } from 'lucide-react';

interface LetterheadLivePreviewProps {
  settings: Partial<GeneralSettings>;
}

export const LetterheadLivePreview: React.FC<LetterheadLivePreviewProps> = ({ settings }) => {
  const [previewMode, setPreviewMode] = useState<'surat' | 'dokumen' | 'rapor'>('surat');

  const schoolName = settings.schoolName || 'MI SYURIYAH PEBATAN';
  const logoMain = settings.logoURL || '/logo.svg';
  const logoFoundation = settings.logoFoundationURL;
  const stamp = settings.stampURL;
  const signature = settings.principalSignatureURL;
  const principal = settings.principalName || "H. AHMAD SYAFI'I, S.Pd.I";
  const principalNip = settings.principalNip || "197505122005011003";
  const city = settings.signaturePlace || settings.village || 'Pebatan';
  const line1 = settings.letterheadLine1 || settings.foundationName || 'YAYASAN PENDIDIKAN DAN SOSIAL SYURIYAH';
  const line2 = settings.letterheadLine2 || 'KANTOR KEMENTERIAN AGAMA KABUPATEN SUBANG';
  const line3 = settings.letterheadLine3 || schoolName.toUpperCase();
  const line4 = settings.letterheadLine4 || `${settings.address || 'Jl. KH. Syuriyah No. 12, Pebatan, Kec. Pusakajaya, Kab. Subang 41255'} | Telp: ${settings.phone || '(0260) 123456'} | Email: ${settings.email || 'misyuriyahpebatan@gmail.com'}`;

  const todayDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Pratinjau Langsung Cetak Dokumen & Kop
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tampilan real-time hasil konfigurasi identitas, logo, cap, dan tanda tangan
            </p>
          </div>
        </div>

        {/* Document Type Selector Tabs */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setPreviewMode('surat')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              previewMode === 'surat'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Kop Surat</span>
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('dokumen')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              previewMode === 'dokumen'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Perangkat Ajar</span>
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('rapor')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              previewMode === 'rapor'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Rapor Siswa</span>
          </button>
        </div>
      </div>

      {/* Simulated A4 Paper Layout Container */}
      <div className="bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl flex justify-center overflow-x-auto">
        <div className="w-full max-w-2xl bg-white text-slate-900 shadow-xl rounded-lg p-6 sm:p-8 font-serif border border-slate-200 print:shadow-none print:border-none">
          {/* 1. KOP SURAT RESMI HEADER */}
          <div className="flex items-center justify-between gap-4 pb-2">
            {/* Logo Utama Kiri */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
              <img
                src={logoMain}
                alt="Logo Madrasah"
                className="max-w-full max-h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.svg';
                }}
              />
            </div>

            {/* Teks Identitas Kop Tengah */}
            <div className="flex-1 text-center leading-tight">
              {line1 && (
                <p className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-800">
                  {line1}
                </p>
              )}
              {line2 && (
                <p className="text-[11px] sm:text-xs font-semibold tracking-wide uppercase text-slate-700 mt-0.5">
                  {line2}
                </p>
              )}
              <h1 className="text-base sm:text-xl font-extrabold tracking-tight uppercase text-slate-950 mt-1">
                {line3}
              </h1>
              <p className="text-[10px] sm:text-[11px] font-sans text-slate-600 mt-1">
                NSM: {settings.nsm || '111233290001'} &bull; NPSN: {settings.npsn || '60712345'} &bull; Akreditasi: {settings.accreditation || 'A (Unggul)'}
              </p>
              <p className="text-[9px] sm:text-[10px] font-sans text-slate-500 italic mt-0.5 leading-snug">
                {line4}
              </p>
            </div>

            {/* Logo Kanan (Yayasan/Kemenag) jika ada, atau spacer seimbang */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
              {logoFoundation ? (
                <img
                  src={logoFoundation}
                  alt="Logo Yayasan"
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 hidden sm:block"></div>
              )}
            </div>
          </div>

          {/* Garis Pembatas Kop Surat */}
          {settings.showDoubleLine !== false ? (
            <div className="my-2">
              <div className="w-full h-[3px] bg-black"></div>
              <div className="w-full h-[1px] bg-black mt-[2px]"></div>
            </div>
          ) : (
            <div className="w-full h-[2px] bg-black my-2"></div>
          )}

          {/* 2. BODY CONTENT BERDASARKAN MODE */}
          {previewMode === 'surat' && (
            <div className="pt-4 font-sans text-xs space-y-4 text-slate-800 leading-relaxed">
              <div className="flex justify-between items-start text-xs">
                <div>
                  <p>Nomor : 045/MI-SY/IV/{new Date().getFullYear()}</p>
                  <p>Lampiran : -</p>
                  <p>Perihal : <strong>Pemberitahuan Kegiatan Akademik & Administrasi</strong></p>
                </div>
                <div className="text-right">
                  <p>{city}, {todayDate}</p>
                  <p className="mt-1">Kepada Yth.</p>
                  <p className="font-bold">Bapak/Ibu Orang Tua / Wali Murid</p>
                  <p>Di Tempat</p>
                </div>
              </div>

              <p className="indent-6 text-justify">
                <em>Assalamu’alaikum Warahmatullahi Wabarakatuh</em>. Dengan rahmat Allah Yang Maha Kuasa, kami beritahukan bahwa seluruh rangkaian kegiatan belajar mengajar dan pelaporan akademik tahun pelajaran <strong>{settings.academicYear || '2026/2027'}</strong> semester <strong>{settings.semester || 'Ganjil'}</strong> berjalan sesuai dengan kurikulum yang telah ditetapkan.
              </p>
            </div>
          )}

          {previewMode === 'dokumen' && (
            <div className="pt-4 font-sans text-xs space-y-3 text-slate-800">
              <div className="text-center">
                <h2 className="text-sm font-bold uppercase tracking-wider underline">
                  MODUL AJAR KURIKULUM MERDEKA
                </h2>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Tahun Pelajaran {settings.academicYear || '2026/2027'} &bull; Semester {settings.semester || 'Ganjil'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">Satuan Pendidikan:</span>
                  <p className="font-bold">{schoolName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Mata Pelajaran:</span>
                  <p className="font-bold">Pendidikan Agama Islam (PAI)</p>
                </div>
                <div>
                  <span className="text-slate-500">Fase / Kelas:</span>
                  <p className="font-bold">Fase A / Kelas 1</p>
                </div>
                <div>
                  <span className="text-slate-500">Alokasi Waktu:</span>
                  <p className="font-bold">2 x 35 Menit (1 Pertemuan)</p>
                </div>
              </div>
            </div>
          )}

          {previewMode === 'rapor' && (
            <div className="pt-4 font-sans text-xs space-y-3 text-slate-800">
              <div className="text-center">
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  LAPORAN HASIL BELAJAR SISWA (RAPOR)
                </h2>
                <p className="text-[11px] text-slate-600">
                  Tahun Pelajaran: {settings.academicYear || '2026/2027'} | Semester: {settings.semester || 'Ganjil'}
                </p>
              </div>

              <div className="border border-slate-300 rounded overflow-hidden text-[11px]">
                <div className="bg-slate-100 font-bold p-2 border-b border-slate-300 grid grid-cols-12 gap-1">
                  <span className="col-span-1 text-center">No</span>
                  <span className="col-span-6">Mata Pelajaran</span>
                  <span className="col-span-2 text-center">Nilai</span>
                  <span className="col-span-3 text-center">Capaian</span>
                </div>
                <div className="p-2 border-b border-slate-200 grid grid-cols-12 gap-1 items-center">
                  <span className="col-span-1 text-center">1</span>
                  <span className="col-span-6 font-medium">Al-Qur'an Hadis</span>
                  <span className="col-span-2 text-center font-bold text-emerald-700">92</span>
                  <span className="col-span-3 text-center text-xs text-slate-600">Sangat Baik</span>
                </div>
                <div className="p-2 grid grid-cols-12 gap-1 items-center">
                  <span className="col-span-1 text-center">2</span>
                  <span className="col-span-6 font-medium">Bahasa Arab</span>
                  <span className="col-span-2 text-center font-bold text-emerald-700">88</span>
                  <span className="col-span-3 text-center text-xs text-slate-600">Baik</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. TANDA TANGAN & STEMPEL CAP RESMI */}
          <div className="mt-8 pt-4 flex justify-end font-sans">
            <div className="text-center relative min-w-[200px]">
              <p className="text-xs text-slate-700">
                {city}, {previewMode === 'rapor' ? (settings.reportDateGanjil ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(settings.reportDateGanjil)) : todayDate) : todayDate}
              </p>
              <p className="text-xs font-bold text-slate-800">
                Kepala {schoolName}
              </p>

              {/* Area Tanda Tangan & Stempel Cap */}
              <div className="h-20 my-1 relative flex items-center justify-center">
                {/* Tanda Tangan Digital */}
                {signature ? (
                  <img
                    src={signature}
                    alt="Tanda Tangan Kepala Sekolah"
                    className="max-h-16 object-contain z-10 select-none"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-[11px] text-slate-300 italic font-mono select-none">
                    [Tanda Tangan]
                  </div>
                )}

                {/* Stempel Cap Basah / Digital (Posisi overlapping alami di sebelah kiri TTD) */}
                {stamp && (
                  <img
                    src={stamp}
                    alt="Stempel Resmi Madrasah"
                    className="absolute -left-4 w-16 h-16 object-contain opacity-85 pointer-events-none z-0 transform -rotate-6 select-none"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              {/* Nama Kepala Sekolah & NIP */}
              <p className="text-xs font-extrabold uppercase underline tracking-wide text-slate-950">
                {principal}
              </p>
              <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                NIP. {principalNip}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Badges */}
      <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Otomatis sinkron dengan Rapor</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Format Standar Kemdikbudristek & Kemenag</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Resolusi Cetak Vektor & Rasio 100% Presisi</span>
        </div>
      </div>
    </div>
  );
};
