import React, { useState, useEffect } from 'react';
import {
  Mail,
  Plus,
  FileText,
  Download,
  Trash2,
  Search,
  Users,
  Shield,
  Printer,
  X,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { letterService } from '../../../services/letterService';
import { teacherService } from '../../../services/teacherService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { OfficialLetter, OfficialLetterType } from '../../../types/document';
import type { Teacher } from '../../../types/teacher';

export const AdminLettersView: React.FC = () => {
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [letters, setLetters] = useState<OfficialLetter[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<OfficialLetterType>('Surat Tugas');
  const [regarding, setRegarding] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [letterDate, setLetterDate] = useState('2026-08-29');
  const [signedByName, setSignedByName] = useState('Ahmad Fauzi, S.Pd.I');
  const [signedByNip, setSignedByNip] = useState('198205142010011012');
  const [content, setContent] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Print Preview
  const [printLetter, setPrintLetter] = useState<OfficialLetter | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lList, tList] = await Promise.all([
        letterService.getLetters(),
        teacherService.getAll()
      ]);
      setLetters(lList);
      setTeachers(tList);
    } catch (e) {
      console.error('Error loading letters:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setTitle('');
    setType('Surat Tugas');
    setRegarding('');
    setTargetUserId('');
    setContent('');
    setUploadedFile(null);
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !regarding.trim()) return;

    try {
      setIsSubmitting(true);
      const targetTeacher = teachers.find(t => t.id === targetUserId);
      const generatedNumber = letterService.generateLetterNumber(type, letters.length + 1);

      await letterService.createLetter(
        {
          letterNumber: generatedNumber,
          type,
          title: title.trim(),
          regarding: regarding.trim(),
          letterDate,
          signedByName,
          signedByNip,
          targetUserId: targetUserId || undefined,
          targetUserName: targetTeacher ? targetTeacher.name : 'Seluruh Dewan Guru & Karyawan',
          content: content.trim(),
          academicYear: '2026/2027',
          semester: 'Ganjil',
          createdBy: userProfile!.uid,
          createdByName: userProfile!.name
        },
        uploadedFile || undefined,
        userProfile
      );

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat surat resmi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (l: OfficialLetter) => {
    if (window.confirm(`Hapus surat nomor "${l.letterNumber}"?`)) {
      await letterService.deleteLetter(l.id!, userProfile);
      fetchData();
    }
  };

  const filtered = letters.filter(l => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !l.title.toLowerCase().includes(q) &&
        !l.letterNumber.toLowerCase().includes(q) &&
        !l.regarding.toLowerCase().includes(q) &&
        !(l.targetUserName || '').toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (typeFilter !== 'all' && l.type !== typeFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="text-xs text-slate-500 mt-2">Memuat register surat & administrasi madrasah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Administrasi Surat Resmi Madrasah
          </h1>
          <p className="text-xs text-slate-500">
            Register Surat Tugas, Surat Undangan, Surat Edaran, Surat Keterangan, dan Penomoran Otomatis MI Syuriyah Pebatan
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> + Buat Surat Resmi Baru
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nomor surat, judul, perihal, atau tujuan..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="sm:w-56 shrink-0">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Jenis Surat</option>
            <option value="Surat Tugas">Surat Tugas</option>
            <option value="Surat Undangan">Surat Undangan</option>
            <option value="Surat Keterangan">Surat Keterangan</option>
            <option value="Surat Edaran">Surat Edaran</option>
            <option value="Surat Masuk">Surat Masuk</option>
            <option value="Surat Keluar">Surat Keluar</option>
          </select>
        </div>
      </div>

      {/* Letters Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Nomor & Tanggal</th>
                <th className="py-3 px-4">Jenis Surat</th>
                <th className="py-3 px-4">Perihal & Judul</th>
                <th className="py-3 px-4">Ditujukan Kepada</th>
                <th className="py-3 px-4">Penandatangan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(l => (
                <tr
                  key={l.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{l.letterNumber}</p>
                    <span className="text-[10px] text-slate-400 font-sans">
                      {new Date(l.letterDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                      {l.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{l.title}</p>
                    <span className="text-[11px] text-slate-500 line-clamp-1">{l.regarding}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                    {l.targetUserName || 'Umum'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {l.signedByName}
                    </p>
                    <span className="text-[10px]">NIP: {l.signedByNip}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setPrintLetter(l)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        title="Lihat / Cetak Surat"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {l.attachmentUrl && (
                        <a
                          href={l.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          title="Unduh Berkas Lampiran"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(l)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                        title="Hapus Surat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Buat Surat */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Buat Surat Resmi Madrasah
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Surat <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Surat Tugas">Surat Tugas</option>
                    <option value="Surat Undangan">Surat Undangan</option>
                    <option value="Surat Keterangan">Surat Keterangan</option>
                    <option value="Surat Edaran">Surat Edaran</option>
                    <option value="Surat Keluar">Surat Keluar</option>
                    <option value="Surat Masuk">Surat Masuk</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Surat
                  </label>
                  <input
                    type="date"
                    required
                    value={letterDate}
                    onChange={e => setLetterDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Surat <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: Surat Tugas Mengikuti Workshop Kurikulum Merdeka"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Perihal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regarding}
                  onChange={e => setRegarding(e.target.value)}
                  placeholder="Contoh: Penugasan Pelatihan Implementasi Kurikulum Merdeka Kemenag"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ditujukan Kepada (Pilih Guru / Kosongkan untuk Umum)
                </label>
                <select
                  value={targetUserId}
                  onChange={e => setTargetUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Seluruh Dewan Guru & Karyawan (Umum) --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.nip || 'Guru'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Penandatangan
                  </label>
                  <input
                    type="text"
                    value={signedByName}
                    onChange={e => setSignedByName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NIP Penandatangan
                  </label>
                  <input
                    type="text"
                    value={signedByNip}
                    onChange={e => setSignedByNip(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Isi / Uraian Surat
                </label>
                <textarea
                  rows={3}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Menugaskan kepada guru tertera untuk hadir pada kegiatan..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Upload Berkas Scan / PDF (Opsional)
                </label>
                <input
                  type="file"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadedFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Terbitkan Surat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {printLetter && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl p-8 space-y-6 print:m-0 print:p-0">
            <div className="flex justify-between items-center border-b pb-4 print:hidden">
              <span className="font-bold text-sm text-slate-700">Format Pratinjau Surat Resmi</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak / Simpan PDF
                </button>
                <button
                  onClick={() => setPrintLetter(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Kop Surat Madrasah */}
            <div className="flex items-center gap-4 border-b-2 border-black pb-3">
              <div className="w-16 h-16 shrink-0">
                <img 
                  src="/logo.svg" 
                  alt="Logo MI Syuriyah" 
                  className="w-16 h-16 object-contain rounded-full" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 text-center space-y-0.5">
                <h2 className="text-sm font-bold tracking-wider">
                  YAYASAN PENDIDIKAN ISLAM SYURIYAH
                </h2>
                <h1 className="text-lg font-black tracking-tight">
                  MADRASAH IBTIDAIYAH (MI) SYURIYAH PEBATAN
                </h1>
                <p className="text-[11px] text-slate-600">
                  Jl. Raya Pebatan No. 12, Kec. Brebes, Kab. Brebes, Jawa Tengah 52212
                </p>
                <p className="text-[10px] text-slate-500">
                  NSM: 111233290045 | NPSN: 60712345 | Email: misyuriyahpebatan@kemenag.go.id
                </p>
              </div>
              <div className="w-16 h-16 shrink-0 hidden sm:block"></div>
            </div>

            {/* Nomor & Perihal */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <div>
                  <p><strong>Nomor</strong> : {printLetter.letterNumber}</p>
                  <p><strong>Lampiran</strong> : -</p>
                  <p><strong>Perihal</strong> : {printLetter.regarding}</p>
                </div>
                <div className="text-right">
                  <p>Pebatan, {new Date(printLetter.letterDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </div>

            {/* Tujuan */}
            <div className="text-xs pt-2">
              <p>Kepada Yth.</p>
              <p className="font-bold">{printLetter.targetUserName}</p>
              <p>Di Tempat</p>
            </div>

            {/* Isi Surat */}
            <div className="text-xs space-y-3 leading-relaxed text-justify py-2">
              <p><em>Assalamu'alaikum Warahmatullahi Wabarakatuh</em></p>
              <p>{printLetter.content || `Dengan hormat, sehubungan dengan pelaksanaan kegiatan ${printLetter.title}, maka Kepala Madrasah menugaskan kepada yang bersangkutan untuk dapat mengikuti kegiatan tersebut dengan penuh tanggung jawab.`}</p>
              <p>Demikian surat ini dibuat untuk dapat dipergunakan sebagaimana mestinya. Atas perhatian dan kerjasamanya diucapkan terima kasih.</p>
              <p><em>Wassalamu'alaikum Warahmatullahi Wabarakatuh</em></p>
            </div>

            {/* Tanda Tangan */}
            <div className="pt-6 flex justify-end text-xs text-right">
              <div className="w-56 space-y-12">
                <div>
                  <p>Kepala MI Syuriyah Pebatan</p>
                </div>
                <div>
                  <p className="font-bold underline">{printLetter.signedByName}</p>
                  <p>NIP. {printLetter.signedByNip}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
