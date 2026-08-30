import React from 'react';

interface SchoolLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';
  className?: string;
  showText?: boolean;
  textClassName?: string;
  subtextClassName?: string;
  variant?: 'circle' | 'rounded' | 'plain';
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
  variant = 'circle'
}) => {
  const sizeClass = sizeMap[size] || sizeMap.md;

  const shapeClass = 
    variant === 'circle' 
      ? 'rounded-full' 
      : variant === 'rounded' 
      ? 'rounded-2xl' 
      : '';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`relative shrink-0 overflow-hidden ${sizeClass} ${shapeClass} transition-transform hover:scale-105 shadow-sm`}>
        <img
          src="/logo.svg"
          alt="Logo MI Syuriyah Pebatan"
          className="w-full h-full object-contain select-none pointer-events-none"
          referrerPolicy="no-referrer"
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-tight min-w-0">
          <span className={`font-bold tracking-tight text-slate-800 dark:text-slate-100 ${textClassName || 'text-base'}`}>
            SIAGURU
          </span>
          <span className={`text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${subtextClassName || ''}`}>
            MI Syuriyah Pebatan
          </span>
        </div>
      )}
    </div>
  );
};
