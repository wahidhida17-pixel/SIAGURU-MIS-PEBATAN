import React from 'react';
import type { GeneralSettings } from '../../types/academic';

interface DocumentSignatureProps {
  settings: GeneralSettings | null;
  teacherName: string;
  teacherNip?: string;
  teacherRoleTitle?: string; // e.g. "Guru Mata Pelajaran" | "Guru Kelas"
  dateLocation?: string; // e.g. "Subang, 15 Juli 2026"
}

export const DocumentSignature: React.FC<DocumentSignatureProps> = ({
  settings,
  teacherName,
  teacherNip,
  teacherRoleTitle = 'Guru Mata Pelajaran',
  dateLocation
}) => {
  const defaultDateLocation = dateLocation || `Pebatan, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  return (
    <div className="mt-10 pt-4 break-inside-avoid select-none text-slate-800 text-xs sm:text-sm">
      <div className="flex justify-end mb-4">
        <p className="font-medium text-slate-700">{defaultDateLocation}</p>
      </div>

      <div className="grid grid-cols-2 gap-8 text-center">
        {/* Left: Kepala Madrasah */}
        <div className="flex flex-col items-center">
          <p className="font-semibold text-slate-800">Mengetahui,</p>
          <p className="font-semibold text-slate-800">Kepala Madrasah</p>
          
          <div className="h-20 sm:h-24"></div>
          
          <p className="font-bold underline text-slate-900 uppercase">
            {settings?.principalName || "H. AHMAD SYAFI'I, S.Pd.I"}
          </p>
          <p className="text-[11px] text-slate-600">
            NIP. {settings?.principalNip || '197505122005011003'}
          </p>
        </div>

        {/* Right: Guru Pengampu */}
        <div className="flex flex-col items-center">
          <p className="font-semibold text-slate-800">&nbsp;</p>
          <p className="font-semibold text-slate-800">{teacherRoleTitle}</p>
          
          <div className="h-20 sm:h-24"></div>
          
          <p className="font-bold underline text-slate-900 uppercase">
            {teacherName || '(..................................................)'}
          </p>
          <p className="text-[11px] text-slate-600">
            {teacherNip ? `NIP. ${teacherNip}` : 'NIP. -'}
          </p>
        </div>
      </div>
    </div>
  );
};
