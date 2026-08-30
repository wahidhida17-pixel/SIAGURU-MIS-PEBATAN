import React, { useState, useEffect } from 'react';
import { Plus, Edit2, BookOpen } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { subjectService } from '../../../services/subjectService';
import type { Subject } from '../../../types/academic';
import { useAuth } from '../../../hooks/useAuth';
import { auditService } from '../../../services/auditService';

export const SubjectList: React.FC = () => {
  const { userProfile } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Subject>>({
    code: '',
    name: '',
    category: 'umum',
    description: '',
    status: 'active'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await subjectService.getAll();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenModal = (s?: Subject) => {
    if (s) {
      setEditingId(s.id!);
      setFormData(s);
    } else {
      setEditingId(null);
      setFormData({
        code: '',
        name: '',
        category: 'umum',
        description: '',
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await subjectService.update(editingId, formData);
        await auditService.log(userProfile!.uid, userProfile!.displayName, 'UPDATE_SUBJECT', 'subjects', editingId, `Update mapel ${formData.name}`);
      } else {
        const newId = await subjectService.create(formData as Omit<Subject, 'id'>);
        await auditService.log(userProfile!.uid, userProfile!.displayName, 'CREATE_SUBJECT', 'subjects', newId, `Buat mapel ${formData.name}`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving subject:", error);
      alert('Gagal menyimpan data.');
    }
  };

  const filteredData = subjects.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Mata Pelajaran</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola data mata pelajaran madrasah</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Mapel
        </Button>
      </div>

      <DataTable<Subject>
        data={filteredData}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari kode atau nama..."
        isLoading={isLoading}
        filters={
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-600"
          >
            <option value="all">Semua Kategori</option>
            <option value="umum">Umum</option>
            <option value="agama">Agama</option>
            <option value="muatan_lokal">Muatan Lokal</option>
            <option value="lainnya">Lainnya</option>
          </select>
        }
        columns={[
          {
            header: 'Mata Pelajaran',
            cell: (item) => (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">Kode: {item.code}</p>
                </div>
              </div>
            )
          },
          {
            header: 'Kategori',
            cell: (item) => (
              <span className="capitalize text-sm font-medium text-slate-600">{item.category.replace('_', ' ')}</span>
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
        title={editingId ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Kode Mapel" 
            value={formData.code} 
            onChange={(e) => setFormData({...formData, code: e.target.value})} 
            placeholder="Contoh: AQH"
            required
          />
          <Input 
            label="Nama Mapel" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            placeholder="Contoh: Al-Qur'an Hadits"
            required
          />
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Kategori</label>
            <select 
              value={formData.category} 
              onChange={(e) => setFormData({...formData, category: e.target.value as any})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="umum">Umum</option>
              <option value="agama">Agama</option>
              <option value="muatan_lokal">Muatan Lokal</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Deskripsi</label>
            <textarea 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              rows={3}
            ></textarea>
          </div>
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
            <Button type="submit">Simpan Mapel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
