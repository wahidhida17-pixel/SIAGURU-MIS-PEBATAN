import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { userService } from '../../../services/userService';
import { authService } from '../../../services/authService';
import type { UserProfile, UserRole } from '../../../types/user';
import { Eye, EyeOff } from 'lucide-react';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile | null;
  onSuccess: () => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, user, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    email: '',
    displayName: '',
    role: 'guru',
    isActive: true,
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData(user);
    } else {
      setFormData({
        email: '',
        displayName: '',
        role: 'guru',
        isActive: true,
      });
      setPassword('');
      setShowPassword(false);
    }
    setError(null);
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (user?.uid) {
        // Edit Mode (Only updating Firestore profile)
        await userService.updateUserProfile(user.uid, formData);
      } else {
        // Create Mode
        if (!password || password.length < 6) {
          throw new Error('Password baru minimal 6 karakter.');
        }
        if (!formData.email) {
          throw new Error('Email wajib diisi.');
        }
        
        // 1. Create User in Firebase Auth using the secondary app
        const newAuthUser = await authService.createSecondaryUser(formData.email, password);
        
        // 2. Save profile to Firestore
        const newUserProfile: UserProfile = {
          uid: newAuthUser.uid,
          email: formData.email,
          displayName: formData.displayName || formData.email.split('@')[0],
          role: formData.role as UserRole,
          teacherId: null,
          photoURL: null,
          isActive: formData.isActive ?? true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await userService.createUserProfile(newUserProfile);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menyimpan data pengguna.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit Pengguna' : 'Tambah Pengguna Baru'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <Input
            label="Nama Lengkap"
            name="displayName"
            value={formData.displayName || ''}
            onChange={handleChange}
            required
            placeholder="Nama Pengguna"
          />
          
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={handleChange}
            required
            disabled={!!user} // Email cannot be changed after creation easily
            placeholder="pengguna@example.com"
          />

          {!user && (
            <div className="relative">
              <Input
                label="Password (Min. 6 Karakter)"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!user}
                placeholder="••••••••"
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

          <div className="space-y-1.5 w-full">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Peran / Role</label>
            <select
              name="role"
              value={formData.role || 'guru'}
              onChange={handleChange}
              className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="admin">Admin</option>
              <option value="guru">Guru</option>
              <option value="headmaster">Kepala Madrasah</option>
            </select>
          </div>

          <div className="space-y-1.5 w-full">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Status</label>
            <select
              name="isActive"
              value={formData.isActive ? 'true' : 'false'}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
              className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {user ? 'Simpan Perubahan' : 'Buat Akun'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
