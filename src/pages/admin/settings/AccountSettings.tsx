import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Settings, Key, Mail, User, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { authService } from '../../../services/authService';

export const AccountSettings: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(currentUser.email);
      setResetSent(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal mengirim tautan reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
            Pengaturan Akun
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Kelola informasi akun dan pengaturan keamanan administrator.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-slate-500" />
                Informasi Pengguna
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nama Lengkap</label>
                <p className="text-slate-900 dark:text-slate-100 font-medium mt-1">{userProfile?.name || 'Administrator'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Peran / Hak Akses</label>
                <div className="mt-1 inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {userProfile?.role || 'Admin'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-slate-500" />
                Alamat Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Terdaftar</label>
                  <Input 
                    value={currentUser?.email || ''} 
                    readOnly 
                    disabled
                    className="bg-slate-50 dark:bg-slate-900"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Alamat email ini digunakan untuk login dan menerima notifikasi penting.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="w-5 h-5 text-slate-500" />
                Keamanan & Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Reset Password</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  Jika Anda ingin mengubah password, kami akan mengirimkan tautan aman ke email terdaftar Anda (<strong>{currentUser?.email}</strong>) untuk mengatur ulang password baru.
                </p>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs font-medium">
                    {error}
                  </div>
                )}
                
                {resetSent ? (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
                    <CheckCircle2 className="w-5 h-5" />
                    Tautan reset password berhasil dikirim ke email Anda!
                  </div>
                ) : (
                  <Button 
                    onClick={handlePasswordReset} 
                    disabled={loading}
                    variant="outline"
                    className="w-full sm:w-auto dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {loading ? 'Mengirim Tautan...' : 'Kirim Tautan Reset Password'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
