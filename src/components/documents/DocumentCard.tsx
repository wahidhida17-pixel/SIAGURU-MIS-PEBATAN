import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCode,
  File,
  Star,
  Download,
  Eye,
  MoreVertical,
  Calendar,
  User,
  Tag,
  Copy,
  Trash2,
  Archive,
  History
} from 'lucide-react';
import type { DocumentItem } from '../../types/document';
import { storageService } from '../../services/storageService';

interface DocumentCardProps {
  document: DocumentItem;
  onPreview: (doc: DocumentItem) => void;
  onDownload: (doc: DocumentItem) => void;
  onToggleFavorite: (id: string) => void;
  onDetail: (doc: DocumentItem) => void;
  onDuplicate?: (doc: DocumentItem) => void;
  onTrash?: (doc: DocumentItem) => void;
  onRestore?: (doc: DocumentItem) => void;
  onDeletePermanent?: (doc: DocumentItem) => void;
  isTrashMode?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document: doc,
  onPreview,
  onDownload,
  onToggleFavorite,
  onDetail,
  onDuplicate,
  onTrash,
  onRestore,
  onDeletePermanent,
  isTrashMode = false
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const getFileIcon = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t === 'pdf') {
      return (
        <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs">
          PDF
        </div>
      );
    }
    if (['doc', 'docx'].includes(t)) {
      return (
        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
          DOC
        </div>
      );
    }
    if (['xls', 'xlsx'].includes(t)) {
      return (
        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
          XLS
        </div>
      );
    }
    if (['jpg', 'jpeg', 'png', 'webp'].includes(t)) {
      return (
        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
          IMG
        </div>
      );
    }
    if (['ppt', 'pptx'].includes(t)) {
      return (
        <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs">
          PPT
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
        <File className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between">
      <div>
        {/* Top bar */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            {getFileIcon(doc.fileType)}
            <div>
              <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mb-0.5">
                {doc.category}
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{storageService.formatFileSize(doc.fileSize)}</span>
                {doc.version > 1 && (
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 px-1.5 py-0.2 rounded font-medium">
                    v{doc.version}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!isTrashMode && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onToggleFavorite(doc.id!);
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  doc.isFavorite
                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                    : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={doc.isFavorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
              >
                <Star className="w-4 h-4" fill={doc.isFavorite ? 'currentColor' : 'none'} />
              </button>
            )}

            <div className="relative">
              <button
                onClick={e => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg py-1 z-20 text-xs">
                    {!isTrashMode ? (
                      <>
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            onDetail(doc);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                        >
                          <History className="w-3.5 h-3.5 text-slate-400" /> Detail & Riwayat
                        </button>
                        {onDuplicate && (
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              onDuplicate(doc);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-400" /> Duplikat Dokumen
                          </button>
                        )}
                        {onTrash && (
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              onTrash(doc);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Pindahkan ke Sampah
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {onRestore && (
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              onRestore(doc);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2 text-emerald-600 dark:text-emerald-400"
                          >
                            <Archive className="w-3.5 h-3.5" /> Pulihkan Dokumen
                          </button>
                        )}
                        {onDeletePermanent && (
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              onDeletePermanent(doc);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 text-red-600 dark:text-red-400 font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus Permanen
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h4
          onClick={() => (!isTrashMode ? onDetail(doc) : undefined)}
          className={`font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 mb-1.5 ${
            !isTrashMode ? 'cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400' : ''
          }`}
          title={doc.title}
        >
          {doc.title}
        </h4>

        {/* Description */}
        {doc.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
            {doc.description}
          </p>
        )}

        {/* Metadata info */}
        <div className="space-y-1 text-[11px] text-slate-400 dark:text-slate-500 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>
              {doc.academicYear} {doc.semester ? `(${doc.semester})` : ''}
            </span>
          </div>
          {(doc.className || doc.subjectName) && (
            <div className="flex items-center gap-1.5 truncate">
              <span className="truncate">
                {doc.className ? `Kelas ${doc.className}` : ''}
                {doc.className && doc.subjectName ? ' • ' : ''}
                {doc.subjectName || ''}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 truncate">
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{doc.ownerName}</span>
          </div>
        </div>

        {/* Tags */}
        {doc.tags && doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {doc.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
            {doc.tags.length > 3 && (
              <span className="text-[10px] text-slate-400 px-1">+{doc.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
        <button
          onClick={() => onPreview(doc)}
          className="flex-1 py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> Preview
        </button>
        <button
          onClick={() => onDownload(doc)}
          className="py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          title="Download File"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
