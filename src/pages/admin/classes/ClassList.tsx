import React, { useState, useEffect } from 'react';
import { Plus, Edit2, LayoutTemplate } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { classService } from '../../../services/classService';
import type { ClassData } from '../../../types/academic';
import { useAuth } from '../../../hooks/useAuth';
import { auditService } from '../../../services/auditService';
import { teacherService } from '../../../services/teacherService';
import type { Teacher } from '../../../types/teacher';

export const ClassList: React.FC = () => {
  const { userProfile } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ClassData>>({
    name: '',
    gradeLevel: 1,
    parallel: 'A',
    homeroomTeacherId: '',
    academicYear: '2026/2027',
    status: 'active'
  });

  useEffect(() => {
    fetchData();
    fetchTeachers();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await classService.getAll();
      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchTeachers = async () => {
    try {
      const t = await teacherService.getActive();
      setTeachers(t.filter(x => x.teacherType === 'guru_kelas'));
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleOpenModal = (c?: ClassData) => {
    if (c) {
      setEditingId(c.id!);
      setFormData(c);
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        gradeLevel: 1,
        parallel: 'A',
        homeroomTeacherId: '',
        academicYear: '2026/2027',
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await classService.update(editingId, formData);
        await auditService.log(userProfile!.uid, userProfile!.displayName, 'UPDATE_CLASS', 'classes', editingId, `Update kelas ${formData.name}`);
      } else {
        const newId = await classService.create(formData as Omit<ClassData, 'id'>);
        await auditService.log(userProfile!.uid, userProfile!.displayName, 'CREATE_CLASS', 'classes', newId, `Buat kelas ${formData.name}`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving class:", error);
      alert('Gagal menyimpan data.');
    }
  };

  const filteredData = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.academicYear.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Data Kelas</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola data kelas MI Syuriyah Pebatan</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kelas
        </Button>
      </div>

      <DataTable<ClassData>
        data={filteredData}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari kelas..."
        isLoading={isLoading}
        columns={[
          {
            header: 'Kelas',
            cell: (item) => (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Kelas {item.name}</p>
                  <p className="text-xs text-slate-500">Tingkat {item.gradeLevel} • Paralel {item.parallel}</p>
                </div>
              </div>
            )
          },
          {
            header: 'Tahun Pelajaran',
            accessorKey: 'academicYear'
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
                <Button variant="outline" size="sm" onClick={() => handleOpenModal(item)}>
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
              </div>
            )
          }
        ]}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Kelas' : 'Tambah Kelas Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Nama Kelas" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            placeholder="Contoh: 6A"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tingkat</label>
              <select 
                value={formData.gradeLevel} 
                onChange={(e) => setFormData({...formData, gradeLevel: Number(e.target.value)})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              >
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <Input 
              label="Paralel" 
              value={formData.parallel} 
              onChange={(e) => setFormData({...formData, parallel: e.target.value})} 
              placeholder="Contoh: A"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Wali Kelas</label>
            <select 
              value={formData.homeroomTeacherId} 
              onChange={(e) => setFormData({...formData, homeroomTeacherId: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Pilih Wali Kelas --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.teacherCode}>{t.name} ({t.teacherCode})</option>
              ))}
            </select>
          </div>
          <Input 
            label="Tahun Pelajaran" 
            value={formData.academicYear} 
            onChange={(e) => setFormData({...formData, academicYear: e.target.value})} 
            required
          />
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
            <select 
              value={formData.status} 
              onChange={(e) => setFormData({...formData, status: e.target.value as any})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
          
          <div className="pt-4 flex gap-3 justify-end border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit">Simpan Kelas</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
