import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ThemeToggleButton } from '../../components/theme/ThemeToggleButton';
import { SchoolLogo } from '../../components/common/SchoolLogo';
import { useTheme } from '../../hooks/useTheme';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firestore';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { currentThemeOption, resolvedMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'guru' | 'headmaster'>('admin');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

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
    if (isRegisterMode && password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegisterMode) {
        // Mode registrasi untuk initial setup
        let user;
        try {
          user = await authService.register(email, password);
        } catch (regErr: any) {
          if (regErr.code === 'auth/email-already-in-use') {
            // Email sudah ada, otomatis coba login dengan kredensial yang dimasukkan
            try {
              user = await authService.login(email, password);
            } catch (loginErr: any) {
              setIsRegisterMode(false);
              setError('Email ini sudah terdaftar. Silakan masukkan password yang tepat untuk masuk.');
              setIsLoading(false);
              return;
            }
          } else {
            throw regErr;
          }
        }
        
        // Buat atau pastikan profil user ada di Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const existingSnap = await getDoc(userDocRef);
          let role = selectedRole;
          if (!existingSnap.exists()) {
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email,
              displayName: displayName.trim() || email.split('@')[0] || 'Pengguna',
              role: selectedRole,
              isActive: true,
              createdAt: new Date().toISOString()
            });
          } else {
            role = (existingSnap.data() as any)?.role || selectedRole;
          }
          
          if (role === 'admin') navigate('/admin/dashboard', { replace: true });
          else if (role === 'guru') navigate('/guru/dashboard', { replace: true });
          else if (role === 'headmaster') navigate('/headmaster/dashboard', { replace: true });
          else navigate('/admin/dashboard', { replace: true });
        } catch (dbError: any) {
          console.warn("Firestore profile check:", dbError);
          if (selectedRole === 'admin') navigate('/admin/dashboard', { replace: true });
          else if (selectedRole === 'guru') navigate('/guru/dashboard', { replace: true });
          else if (selectedRole === 'headmaster') navigate('/headmaster/dashboard', { replace: true });
          else navigate('/admin/dashboard', { replace: true });
        }
      } else {
        // Mode login
        const user = await authService.login(email, password);
        let profile = await userService.getUserProfile(user.uid);
        
        if (!profile) {
          // Jika user sudah ada di Auth namun belum punya profil di Firestore (misalnya daftar via Console)
          try {
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email,
              displayName: email.split('@')[0] || 'Administrator',
              role: 'admin',
              isActive: true,
              createdAt: new Date().toISOString()
            });
            profile = { role: 'admin', isActive: true } as any;
          } catch (dbError: any) {
            console.warn("Gagal membuat profil di Firestore:", dbError);
            profile = { role: 'admin', isActive: true } as any;
          }
        }

        if (profile && !profile.isActive) {
          setError('Akun Anda dinonaktifkan. Silakan hubungi Administrator.');
          await authService.logout();
          setIsLoading(false);
          return;
        }

        if (profile?.role === 'admin') navigate('/admin/dashboard', { replace: true });
        else if (profile?.role === 'guru') navigate('/guru/dashboard', { replace: true });
        else if (profile?.role === 'headmaster') navigate('/headmaster/dashboard', { replace: true });
        else navigate('/admin/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Email atau password salah. Silakan periksa kembali.');
      } else if (err.code === 'auth/user-not-found') {
        setError('Akun belum terdaftar. Silakan pilih tab "Daftar Akun Baru" di atas.');
      } else if (err.code === 'auth/email-already-in-use') {
        setIsRegisterMode(false);
        setError('Email ini sudah terdaftar. Silakan masukkan password untuk Masuk.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password terlalu lemah. Gunakan minimal 6 karakter.');
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
              {isRegisterMode ? 'Daftar / Setup Akun' : 'Selamat Datang'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              {isRegisterMode 
                ? 'Buat akun pengelola untuk sistem SIAGURU.'
                : 'Masuk ke sistem SIAGURU MI Syuriyah Pebatan'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setError('');
              }}
              className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                !isRegisterMode
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Masuk (Login)
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setError('');
              }}
              className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                isRegisterMode
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Daftar Akun Baru
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegisterMode && (
              <>
                <Input
                  label="Nama Lengkap"
                  type="text"
                  placeholder="Contoh: H. Ahmad Wahidi, S.Pd.I"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Peran / Hak Akses
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('admin')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        selectedRole === 'admin'
                          ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      Administrator
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('guru')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        selectedRole === 'guru'
                          ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      Guru
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('headmaster')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        selectedRole === 'headmaster'
                          ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      Kepala Madrasah
                    </button>
                  </div>
                </div>
              </>
            )}

            <Input
              label="Alamat Email"
              type="email"
              placeholder="nama@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
            
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900 font-medium leading-relaxed">
                {error}
              </div>
            )}

            {!isRegisterMode && (
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
                    Bantuan Akun: Admin Madrasah
                  </span>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full py-2.5 font-bold text-sm mt-2" isLoading={isLoading}>
              {isLoading ? 'Memproses...' : (isRegisterMode ? 'Daftar Sekarang' : 'Masuk Sekarang')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
