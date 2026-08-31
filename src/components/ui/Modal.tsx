import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full' | string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth, size }) => {
  if (!isOpen) return null;

  const sizeMap: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-full',
  };

  const calculatedMaxWidth = maxWidth || (size ? sizeMap[size] || `max-w-${size}` : 'max-w-md');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full ${calculatedMaxWidth} flex flex-col max-h-[90vh] overflow-hidden text-slate-800 dark:text-slate-100 transition-colors`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
