import React, { useState, useEffect } from 'react';
import { Plus, Edit2, ShieldCheck, Trash2 } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { assignmentService } from '../../../services/assignmentService';
import { teacherService } from '../../../services/teacherService';
import { classService } from '../../../services/classService';
import { subjectService } from '../../../services/subjectService';
import type { Assignment, ClassData, Subject } from '../../../types/academic';
import type { Teacher } from '../../../types/teacher';
import { AssignmentFormModal } from './AssignmentFormModal';

export const AssignmentList: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [assignmentsData, teachersData, classesData, subjectsData] = await Promise.all([
        assignmentService.getAll(),
        teacherService.getAll(),
        classService.getAll(),
        subjectService.getAll()
      ]);
      setAssignments(assignmentsData);
      setTeachers(teachersData);
      setClasses(classesData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedAssignment(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus penugasan ini?')) {
      try {
        await assignmentService.delete(id);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus penugasan.');
      }
    }
  };

  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || id;
  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || id;
  const getSubjectName = (id: string) => {
    if (!id) return '-';
    return subjects.find(s => s.id === id)?.name || id;
  };

  const filteredData = assignments.filter(a => {
    const teacherName = getTeacherName(a.teacherId).toLowerCase();
    const subjectName = getSubjectName(a.subjectId).toLowerCase();
    const className = getClassName(a.classId).toLowerCase();
    const term = searchTerm.toLowerCase();
    return teacherName.includes(term) || subjectName.includes(term) || className.includes(term);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Penugasan Guru</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola relasi Guru, Mata Pelajaran, dan Kelas</p>
        </div>
        <Button onClick={handleAdd} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Buat Penugasan
        </Button>
      </div>

      <DataTable<Assignment>
        data={filteredData}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari nama guru, kelas, atau mapel..."
        isLoading={isLoading}
        columns={[
          {
            header: 'Info Penugasan',
            cell: (item) => (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{getTeacherName(item.teacherId)}</p>
                  <p className="text-xs text-slate-500 font-medium capitalize">
                    {item.assignmentType.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1 font-bold uppercase tracking-wider">
                    {item.academicYear} • {item.semester}
                  </p>
                </div>
              </div>
            )
          },
          {
            header: 'Mata Pelajaran',
            cell: (item) => (
              <span className="text-sm font-medium text-slate-700">{getSubjectName(item.subjectId)}</span>
            )
          },
          {
            header: 'Kelas',
            cell: (item) => (
              <span className="text-sm font-medium text-slate-700">{getClassName(item.classId)}</span>
            )
          },
          {
            header: 'Status',
            cell: (item) => (
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                item.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {item.status === 'active' ? 'Aktif' : 'Nonaktif'}
              </span>
            )
          },
          {
            header: 'Aksi',
            cell: (item) => (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDelete(item.id!)}>
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </Button>
              </div>
            )
          }
        ]}
      />

      <AssignmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchData();
        }}
        assignment={selectedAssignment}
      />
    </div>
  );
};
