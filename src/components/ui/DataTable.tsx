import React from 'react';
import { Search } from 'lucide-react';

interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    className?: string;
  }[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Cari...',
  filters,
  actions,
  emptyMessage = 'Belum ada data.',
  isLoading = false
}: DataTableProps<T>) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>
          {filters}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[11px]">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-4 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors text-slate-800 dark:text-slate-200">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-6 py-4 ${col.className || ''}`}>
                      {col.cell ? col.cell(item) : col.accessorKey ? String(item[col.accessorKey] || '-') : '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
