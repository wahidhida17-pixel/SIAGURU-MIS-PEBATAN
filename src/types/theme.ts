export type ThemeMode = 'light' | 'dark' | 'system';

export type ColorThemeId = 'emerald' | 'ocean' | 'coral' | 'violet' | 'amber' | 'cyan';

export interface ColorThemeOption {
  id: ColorThemeId;
  name: string;
  subtitle: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  gradient: string;
  sidebarLightBg: string;
  sidebarDarkBg: string;
  badgeClass: string;
  activeNavBorder: string;
}

export const COLOR_THEMES: ColorThemeOption[] = [
  {
    id: 'emerald',
    name: 'Zamrud Madrasah',
    subtitle: 'Segar, Berenergi & Bernuansa Islami',
    primaryHex: '#059669',
    secondaryHex: '#10b981',
    accentHex: '#f59e0b',
    gradient: 'from-emerald-600 via-teal-500 to-cyan-500',
    sidebarLightBg: 'from-[#064E3B] to-[#043d2e]',
    sidebarDarkBg: 'from-[#03261d] to-[#021b14]',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    activeNavBorder: 'border-amber-400'
  },
  {
    id: 'ocean',
    name: 'Samudra Sapphire',
    subtitle: 'Cerdas, Elegan & Modern',
    primaryHex: '#2563eb',
    secondaryHex: '#3b82f6',
    accentHex: '#06b6d4',
    gradient: 'from-blue-600 via-indigo-500 to-cyan-400',
    sidebarLightBg: 'from-[#1e3a8a] to-[#172554]',
    sidebarDarkBg: 'from-[#0f172a] to-[#090d16]',
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    activeNavBorder: 'border-cyan-400'
  },
  {
    id: 'coral',
    name: 'Sunset Koral',
    subtitle: 'Hangat, Dinamis & Penuh Semangat',
    primaryHex: '#e11d48',
    secondaryHex: '#f43f5e',
    accentHex: '#f97316',
    gradient: 'from-rose-500 via-pink-500 to-amber-500',
    sidebarLightBg: 'from-[#881337] to-[#4c0519]',
    sidebarDarkBg: 'from-[#380412] to-[#1f0209]',
    badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    activeNavBorder: 'border-amber-400'
  },
  {
    id: 'violet',
    name: 'Violet Neon',
    subtitle: 'Mewah, Futuristik & Eksklusif',
    primaryHex: '#7c3aed',
    secondaryHex: '#8b5cf6',
    accentHex: '#d946ef',
    gradient: 'from-violet-600 via-purple-500 to-fuchsia-500',
    sidebarLightBg: 'from-[#4c1d95] to-[#3b0764]',
    sidebarDarkBg: 'from-[#240c49] to-[#15042b]',
    badgeClass: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
    activeNavBorder: 'border-fuchsia-400'
  },
  {
    id: 'amber',
    name: 'Emas Citrine',
    subtitle: 'Prestisius, Terang & Ramah',
    primaryHex: '#d97706',
    secondaryHex: '#f59e0b',
    accentHex: '#10b981',
    gradient: 'from-amber-500 via-yellow-500 to-orange-500',
    sidebarLightBg: 'from-[#78350f] to-[#451a03]',
    sidebarDarkBg: 'from-[#2e1304] to-[#1a0b02]',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    activeNavBorder: 'border-emerald-400'
  },
  {
    id: 'cyan',
    name: 'Toska Cyber',
    subtitle: 'Sejuk, Tajam & Ultra-Modern',
    primaryHex: '#0891b2',
    secondaryHex: '#06b6d4',
    accentHex: '#10b981',
    gradient: 'from-cyan-500 via-teal-500 to-emerald-400',
    sidebarLightBg: 'from-[#164e63] to-[#083344]',
    sidebarDarkBg: 'from-[#0b222d] to-[#041218]',
    badgeClass: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    activeNavBorder: 'border-teal-300'
  }
];
