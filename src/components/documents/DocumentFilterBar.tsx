import React, { useState } from 'react';
import {
  Search,
  Filter,
  Star,
  FileText,
  FileSpreadsheet,
  FileImage,
  Layers,
  Calendar,
  Grid,
  List,
  X
} from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../../services/documentService';
import type { ClassData, Subject, Semester } from '../../types/academic';

interface DocumentFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  fileType: string;
  onFileTypeChange: (val: string) => void;
  academicYear: string;
  onAcademicYearChange: (val: string) => void;
  semester: Semester | 'all';
  onSemesterChange: (val: Semester | 'all') => void;
  classId: string;
  onClassIdChange: (val: string) => void;
  subjectId: string;
  onSubjectIdChange: (val: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (val: boolean) => void;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  classes: ClassData[];
  subjects: Subject[];
  totalCount: number;
}

export const DocumentFilterBar: React.FC<DocumentFilterBarProps> = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  fileType,
  onFileTypeChange,
  academicYear,
  onAcademicYearChange,
  semester,
  onSemesterChange,
  classId,
  onClassIdChange,
  subjectId,
  onSubjectIdChange,
  isFavorite,
  onToggleFavorite,
  viewMode,
  onViewModeChange,
  classes,
  subjects,
  totalCount
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileTypeOptions = [
    { key: 'all', label: 'Semua Format' },
    { key: 'pdf', label: 'PDF' },
    { key: 'doc', label: 'Word' },
    { key: 'xls', label: 'Excel' },
    { key: 'jpg', label: 'Gambar' }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
      {/* Top Search & Primary Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Cari nama dokumen, tag, kategori, atau guru..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category selector */}
        <div className="sm:w-56 shrink-0">
          <select
            value={category}
            onChange={e => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Kategori</option>
            {DEFAULT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Favorite toggle & Filter toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onToggleFavorite(!isFavorite)}
            className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors border ${
              isFavorite
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            <Star className="w-3.5 h-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
            <span className="hidden sm:inline">Favorit</span>
          </button>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors border ${
              showAdvanced
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter Detail</span>
          </button>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Tampilan Grid"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* File type chip pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-semibold text-slate-400 mr-1 shrink-0">Format:</span>
        {fileTypeOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => onFileTypeChange(opt.key)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
              fileType === opt.key
                ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 font-semibold'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-slate-400 shrink-0">
          Menampilkan <strong className="text-slate-700 dark:text-slate-200">{totalCount}</strong> dokumen
        </span>
      </div>

      {/* Advanced collapsible filter bar */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in duration-150">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Tahun Ajaran</label>
            <select
              value={academicYear}
              onChange={e => onAcademicYearChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">Semua Tahun</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
              <option value="2027/2028">2027/2028</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Semester</label>
            <select
              value={semester}
              onChange={e => onSemesterChange(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">Semua Semester</option>
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Kelas</label>
            <select
              value={classId}
              onChange={e => onClassIdChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">Semua Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Mata Pelajaran</label>
            <select
              value={subjectId}
              onChange={e => onSubjectIdChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">Semua Mapel</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
