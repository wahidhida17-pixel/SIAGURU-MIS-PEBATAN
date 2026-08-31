import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Users, Eye, Trash2, Mail, Phone, Award, BookOpen } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { teacherService } from '../../../services/teacherService';
import type { Teacher } from '../../../types/teacher';
import { TeacherFormModal } from './TeacherFormModal';

export const TeacherList: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null);

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

  const handleAdd = () => {
    setSelectedTeacher(null);
    setIsModalOpen(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleDelete = async (teacher: Teacher) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data guru "${teacher.name}"?`)) {
      try {
        if (teacher.id) {
          await teacherService.delete(teacher.id);
          fetchData();
        }
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus data guru.');
      }
    }
  };

  const filteredData = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.teacherCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.nip || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || t.teacherType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Data Guru</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Kelola data guru MI Syuriyah Pebatan</p>
        </div>
        <Button onClick={handleAdd} className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white">
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
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-600 dark:text-slate-300"
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
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold overflow-hidden border border-emerald-200 dark:border-emerald-800">
                  {item.photoURL ? <img src={item.photoURL} alt={item.name} className="w-full h-full object-cover" /> : item.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{item.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.teacherCode} {item.nip ? `• NIP: ${item.nip}` : ''}</p>
                </div>
              </div>
            )
          },
          {
            header: 'Jenis',
            cell: (item) => (
              <span className="capitalize text-sm font-medium text-slate-600 dark:text-slate-300">
                {item.teacherType.replace('_', ' ')}
              </span>
            )
          },
          {
            header: 'Status',
            cell: (item) => (
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                item.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {item.status === 'active' ? 'Aktif' : 'Nonaktif'}
              </span>
            )
          },
          {
            header: 'Aksi',
            cell: (item) => (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewTeacher(item)} title="Lihat Profil">
                  <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEdit(item)} title="Edit Guru">
                  <Edit2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(item)} title="Hapus Guru" className="hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </Button>
              </div>
            )
          }
        ]}
      />

      <TeacherFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchData();
        }}
        teacher={selectedTeacher}
      />

      {/* View Detail Modal */}
      {viewTeacher && (
        <Modal isOpen={!!viewTeacher} onClose={() => setViewTeacher(null)} title="Biodata Lengkap Guru" size="md">
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-800 dark:text-emerald-300 text-xl font-bold border border-emerald-200 dark:border-emerald-800 shrink-0">
                {viewTeacher.photoURL ? <img src={viewTeacher.photoURL} alt={viewTeacher.name} className="w-full h-full rounded-2xl object-cover" /> : viewTeacher.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{viewTeacher.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Kode: {viewTeacher.teacherCode} • {viewTeacher.teacherType.replace('_', ' ')}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${viewTeacher.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                  {viewTeacher.status === 'active' ? 'Aktif Mengajar' : 'Nonaktif'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-0.5">NIP</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewTeacher.nip || '-'}</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-0.5">NUPTK</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewTeacher.nuptk || '-'}</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-0.5">Email</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{viewTeacher.email || '-'}</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-0.5">No. Telepon / WA</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewTeacher.phone || '-'}</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-0.5">Jenis Kelamin</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewTeacher.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-0.5">Status Kepegawaian</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewTeacher.employmentStatus || 'GTT / Yayasan'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setViewTeacher(null)}>
                Tutup
              </Button>
              <Button onClick={() => { const t = viewTeacher; setViewTeacher(null); handleEdit(t); }} className="bg-emerald-600 text-white">
                <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                Edit Data
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
