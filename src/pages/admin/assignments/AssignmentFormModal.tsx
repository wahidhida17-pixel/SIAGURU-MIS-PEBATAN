import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { assignmentService } from '../../../services/assignmentService';
import { teacherService } from '../../../services/teacherService';
import { classService } from '../../../services/classService';
import { subjectService } from '../../../services/subjectService';
import { settingsService } from '../../../services/settingsService';
import type { Assignment, ClassData, Subject } from '../../../types/academic';
import type { Teacher } from '../../../types/teacher';

interface AssignmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment?: Assignment | null;
  onSuccess: () => void;
}

export const AssignmentFormModal: React.FC<AssignmentFormModalProps> = ({ isOpen, onClose, assignment, onSuccess }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState<any>('Ganjil');

  const [formData, setFormData] = useState<Partial<Assignment>>({
    teacherId: '',
    subjectId: '',
    classId: '',
    assignmentType: 'guru_kelas',
    status: 'active'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [teachersData, classesData, subjectsData, settings] = await Promise.all([
        teacherService.getAll(),
        classService.getAll(),
        subjectService.getAll(),
        settingsService.getGeneralSettings()
      ]);
      setTeachers(teachersData.filter(t => t.status === 'active'));
      setClasses(classesData.filter(c => c.status === 'active'));
      setSubjects(subjectsData.filter(s => s.status === 'active'));
      if (settings) {
        setAcademicYear(settings.academicYear);
        setSemester(settings.semester);
      }
    } catch (err) {
      console.error('Error fetching relational data', err);
    }
  };

  useEffect(() => {
    if (assignment) {
      setFormData(assignment);
    } else {
      setFormData({
        teacherId: teachers.length > 0 ? teachers[0].id : '',
        subjectId: '',
        classId: classes.length > 0 ? classes[0].id : '',
        assignmentType: 'guru_kelas',
        status: 'active',
        academicYear,
        semester
      });
    }
    setError(null);
  }, [assignment, isOpen, teachers, classes, academicYear, semester]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const submissionData = {
        ...formData,
        academicYear: formData.academicYear || academicYear,
        semester: formData.semester || semester,
      };

      if (assignment?.id) {
        await assignmentService.update(assignment.id, submissionData);
      } else {
        await assignmentService.create(submissionData as any);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan penugasan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={assignment ? 'Edit Penugasan' : 'Buat Penugasan Baru'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 w-full">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Guru</label>
            <select
              name="teacherId"
              value={formData.teacherId || ''}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="" disabled>Pilih Guru</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.teacherCode})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 w-full">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Jenis Penugasan</label>
            <select
              name="assignmentType"
              value={formData.assignmentType || 'guru_kelas'}
              onChange={handleChange}
              className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="guru_kelas">Guru Kelas</option>
              <option value="guru_mapel">Guru Mapel</option>
            </select>
          </div>

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

          <div className="space-y-1.5 w-full">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Mata Pelajaran</label>
            <select
              name="subjectId"
              value={formData.subjectId || ''}
              onChange={handleChange}
              required={formData.assignmentType === 'guru_mapel'}
              className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="">-- Pilih Mata Pelajaran --</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
            {formData.assignmentType === 'guru_kelas' && (
              <p className="text-xs text-slate-500">Opsional untuk Guru Kelas.</p>
            )}
          </div>
          
          <div className="space-y-1.5 w-full md:col-span-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Status Penugasan</label>
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

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {assignment ? 'Simpan Perubahan' : 'Buat Penugasan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
