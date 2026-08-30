import React, { useState, useEffect } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  FileText,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { documentService } from '../../../services/documentService';
import { storageService } from '../../../services/storageService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { DocumentItem } from '../../../types/document';

export const GuruTrashView: React.FC = () => {
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [trashDocs, setTrashDocs] = useState<DocumentItem[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTrash();
  }, [userProfile?.uid]);

  const fetchTrash = async () => {
    if (!userProfile) return;
    try {
      setLoading(true);
      const list = await documentService.getDocuments({
        ownerId: userProfile.uid,
        status: 'trash'
      });
      setTrashDocs(list);
    } catch (e) {
      console.error('Error loading trash:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (doc: DocumentItem) => {
    try {
      setProcessingId(doc.id!);
      await documentService.restoreFromTrash(doc.id!, {
        uid: userProfile!.uid,
        name: userProfile!.name
      });
      fetchTrash();
    } catch (e: any) {
      alert(e.message || 'Gagal memulihkan dokumen.');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePermanentDelete = async (doc: DocumentItem) => {
    if (
      window.confirm(
        `PERINGATAN: Apakah Anda yakin ingin menghapus permanen dokumen "${doc.title}"? Tindakan ini tidak dapat dibatalkan!`
      )
    ) {
      try {
        setProcessingId(doc.id!);
        await documentService.permanentDelete(doc.id!, {
          uid: userProfile!.uid,
          name: userProfile!.name
        });
        fetchTrash();
      } catch (e: any) {
        alert(e.message || 'Gagal menghapus dokumen.');
      } finally {
        setProcessingId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="text-xs text-slate-500 mt-2">Memuat tempat sampah dokumen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          Tempat Sampah Dokumen
        </h1>
        <p className="text-xs text-slate-500">
          Dokumen yang telah dihapus sementara. Anda dapat memulihkan kembali atau menghapus secara permanen.
        </p>
      </div>

      {/* Alert banner */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <div>
          <strong className="font-semibold">Informasi Penghapusan:</strong> Dokumen di tempat sampah tidak dapat diakses pada modul utama sampai Anda memulihkannya.
        </div>
      </div>

      {/* Trash Table */}
      {trashDocs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          <Trash2 className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
          Tempat sampah kosong. Tidak ada berkas yang dihapus.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Nama Dokumen</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Format / Ukuran</th>
                  <th className="py-3 px-4">Dihapus Pada</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {trashDocs.map(doc => {
                  const isBusy = processingId === doc.id;
                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {doc.title}
                            </p>
                            <span className="text-[10px] text-slate-400">{doc.fileName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {doc.category}
                      </td>
                      <td className="py-3 px-4 text-slate-500 uppercase">
                        {doc.fileType} ({storageService.formatFileSize(doc.fileSize)})
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {doc.updatedAt
                          ? new Date(doc.updatedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestore(doc)}
                            disabled={isBusy}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Pulihkan
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(doc)}
                            disabled={isBusy}
                            className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus Permanen
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
