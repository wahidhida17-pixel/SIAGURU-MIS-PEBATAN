import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ThemeToggleButton } from '../../components/theme/ThemeToggleButton';
import { SchoolLogo } from '../../components/common/SchoolLogo';
import { useTheme } from '../../hooks/useTheme';
import { Eye, EyeOff, UserPlus, LogIn, KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import type { UserRole } from '../../types/user';

type AuthMode = 'login' | 'register' | 'forgot';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { currentThemeOption, resolvedMode } = useTheme();

  const [mode, setMode] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetFormState = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccessMessage('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Alamat email wajib diisi.');
      return;
    }

    if (mode === 'forgot') {
      setIsLoading(true);
      try {
        await authService.resetPassword(trimmedEmail);
        setSuccessMessage(`Tautan pemulihan password telah dikirim ke ${trimmedEmail}. Silakan periksa kotak masuk atau folder spam email Anda.`);
      } catch (err: any) {
        setError(authService.getFriendlyErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!password) {
      setError('Password wajib diisi.');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await authService.login(trimmedEmail, password);
        navigate('/guru/dashboard', { replace: true });
      } else if (mode === 'register') {
        await authService.register(
          trimmedEmail, 
          password, 
          displayName.trim() || trimmedEmail.split('@')[0], 
          role
        );
        navigate('/guru/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      const friendlyMsg = authService.getFriendlyErrorMessage(err);
      setError(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const leftPanelBg = resolvedMode === 'dark' 
    ? `bg-gradient-to-br ${currentThemeOption.sidebarDarkBg}` 
    : `bg-gradient-to-br ${currentThemeOption.sidebarLightBg}`;

  const isInvalidCredentialError = error.includes('salah') || error.includes('belum terdaftar') || error.includes('invalid-credential');

  return (
    <div className="flex min-h-screen bg-[#F0F4F1] dark:bg-slate-950 font-sans transition-colors relative">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggleButton />
      </div>

      {/* Panel Kiri (Desktop) */}
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6 bg-white dark:bg-slate-900 p-6 sm:p-8 lg:p-10 rounded-3xl shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors">
          
          {/* Header */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="lg:hidden mb-4">
              <SchoolLogo size="xl" variant="circle" />
            </div>
            
            {mode === 'login' && (
              <>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Selamat Datang
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                  Masuk ke sistem SIAGURU MI Syuriyah Pebatan
                </p>
              </>
            )}

            {mode === 'register' && (
              <>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <UserPlus className="w-6 h-6 text-emerald-600" />
                  Daftar Akun Baru
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                  Buat akun login Admin / Guru untuk MI Syuriyah Pebatan
                </p>
              </>
            )}

            {mode === 'forgot' && (
              <>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <KeyRound className="w-6 h-6 text-emerald-600" />
                  Lupa Password
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                  Masukkan email Anda untuk menerima tautan reset password
                </p>
              </>
            )}
          </div>

          {/* Mode Tabs (Masuk / Daftar) */}
          {mode !== 'forgot' && (
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1">
              <button
                type="button"
                onClick={() => resetFormState('login')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Masuk
              </button>
              <button
                type="button"
                onClick={() => resetFormState('register')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'register'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Daftar Akun
              </button>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* Input Nama Lengkap (Khusus Mode Register) */}
            {mode === 'register' && (
              <Input
                label="Nama Lengkap"
                type="text"
                placeholder="Contoh: Ahmad Fauzi, S.Pd."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
                required
              />
            )}

            {/* Input Email */}
            <Input
              label="Alamat Email"
              type="email"
              placeholder="nama@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
            
            {/* Input Password (Untuk Login & Register) */}
            {mode !== 'forgot' && (
              <div className="relative">
                <Input
                  label={mode === 'register' ? "Password (Minimal 6 Karakter)" : "Password"}
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
            )}

            {/* Role Picker (Khusus Mode Register) */}
            {mode === 'register' && (
              <div className="space-y-1.5 w-full">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Peran / Hak Akses
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <option value="admin">Administrator (Akses Penuh)</option>
                  <option value="guru">Guru Mata Pelajaran / Kelas</option>
                  <option value="headmaster">Kepala Madrasah</option>
                </select>
              </div>
            )}

            {/* Error Message Box */}
            {error && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs sm:text-sm rounded-xl border border-red-200 dark:border-red-900/60 font-medium leading-relaxed space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                {mode === 'login' && isInvalidCredentialError && (
                  <div className="pt-1 border-t border-red-100 dark:border-red-900/40">
                    <button
                      type="button"
                      onClick={() => resetFormState('register')}
                      className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold text-xs inline-flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Belum mendaftarkan akun ini? Klik untuk Daftar Sekarang
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Success Message Box */}
            {successMessage && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm rounded-xl border border-emerald-200 dark:border-emerald-900/60 font-medium leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Option Bar (Ingat Saya & Lupa Password) */}
            {mode === 'login' && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-600 bg-white dark:bg-slate-800 cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-600 dark:text-slate-400 font-medium cursor-pointer select-none">
                    Ingat saya
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => resetFormState('forgot')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold text-left sm:text-right transition-colors"
                >
                  Lupa Password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full py-2.5 font-bold text-sm mt-2" isLoading={isLoading}>
              {isLoading ? (
                'Memproses...'
              ) : mode === 'login' ? (
                'Masuk Sekarang'
              ) : mode === 'register' ? (
                'Daftar & Masuk'
              ) : (
                'Kirim Tautan Pemulihan'
              )}
            </Button>

            {/* Back to Login button in forgot mode */}
            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => resetFormState('login')}
                className="w-full py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Menu Masuk
              </button>
            )}
          </form>

          {/* Footer note */}
          <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Butuh bantuan akses akun? Hubungi Admin Madrasah di <span className="font-semibold text-slate-600 dark:text-slate-400">misyuriyahpebatan@gmail.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

