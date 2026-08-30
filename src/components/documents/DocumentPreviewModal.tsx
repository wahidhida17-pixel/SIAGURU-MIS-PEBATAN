import React from 'react';
import {
  X,
  Download,
  FileText,
  FileSpreadsheet,
  File,
  ExternalLink,
  Calendar,
  User,
  Tag,
  Eye,
  AlertCircle
} from 'lucide-react';
import type { DocumentItem } from '../../types/document';
import { storageService } from '../../services/storageService';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  onDownload: (doc: DocumentItem) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  onDownload
}) => {
  if (!isOpen || !doc) return null;

  const fileType = (doc.fileType || '').toLowerCase();
  const isPdf = fileType === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileType);
  const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileType);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl h-[92vh] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top bar */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3 truncate pr-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
              {fileType.toUpperCase()}
            </div>
            <div className="truncate">
              <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                {doc.title}
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                {doc.fileName} • {storageService.formatFileSize(doc.fileSize)} • Kategori: {doc.category}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onDownload(doc)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-3 sm:p-6 overflow-y-auto flex items-center justify-center">
          {isPdf ? (
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800 flex flex-col">
              {doc.downloadUrl ? (
                <iframe
                  src={doc.downloadUrl}
                  title={doc.title}
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 flex items-center justify-center">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      Dokumen PDF Tersimpan
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                      File PDF metadata {doc.fileName} tersimpan di arsip digital madrasah.
                    </p>
                  </div>
                  <button
                    onClick={() => onDownload(doc)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Dokumen PDF
                  </button>
                </div>
              )}
            </div>
          ) : isImage ? (
            <div className="max-w-full max-h-full flex items-center justify-center overflow-auto p-4">
              {doc.downloadUrl ? (
                <img
                  src={doc.downloadUrl}
                  alt={doc.title}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg border border-slate-200 dark:border-slate-800"
                />
              ) : (
                <div className="text-center p-8">
                  <File className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Pratinjau gambar belum tersedia.</p>
                </div>
              )}
            </div>
          ) : isOffice ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-5 shadow-lg">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                  {doc.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Format .{fileType} didesain untuk diedit melalui aplikasi Microsoft Office / WPS Office.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 text-left space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama File:</span>
                  <span className="font-medium truncate max-w-[180px]">{doc.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ukuran:</span>
                  <span className="font-medium">{storageService.formatFileSize(doc.fileSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tahun / Semester:</span>
                  <span className="font-medium">
                    {doc.academicYear} {doc.semester ? `(${doc.semester})` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pengunggah:</span>
                  <span className="font-medium">{doc.ownerName}</span>
                </div>
              </div>

              <button
                onClick={() => onDownload(doc)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" /> Download File ({fileType.toUpperCase()})
              </button>
            </div>
          ) : (
            <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-sm">
              <File className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                File {doc.fileName}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 mb-4">
                Pratinjau langsung tidak didukung untuk format ini.
              </p>
              <button
                onClick={() => onDownload(doc)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Unduh Dokumen
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>
            {doc.className ? `Kelas ${doc.className}` : ''} {doc.subjectName ? `• ${doc.subjectName}` : ''}
          </span>
          <span>Diunggah pada: {new Date(doc.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
};
