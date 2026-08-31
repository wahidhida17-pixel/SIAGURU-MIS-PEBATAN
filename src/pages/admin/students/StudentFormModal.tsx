import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { studentService } from '../../../services/studentService';
import { classService } from '../../../services/classService';
import type { Student, ClassData } from '../../../types/academic';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  onSuccess: () => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({ isOpen, onClose, student, onSuccess }) => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  
  const [formData, setFormData] = useState<Partial<Student>>({
    nis: '',
    nisn: '',
    name: '',
    gender: 'L',
    birthPlace: '',
    birthDate: '',
    classId: '',
    absentNumber: 1,
    fatherName: '',
    motherName: '',
    guardianName: '',
    guardianPhone: '',
    address: '',
    status: 'aktif' as any,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadClasses();
    }
  }, [isOpen]);

  const loadClasses = async () => {
    try {
      const classData = await classService.getAll();
      setClasses(classData.filter(c => c.status === 'active'));
    } catch (err) {
      console.error('Error fetching classes', err);
    }
  };

  useEffect(() => {
    if (student) {
      setFormData(student);
    } else {
      setFormData({
        nis: '',
        nisn: '',
        name: '',
        gender: 'L',
        birthPlace: '',
        birthDate: '',
        classId: classes.length > 0 ? classes[0].id : '',
        absentNumber: 1,
        fatherName: '',
        motherName: '',
        guardianName: '',
        guardianPhone: '',
        address: '',
        status: 'aktif' as any,
      });
    }
    setError(null);
  }, [student, isOpen, classes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'absentNumber' ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (student?.id) {
        await studentService.update(student.id, formData);
      } else {
        await studentService.create(formData as any);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data siswa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={student ? 'Edit Data Siswa' : 'Tambah Siswa Baru'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nama Lengkap Siswa"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            required
            placeholder="Contoh: Ahmad Fadil"
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

          <Input
            label="NIS (Nomor Induk Siswa)"
            name="nis"
            value={formData.nis || ''}
            onChange={handleChange}
            required
            placeholder="Contoh: 12345"
          />
          <Input
            label="NISN (Nomor Induk Siswa Nasional)"
            name="nisn"
            value={formData.nisn || ''}
            onChange={handleChange}
            required
            placeholder="Contoh: 0123456789"
          />

          <Input
            label="Tempat Lahir"
            name="birthPlace"
            value={formData.birthPlace || ''}
            onChange={handleChange}
            placeholder="Contoh: Subang"
          />
          <Input
            label="Tanggal Lahir"
            name="birthDate"
            type="date"
            value={formData.birthDate || ''}
            onChange={handleChange}
          />

          <div className="space-y-1.5 w-full">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Kelas</label>
            <select
              name="classId"
              value={formData.classId || ''}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="" disabled>Pilih Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="No. Absen"
            name="absentNumber"
            type="number"
            value={formData.absentNumber || 1}
            onChange={handleChange}
            required
            min="1"
          />

          <div className="space-y-1.5 w-full md:col-span-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Status</label>
            <select
              name="status"
              value={formData.status || 'aktif'}
              onChange={handleChange}
              className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="aktif">Aktif</option>
              <option value="lulus">Lulus</option>
              <option value="pindah">Pindah</option>
              <option value="keluar">Keluar</option>
            </select>
          </div>

          <div className="space-y-1.5 w-full md:col-span-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Alamat</label>
            <textarea
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              rows={3}
              className="flex w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              placeholder="Alamat lengkap..."
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {student ? 'Simpan Perubahan' : 'Tambah Siswa'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
