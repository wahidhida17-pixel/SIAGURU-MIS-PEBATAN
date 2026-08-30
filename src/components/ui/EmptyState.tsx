import React from 'react';
import { cn } from '../../utils/cn';
import { Archive } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title = "Belum ada data", 
  description = "Data belum tersedia. Silakan tambahkan data melalui menu Admin.", 
  className 
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
        {icon || <Archive className="h-8 w-8" />}
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm">{description}</p>
    </div>
  );
};
