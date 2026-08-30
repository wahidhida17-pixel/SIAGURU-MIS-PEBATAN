import React from 'react';
import type { GeneralSettings } from '../../types/academic';

interface DocumentHeaderProps {
  settings: GeneralSettings | null;
  title: string;
  subTitle?: string;
  documentNumber?: string;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  settings,
  title,
  subTitle,
  documentNumber
}) => {
  return (
    <div className="border-b-2 border-slate-800 pb-4 mb-6 text-center select-none print:border-black">
      {/* Top Header Kop Madrasah */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="w-16 h-16 flex items-center justify-center shrink-0">
          <img 
            src={settings?.logoURL || '/logo.svg'} 
            alt="Logo Madrasah" 
            className="w-16 h-16 object-contain rounded-full" 
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1 text-center">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest leading-none">
            YAYASAN PENDIDIKAN DAN SOSIAL SYURIYAH
          </p>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 uppercase tracking-tight font-serif mt-1">
            {settings?.schoolName || 'MI SYURIYAH PEBATAN'}
          </h1>
          <p className="text-[11px] text-slate-600 mt-0.5">
            NSM: {settings?.nsm || '111233290001'} &bull; NPSN: {settings?.npsn || '60712345'}
          </p>
          <p className="text-[10px] text-slate-500 italic mt-0.5">
            {settings?.address || 'Jl. KH. Syuriyah No. 12, Pebatan, Kec. Pusakajaya, Kab. Subang'} &bull; Telp: {settings?.phone || '(0260) 123456'}
          </p>
        </div>
        <div className="w-16 h-16 shrink-0 hidden sm:block"></div>
      </div>

      <div className="w-full h-0.5 bg-slate-800 my-1"></div>
      <div className="w-full h-[1px] bg-slate-800 mb-4"></div>

      {/* Document Specific Title */}
      <div className="mt-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide underline underline-offset-4">
          {title}
        </h2>
        {subTitle && (
          <p className="text-xs font-medium text-slate-700 mt-1 uppercase">
            {subTitle}
          </p>
        )}
        {documentNumber && (
          <p className="text-[11px] text-slate-500 mt-0.5">
            No: {documentNumber}
          </p>
        )}
      </div>
    </div>
  );
};
