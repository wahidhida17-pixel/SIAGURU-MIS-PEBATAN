import React, { useState, useEffect } from 'react';
import { classService } from '../../../services/classService';
import { teacherService } from '../../../services/teacherService';
import { studentService } from '../../../services/studentService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Search, ChevronRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ClassData } from '../../../types/academic';
import type { Teacher } from '../../../types/teacher';

export const HeadmasterClassesView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<(ClassData & { teacherName?: string; studentCount?: number })[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clsList, teachers, students] = await Promise.all([
        classService.getAll(),
        teacherService.getAll(),
        studentService.getAll()
      ]);

      const mappedClasses = clsList.map(c => {
        const teacher = teachers.find(t => t.id === c.homeroomTeacherId);
        const studentCount = students.filter(s => s.classId === c.id).length;
        return {
          ...c,
          teacherName: teacher?.name || 'Belum diatur',
          studentCount
        };
      });

      setClasses(mappedClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = classes.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Monitoring Kelas</h1>
          <p className="text-slate-500">Pantau progres administrasi, nilai, dan rapor per kelas.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kelas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><LoadingSpinner /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredData.map(cls => (
              <div key={cls.id} className="border border-slate-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-emerald-800">{cls.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">Wali: <span className="font-medium text-slate-700">{cls.teacherName}</span></p>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-emerald-50 w-12 h-12 rounded-lg border border-emerald-100">
                    <Users className="w-5 h-5 text-emerald-600 mb-0.5" />
                    <span className="text-xs font-bold text-emerald-700">{cls.studentCount}</span>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Kehadiran</span>
                      <span className="font-semibold text-slate-700">95%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Nilai & Asesmen</span>
                      <span className="font-semibold text-slate-700">80%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Progres Rapor</span>
                      <span className="font-semibold text-slate-700">60%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>

                <Link 
                  to={`/headmaster/classes/${cls.id}`}
                  className="mt-5 w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  Lihat Detail Kelas <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}

            {filteredData.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                Tidak ada kelas yang ditemukan.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
