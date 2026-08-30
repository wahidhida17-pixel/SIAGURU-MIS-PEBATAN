import React from 'react';
import { useTheme } from '../../hooks/useTheme';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description }) => {
  let themeCtx: ReturnType<typeof useTheme> | null = null;
  try {
    themeCtx = useTheme();
  } catch {
    // ignore
  }

  const primaryHex = themeCtx?.currentThemeOption?.primaryHex || '#059669';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      <div 
        className="absolute right-0 top-0 w-24 h-24 rounded-bl-full -mr-4 -mt-4 opacity-15 dark:opacity-10 group-hover:scale-110 transition-transform"
        style={{ backgroundColor: primaryHex }}
      />
      <div className="relative z-10 flex flex-col gap-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
          style={{ 
            backgroundColor: `${primaryHex}18`, 
            color: primaryHex 
          }}
        >
          {icon}
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{value}</h3>
            {description && (
              <span 
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                style={{ 
                  backgroundColor: `${primaryHex}15`, 
                  color: primaryHex,
                  borderColor: `${primaryHex}30`
                }}
              >
                {description}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
