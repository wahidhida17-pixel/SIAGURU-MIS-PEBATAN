import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ThemeToggleButton } from '../../components/theme/ThemeToggleButton';
import { SchoolLogo } from '../../components/common/SchoolLogo';
import { useTheme } from '../../hooks/useTheme';
import { Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { currentThemeOption, resolvedMode } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email wajib diisi.');
      return;
    }
    if (!password) {
      setError('Password wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.login(email, password);
      // Navigate akan ditangani oleh auth listener di App.tsx
      navigate('/guru/dashboard', { replace: true });
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('Akun belum terdaftar.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Password yang Anda masukkan salah.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Format email tidak valid.');
      } else {
        setError(err.message || 'Terjadi kesalahan saat otentikasi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const leftPanelBg = resolvedMode === 'dark' 
    ? `bg-gradient-to-br ${currentThemeOption.sidebarDarkBg}` 
    : `bg-gradient-to-br ${currentThemeOption.sidebarLightBg}`;

  return (
    <div className="flex min-h-screen bg-[#F0F4F1] dark:bg-slate-950 font-sans transition-colors relative">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggleButton />
      </div>

      {/* Panel Kiri */}
      <div className={`hidden lg:flex lg:w-1/2 ${leftPanelBg} flex-col justify-center px-12 text-white relative overflow-hidden transition-all`}>
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/30 via-transparent to-black/30"></div>
        <div className="max-w-md mx-auto relative z-10">
          <div className="flex items-center space-x-4 mb-10">
            <SchoolLogo size="xl" variant="circle" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">SIAGURU</h1>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">MI SYURIYAH PEBATAN</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-6 leading-tight tracking-tight text-white">
            Sistem Administrasi<br />Guru Digital
          </h2>
          <div className="space-y-4 text-white/80 text-sm leading-relaxed mb-8">
            <p>Dibangun khusus untuk mempermudah manajemen dan administrasi akademik madrasah MI Syuriyah Pebatan secara profesional, transparan, dan efisien.</p>
          </div>
        </div>
      </div>

      {/* Panel Kanan */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6 bg-white dark:bg-slate-900 p-8 lg:p-10 rounded-3xl shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="lg:hidden mb-4">
              <SchoolLogo size="xl" variant="circle" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Selamat Datang
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Masuk ke sistem SIAGURU MI Syuriyah Pebatan
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <Input
              label="Alamat Email"
              type="email"
              placeholder="nama@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
            
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[32px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                title={showPassword ? "Sembunyikan password" : "Lihat password"}
                aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900 font-medium leading-relaxed">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-600 bg-white dark:bg-slate-800"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Ingat saya
                </label>
              </div>
              <div className="text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  Bantuan Akun: Hubungi Admin
                </span>
              </div>
            </div>

            <Button type="submit" className="w-full py-2.5 font-bold text-sm mt-2" isLoading={isLoading}>
              {isLoading ? 'Memproses...' : 'Masuk Sekarang'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
