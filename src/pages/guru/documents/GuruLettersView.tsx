import React, { useState, useEffect } from 'react';
import {
  Mail,
  FileText,
  Download,
  Eye,
  Calendar,
  User,
  Search,
  ExternalLink,
  Shield,
  Clock
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { letterService } from '../../../services/letterService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { OfficialLetter } from '../../../types/document';

export const GuruLettersView: React.FC = () => {
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [letters, setLetters] = useState<OfficialLetter[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<OfficialLetter | null>(null);

  useEffect(() => {
    fetchLetters();
  }, [userProfile?.uid]);

  const fetchLetters = async () => {
    if (!userProfile) return;
    try {
      setLoading(true);
      const list = await letterService.getLetters({
        targetUserId: userProfile.uid
      });
      setLetters(list);
    } catch (e) {
      console.error('Error loading letters:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = letters.filter(l => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !l.title.toLowerCase().includes(q) &&
        !l.letterNumber.toLowerCase().includes(q) &&
        !l.regarding.toLowerCase().includes(q)
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
        <p className="text-xs text-slate-500 mt-2">Memuat arsip surat resmi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          Surat Resmi & Administrasi
        </h1>
        <p className="text-xs text-slate-500">
          Daftar Surat Tugas, Surat Undangan, Surat Keterangan Mengajar, dan Surat Edaran Madrasah
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nomor surat, perihal, atau tujuan..."
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
          </select>
        </div>
      </div>

      {/* Letters List / Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          Belum ada arsip surat resmi yang ditujukan kepada Anda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(letter => (
            <div
              key={letter.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                    {letter.type}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    No: {letter.letterNumber}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {letter.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    Perihal: {letter.regarding}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 text-[11px] space-y-1 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Tertanda:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{letter.signedByName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal Surat:</span>
                    <span>{new Date(letter.letterDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tahun Pelajaran:</span>
                    <span>{letter.academicYear} ({letter.semester})</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Terverifikasi Madrasah
                </span>

                {letter.attachmentUrl ? (
                  <a
                    href={letter.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh Surat
                  </a>
                ) : (
                  <button
                    onClick={() => alert(`Format cetak resmi untuk "${letter.title}" siap diunduh.`)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" /> Lihat Format
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
