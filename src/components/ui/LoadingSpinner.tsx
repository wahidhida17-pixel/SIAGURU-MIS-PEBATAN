import React from 'react';
import { cn } from '../../utils/cn';

export const LoadingSpinner: React.FC<{ className?: string, text?: string }> = ({ className, text }) => {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      {text && <p className="text-emerald-700 font-medium">{text}</p>}
    </div>
  );
};
