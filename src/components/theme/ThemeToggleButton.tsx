import React, { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Sun, Moon, Palette } from 'lucide-react';
import { ThemeSwitcherModal } from './ThemeSwitcherModal';

interface ThemeToggleButtonProps {
  compact?: boolean;
}

export const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ compact = false }) => {
  const { resolvedMode, toggleThemeMode, currentThemeOption } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner">
        {/* Toggle Dark / Light Mode */}
        <button
          type="button"
          onClick={toggleThemeMode}
          title={resolvedMode === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer shadow-sm relative group"
        >
          {resolvedMode === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-200" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 animate-in spin-in-180 duration-200" />
          )}
          <span className="sr-only">Toggle Dark/Light Mode</span>
        </button>

        {/* Open Theme Customizer Modal */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          title={`Pilih Kombinasi Warna (Aktif: ${currentThemeOption.name})`}
          className="flex items-center gap-1.5 p-1.5 px-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer shadow-sm"
        >
          <div className="relative flex items-center justify-center">
            <Palette className="w-4 h-4" />
            <div 
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm"
              style={{ backgroundColor: currentThemeOption.primaryHex }}
            />
          </div>
          {!compact && (
            <span className="text-[11px] font-bold hidden xl:inline" style={{ color: currentThemeOption.primaryHex }}>
              {currentThemeOption.name.split(' ')[0]}
            </span>
          )}
        </button>
      </div>

      <ThemeSwitcherModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
