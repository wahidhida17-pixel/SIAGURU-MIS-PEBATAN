import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Users, Eye } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { teacherService } from '../../../services/teacherService';
import type { Teacher } from '../../../types/teacher';

export const TeacherList: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await teacherService.getAll();
      setTeachers(data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.teacherCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.nip.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || t.teacherType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Data Guru</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola data guru MI Syuriyah Pebatan</p>
        </div>
        <Button onClick={() => alert('Fitur tambah guru')} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Guru
        </Button>
      </div>

      <DataTable<Teacher>
        data={filteredData}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari nama, NIP, atau kode..."
        isLoading={isLoading}
        filters={
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-600"
          >
            <option value="all">Semua Jenis Guru</option>
            <option value="guru_kelas">Guru Kelas</option>
            <option value="guru_mapel">Guru Mapel</option>
            <option value="guru_agama">Guru Agama</option>
          </select>
        }
        columns={[
          {
            header: 'Profil Guru',
            cell: (item) => (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold overflow-hidden border border-amber-200">
                  {item.photoURL ? <img src={item.photoURL} alt={item.name} className="w-full h-full object-cover" /> : item.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.teacherCode} {item.nip ? `• NIP: ${item.nip}` : ''}</p>
                </div>
              </div>
            )
          },
          {
            header: 'Jenis',
            cell: (item) => (
              <span className="capitalize text-sm font-medium text-slate-600">
                {item.teacherType.replace('_', ' ')}
              </span>
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
