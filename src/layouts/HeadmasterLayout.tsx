import React, { useState } from 'react';
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useSchoolSettings } from '../contexts/SchoolSettingsContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Avatar } from '../components/ui/Avatar';
import { SchoolLogo } from '../components/common/SchoolLogo';
import { 
  LayoutDashboard, Users, BookOpen, 
  Calendar, ClipboardList, Activity,
  User, LogOut, Menu, X, FileText, Award,
  FolderOpen, CalendarDays, Palette
} from 'lucide-react';
import { authService } from '../services/authService';
import { NotificationBellDropdown } from '../components/notifications/NotificationBellDropdown';
import { ThemeToggleButton } from '../components/theme/ThemeToggleButton';
import { ThemeSwitcherModal } from '../components/theme/ThemeSwitcherModal';

export const HeadmasterLayout: React.FC = () => {
  const { isAuthenticated, role, userProfile, loading } = useAuth();
  const { currentThemeOption, resolvedMode } = useTheme();
  const { settings } = useSchoolSettings();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) return <div className="flex h-screen items-center justify-center dark:bg-slate-950"><LoadingSpinner /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== 'headmaster') return <Navigate to="/unauthorized" replace />;

  const navigation = [
    { name: 'Dashboard', href: '/headmaster/dashboard', icon: LayoutDashboard },
    { name: 'Monitoring Guru', href: '/headmaster/teachers', icon: Users },
    { name: 'Monitoring Kelas', href: '/headmaster/classes', icon: BookOpen },
    { name: 'Monitoring Pembelajaran', href: '/headmaster/learning', icon: Activity },
    { name: 'Monitoring Penilaian', href: '/headmaster/assessment', icon: ClipboardList },
    { name: 'Monitoring Administrasi', href: '/headmaster/administration', icon: FileText },
    { name: 'Monitoring Rapor', href: '/headmaster/rapor', icon: Award },
    { name: 'Statistik Akademik', href: '/headmaster/statistics', icon: Activity },
    { name: 'Kalender Madrasah', href: '/headmaster/calendar', icon: CalendarDays },
    { name: 'Dokumen Sekolah', href: '/headmaster/documents', icon: FolderOpen },
    { name: 'Laporan', href: '/headmaster/reports', icon: FileText },
    { name: 'Profil', href: '/headmaster/profile', icon: User },
  ];

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authService.logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.warn('Logout error:', err);
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  const sidebarBgClass = resolvedMode === 'dark' 
    ? `bg-gradient-to-b ${currentThemeOption.sidebarDarkBg}` 
    : `bg-gradient-to-b ${currentThemeOption.sidebarLightBg}`;

  return (
    <div className="min-h-screen bg-[#F0F4F1] dark:bg-slate-950 flex font-sans text-slate-800 dark:text-slate-100 transition-colors">
      {/* Sidebar Desktop */}
      <aside className={`hidden lg:flex w-64 flex-col ${sidebarBgClass} h-screen sticky top-0 shrink-0 shadow-2xl transition-all border-r border-white/5`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <SchoolLogo size="md" variant="circle" />
            <div>
              <h1 className="font-bold text-white text-lg leading-tight tracking-tight">SIAGURU</h1>
              <p className="text-white/70 text-[10px] uppercase font-bold tracking-wider truncate max-w-[140px]" title={settings?.schoolName}>
                {settings?.schoolName || 'MI Syuriyah Pebatan'}
              </p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                  ? `bg-white/15 text-white font-semibold shadow-sm border-l-4 ${currentThemeOption.activeNavBorder} rounded-l-none` 
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" style={isActive ? { color: currentThemeOption.accentHex } : {}} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <div className="bg-black/20 backdrop-blur-sm p-3 rounded-xl flex items-center gap-3 border border-white/5">
            <Avatar 
              fallback={userProfile?.displayName?.charAt(0) || 'K'} 
              src={userProfile?.photoURL} 
              className="w-8 h-8 font-bold text-xs shadow-sm"
              style={{ backgroundColor: currentThemeOption.accentHex }}
            />
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{userProfile?.displayName || 'Kepala Madrasah'}</p>
              <p className="text-[10px] text-white/60 capitalize truncate">{userProfile?.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsThemeModalOpen(true)}
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Tema</span>
            </button>
            <button 
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-300 hover:text-red-200 bg-red-950/40 hover:bg-red-900/50 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Header Mobile & Desktop */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-2.5 lg:hidden">
            <SchoolLogo size="sm" variant="circle" />
            <h1 className="font-bold text-slate-800 dark:text-slate-100 text-lg tracking-tight">SIAGURU</h1>
          </div>
          <div className="hidden lg:block">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              SIAGURU {settings?.schoolName?.toUpperCase() || 'MI SYURIYAH PEBATAN'}
            </p>
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Dashboard Kepala Madrasah</h2>
          </div>
          
          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="hidden md:block text-right">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Tahun Pelajaran</p>
              <p className="text-xs font-bold" style={{ color: currentThemeOption.primaryHex }}>
                {settings?.academicYear || '2026/2027'} &bull; {settings?.semester || 'Ganjil'}
              </p>
            </div>
            
            <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-800"></div>

            {/* Theme Toggle & Customizer */}
            <ThemeToggleButton />

            {/* Notification Bell */}
            <NotificationBellDropdown currentUser={userProfile ? { uid: userProfile.uid, name: userProfile.displayName || userProfile.email || 'Kepala Madrasah', role: 'headmaster' } : undefined} />
            
            {/* Quick Logout Button */}
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              title="Keluar / Logout"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl border border-red-200 dark:border-red-900 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Keluar</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Bottom Nav Mobile */}
      <div className="lg:hidden fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-40 transition-colors">
        <div className="flex justify-around py-1">
          <Link to="/headmaster/dashboard" className="flex flex-col items-center py-1.5 px-3 text-slate-500 dark:text-slate-400 hover:text-emerald-600">
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Home</span>
          </Link>
          <Link to="/headmaster/teachers" className="flex flex-col items-center py-1.5 px-3 text-slate-500 dark:text-slate-400 hover:text-emerald-600">
            <Users className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Guru</span>
          </Link>
          <Link to="/headmaster/classes" className="flex flex-col items-center py-1.5 px-3 text-slate-500 dark:text-slate-400 hover:text-emerald-600">
            <BookOpen className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Kelas</span>
          </Link>
          <button 
            type="button" 
            onClick={() => setIsThemeModalOpen(true)} 
            className="flex flex-col items-center py-1.5 px-3 text-slate-500 dark:text-slate-400 cursor-pointer"
          >
            <Palette className="h-5 w-5" style={{ color: currentThemeOption.primaryHex }} />
            <span className="text-[10px] mt-0.5">Tema</span>
          </button>
          <button 
            type="button" 
            onClick={() => setIsSidebarOpen(true)} 
            className="flex flex-col items-center py-1.5 px-3 text-slate-500 dark:text-slate-400 cursor-pointer"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Menu</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-72 bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 transition-colors">
            <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <SchoolLogo size="sm" variant="circle" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Menu Kepala Madrasah</h2>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 -mr-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <item.icon className="h-5 w-5 mr-3 text-slate-400 dark:text-slate-500" />
                  {item.name}
                </Link>
              ))}
              
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsThemeModalOpen(true);
                  }}
                  className="flex w-full items-center px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Palette className="h-5 w-5 mr-3" style={{ color: currentThemeOption.primaryHex }} />
                  Kustomisasi Tema
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsLogoutModalOpen(true);
                  }}
                  className="flex w-full items-center px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Keluar
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Theme Customizer Modal */}
      <ThemeSwitcherModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} />

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden p-6 text-center text-slate-900 dark:text-slate-100 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-900">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-1">Konfirmasi Keluar</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Apakah Anda yakin ingin mengakhiri sesi dan keluar dari sistem SIAGURU?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Keluar...</span>
                  </>
                ) : (
                  <span>Ya, Keluar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
