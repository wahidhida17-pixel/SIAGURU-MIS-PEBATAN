import React, { useState } from 'react';
import { X, Printer, Download, FileText, CheckCircle2 } from 'lucide-react';
import { exportElementToPDF, sanitizeFileName } from '../../utils/documentPdfUtils';
import { triggerPrint } from '../../utils/exportUtils';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileName: string;
  orientation?: 'portrait' | 'landscape';
  children: React.ReactNode;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  fileName,
  orientation = 'portrait',
  children
}) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      await exportElementToPDF('printable-doc-content', fileName, orientation as 'portrait' | 'landscape');
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    triggerPrint();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-slate-100 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300">
        {/* Modal Action Header */}
        <div className="bg-white px-4 sm:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
                Pratinjau Dokumen A4
              </h3>
              <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md">
                {title} &bull; <span className="font-mono text-emerald-700">{sanitizeFileName(fileName)}.pdf</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <LoadingSpinner className="w-3.5 h-3.5 text-white" />
                  <span>Mengunduh...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container resembling an A4 sheet */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-8 flex justify-center bg-slate-200/70">
          <div
            id="printable-doc-content"
            className={`bg-white p-6 sm:p-12 shadow-lg border border-slate-300 print:shadow-none print:border-none w-full ${
              orientation === 'landscape' ? 'max-w-[1000px]' : 'max-w-[820px]'
            } min-h-[1100px] text-slate-800 text-sm`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
