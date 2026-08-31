import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { teacherService } from '../../../services/teacherService';
import type { Teacher, TeacherType, TeacherStatus } from '../../../types/teacher';

interface TeacherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher?: Teacher | null;
  onSuccess: () => void;
}

export const TeacherFormModal: React.FC<TeacherFormModalProps> = ({ isOpen, onClose, teacher, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Teacher>>({
    name: '',
    nip: '',
    nuptk: '',
    teacherCode: '',
    email: '',
    phone: '',
    gender: 'L',
    teacherType: 'guru_kelas',
    status: 'active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teacher) {
      setFormData(teacher);
    } else {
      setFormData({
        name: '',
        nip: '',
        nuptk: '',
        teacherCode: '',
        email: '',
        phone: '',
        gender: 'L',
        teacherType: 'guru_kelas',
        status: 'active',
      });
    }
    setError(null);
  }, [teacher, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (teacher?.id) {
        await teacherService.update(teacher.id, formData);
      } else {
        await teacherService.create(formData as any);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data guru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={teacher ? 'Edit Data Guru' : 'Tambah Guru Baru'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nama Lengkap (beserta gelar)"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            required
            placeholder="Contoh: H. Ahmad, S.Pd.I"
          />
          <Input
            label="Kode Guru"
            name="teacherCode"
            value={formData.teacherCode || ''}
            onChange={handleChange}
            required
            placeholder="Contoh: G-001"
          />
          <Input
            label="NIP (Opsional)"
            name="nip"
            value={formData.nip || ''}
            onChange={handleChange}
            placeholder="Contoh: 19800101..."
          />
          <Input
            label="NUPTK (Opsional)"
            name="nuptk"
            value={formData.nuptk || ''}
            onChange={handleChange}
            placeholder="Contoh: 1234567890"
          />
          <div className="space-y-1.5 w-full">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Jenis Kelamin</label>
            <select
              name="gender"
              value={formData.gender || 'L'}
              onChange={handleChange}
              className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
          <div className="space-y-1.5 w-full">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Jenis Guru</label>
            <select
              name="teacherType"
              value={formData.teacherType || 'guru_kelas'}
              onChange={handleChange}
              className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="guru_kelas">Guru Kelas</option>
              <option value="guru_mapel">Guru Mapel</option>
              <option value="guru_agama">Guru Agama</option>
            </select>
          </div>
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={handleChange}
            placeholder="guru@example.com"
          />
          <Input
            label="No. HP / WhatsApp"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            placeholder="0812xxxxxx"
          />
          <div className="space-y-1.5 w-full">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Status</label>
            <select
              name="status"
              value={formData.status || 'active'}
              onChange={handleChange}
              className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {teacher ? 'Simpan Perubahan' : 'Tambah Guru'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
