import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Users, Eye, Download, Upload } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { studentService } from '../../../services/studentService';
import type { Student } from '../../../types/academic';

export const StudentList: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await studentService.getAll();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.nisn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'all' || s.classId === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Data Siswa</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola data siswa madrasah</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => alert('Import Excel')}>
            <Upload className="w-4 h-4 mr-2" /> Import
          </Button>
          <Button variant="outline" onClick={() => alert('Export Excel')}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button onClick={() => alert('Fitur tambah siswa')}>
            <Plus className="w-4 h-4 mr-2" />
            Siswa
          </Button>
        </div>
      </div>

      <DataTable<Student>
        data={filteredData}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari nama, NIS, atau NISN..."
        isLoading={isLoading}
        filters={
          <select 
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-600"
          >
            <option value="all">Semua Kelas</option>
            {/* TODO: Load active classes here */}
            <option value="KLS-DEMO">Kelas Demo</option>
          </select>
        }
        columns={[
          {
            header: 'Siswa',
            cell: (item) => (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold overflow-hidden border border-blue-100">
                  {item.photoURL ? <img src={item.photoURL} alt={item.name} className="w-full h-full object-cover" /> : item.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">NIS: {item.nis} • L/P: {item.gender}</p>
                </div>
              </div>
            )
          },
          {
            header: 'Kelas',
            cell: (item) => (
              <div className="text-sm font-medium text-slate-700">
                {item.classId /* TODO: Map ID to name */}
              </div>
            )
          },
          {
            header: 'Status',
            cell: (item) => (
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                item.status === 'aktif' ? 'bg-emerald-50 text-emerald-700' : 
                item.status === 'lulus' ? 'bg-blue-50 text-blue-700' :
                'bg-slate-100 text-slate-500'
              }`}>
                {item.status}
              </span>
            )
          },
          {
            header: 'Aksi',
            cell: (item) => (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => alert('Detail')}>
                  <Eye className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => alert('Edit')}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )
          }
        ]}
      />
    </div>
  );
};
