import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { COLOR_THEMES, ColorThemeId, ThemeMode } from '../../types/theme';
import { Sun, Moon, Laptop, Check, Palette, Sparkles, X, RotateCcw } from 'lucide-react';

interface ThemeSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSwitcherModal: React.FC<ThemeSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { themeMode, colorTheme, resolvedMode, setThemeMode, setColorTheme, currentThemeOption } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] transition-all text-slate-900 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-850">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20"
              style={{ backgroundColor: currentThemeOption.primaryHex }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Kustomisasi Tema & Tampilan</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pilih mode tampilan dan kombinasi warna cerah favorit Anda</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Section 1: Mode Gelap & Terang */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 block">
              1. Mode Tampilan (Gelap / Terang)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  themeMode === 'light'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2 shadow-inner">
                  <Sun className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Mode Terang</span>
                <span className="text-[10px] text-slate-400">Siang / Kontras</span>
              </button>

              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  themeMode === 'dark'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 shadow-inner">
                  <Moon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Mode Gelap</span>
                <span className="text-[10px] text-slate-400">Malam / Teduh</span>
              </button>

              <button
                type="button"
                onClick={() => setThemeMode('system')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  themeMode === 'system'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-2">
                  <Laptop className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Otomatis</span>
                <span className="text-[10px] text-slate-400">Ikuti Perangkat</span>
              </button>
            </div>
          </div>

          {/* Section 2: Kombinasi Warna Cerah */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                2. Kombinasi Warna Cerah (Aksen Utama)
              </label>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Terpilih: <strong style={{ color: currentThemeOption.primaryHex }}>{currentThemeOption.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COLOR_THEMES.map((theme) => {
                const isSelected = colorTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setColorTheme(theme.id)}
                    className={`relative flex items-center gap-3.5 p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-slate-800 dark:border-white bg-white dark:bg-slate-800 shadow-md ring-2 ring-slate-900/10 dark:ring-white/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Swatch Circle */}
                    <div className="relative shrink-0">
                      <div 
                        className="w-10 h-10 rounded-xl shadow-md flex items-center justify-center text-white"
                        style={{ backgroundColor: theme.primaryHex }}
                      >
                        {isSelected ? (
                          <Check className="w-5 h-5 drop-shadow stroke-[3]" />
                        ) : (
                          <div 
                            className="w-3 h-3 rounded-full shadow-inner"
                            style={{ backgroundColor: theme.accentHex }}
                          />
                        )}
                      </div>
                      <div 
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"
                        style={{ backgroundColor: theme.secondaryHex }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate text-slate-800 dark:text-slate-100">{theme.name}</span>
                        {theme.id === 'emerald' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">Default</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{theme.subtitle}</p>
                      
                      {/* Mini bar colors */}
                      <div className="flex items-center gap-1 mt-2">
                        <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: theme.primaryHex }} />
                        <div className="h-1.5 w-4 rounded-full" style={{ backgroundColor: theme.secondaryHex }} />
                        <div className="h-1.5 w-3 rounded-full" style={{ backgroundColor: theme.accentHex }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Live Interactive Preview */}
          <div className="pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Pratinjau Langsung Tema ({resolvedMode === 'dark' ? 'Mode Gelap' : 'Mode Terang'})
            </label>
            
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full animate-ping"
                    style={{ backgroundColor: currentThemeOption.primaryHex }}
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Aplikasi SIAGURU • {currentThemeOption.name}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${currentThemeOption.badgeClass}`}>
                  Status Aktif
                </span>
              </div>

              {/* Sample Cards & Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Total Siswa Aktif</p>
                  <p className="text-lg font-bold mt-0.5" style={{ color: currentThemeOption.primaryHex }}>
                    184 Siswa
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Rapor Semester</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    100% Selesai
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                  style={{ backgroundColor: currentThemeOption.primaryHex }}
                >
                  Tombol Utama
                </button>
                <button
                  type="button"
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
                >
                  Tombol Sekunder
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => {
              setThemeMode('light');
              setColorTheme('emerald');
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Tema Standar
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer"
            style={{ backgroundColor: currentThemeOption.primaryHex }}
          >
            Terapkan & Simpan
          </button>
        </div>

      </div>
    </div>
  );
};
