import React, { useState, useEffect } from 'react';
import { Plus, Edit2, ShieldCheck, Trash2 } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { assignmentService } from '../../../services/assignmentService';
import type { Assignment } from '../../../types/academic';

export const AssignmentList: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await assignmentService.getAll();
      setAssignments(data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = assignments.filter(a => {
    return a.teacherId.toLowerCase().includes(searchTerm.toLowerCase()) || 
           a.subjectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
           a.classId.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Penugasan Guru</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola relasi Guru, Mata Pelajaran, dan Kelas</p>
        </div>
        <Button onClick={() => alert('Fitur tambah penugasan')} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Buat Penugasan
        </Button>
      </div>

      <DataTable<Assignment>
        data={filteredData}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari ID guru, kelas, atau mapel..."
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
                  <p className="font-bold text-slate-800">{item.teacherId}</p>
                  <p className="text-xs text-slate-500 font-medium">
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
              <span className="text-sm font-medium text-slate-700">{item.subjectId || '-'}</span>
            )
          },
          {
            header: 'Kelas',
            cell: (item) => (
              <span className="text-sm font-medium text-slate-700">{item.classId}</span>
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
                <Button variant="outline" size="sm" onClick={() => alert('Hapus penugasan')}>
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </Button>
              </div>
            )
          }
        ]}
      />
    </div>
  );
};
