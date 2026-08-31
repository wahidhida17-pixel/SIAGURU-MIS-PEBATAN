import React from 'react';
import { useSchoolSettings } from '../../contexts/SchoolSettingsContext';

interface SchoolLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';
  className?: string;
  showText?: boolean;
  textClassName?: string;
  subtextClassName?: string;
  variant?: 'circle' | 'rounded' | 'plain';
  customLogoUrl?: string;
  customSchoolName?: string;
}

const sizeMap = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-24 h-24',
  hero: 'w-32 h-32'
};

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  textClassName = '',
  subtextClassName = '',
  variant = 'circle',
  customLogoUrl,
  customSchoolName
}) => {
  const { settings } = useSchoolSettings();
  const sizeClass = sizeMap[size] || sizeMap.md;

  const shapeClass = 
    variant === 'circle' 
      ? 'rounded-full' 
      : variant === 'rounded' 
      ? 'rounded-2xl' 
      : '';

  const logoSrc = customLogoUrl || settings?.logoURL || '/logo.svg';
  const schoolName = customSchoolName || settings?.schoolName || 'MI Syuriyah Pebatan';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`relative shrink-0 overflow-hidden ${sizeClass} ${shapeClass} transition-transform hover:scale-105 shadow-sm bg-white/10`}>
        <img
          src={logoSrc}
          alt={`Logo ${schoolName}`}
          className="w-full h-full object-contain select-none pointer-events-none"
          referrerPolicy="no-referrer"
          loading="eager"
          onError={(e) => {
            // Fallback if custom URL fails to load
            (e.target as HTMLImageElement).src = '/logo.svg';
          }}
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-tight min-w-0">
          <span className={`font-bold tracking-tight text-slate-800 dark:text-slate-100 ${textClassName || 'text-base'}`}>
            SIAGURU
          </span>
          <span className={`text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${subtextClassName || ''}`}>
            {schoolName}
          </span>
        </div>
      )}
    </div>
  );
};

