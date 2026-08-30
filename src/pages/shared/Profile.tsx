import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { SchoolLogo } from '../../components/common/SchoolLogo';
import { authService } from '../../services/authService';
import { LogOut, Building2, MapPin, Award } from 'lucide-react';

export const Profile: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

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

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Profil Pengguna</h1>

      {/* Madrasah Affiliation Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <SchoolLogo size="2xl" variant="circle" className="shrink-0 ring-4 ring-white/20 rounded-full" />
        <div className="flex-1 text-center sm:text-left space-y-1">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-700/80 text-emerald-100 border border-emerald-500/30">
            Lembaga Pendidikan
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            MI SYURIYAH PEBATAN
          </h2>
          <p className="text-emerald-100/80 text-xs flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            NSM: 111233290045 &bull; NPSN: 60712345
          </p>
          <p className="text-emerald-100/70 text-[11px] flex items-center justify-center sm:justify-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            Jl. Raya Pebatan No. 12, Kec. Brebes, Kab. Brebes, Jawa Tengah
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Informasi Dasar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-6">
            <Avatar 
              src={userProfile?.photoURL} 
              fallback={userProfile?.displayName?.charAt(0) || 'U'} 
              className="h-24 w-24 text-2xl" 
            />
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{userProfile?.displayName}</h3>
              <p className="text-emerald-600 font-medium capitalize">{userProfile?.role}</p>
              <div className="mt-2 flex items-center space-x-2">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md font-medium">
                  Status: {userProfile?.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
                {userProfile?.teacherId && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-md font-medium">
                    ID: {userProfile.teacherId}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Nama Lengkap" 
              value={userProfile?.displayName || ''} 
              disabled 
              readOnly
            />
            <Input 
              label="Alamat Email" 
              value={currentUser?.email || ''} 
              disabled 
              readOnly
            />
            <Input 
              label="Role Akun" 
              value={userProfile?.role || ''} 
              disabled 
              readOnly
              className="capitalize"
            />
            <Input 
              label="UID" 
              value={userProfile?.uid || ''} 
              disabled 
              readOnly
            />
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <Button 
              variant="outline" 
              type="button"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => setIsLogoutModalOpen(true)}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Keluar dari Akun
            </Button>
            <Button variant="outline" onClick={() => alert('Fitur edit profil akan tersedia pada tahap berikutnya.')}>
              Edit Profil
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Konfirmasi Keluar</h3>
            <p className="text-sm text-slate-500 mb-6">
              Apakah Anda yakin ingin mengakhiri sesi dan keluar dari sistem SIAGURU?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
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
