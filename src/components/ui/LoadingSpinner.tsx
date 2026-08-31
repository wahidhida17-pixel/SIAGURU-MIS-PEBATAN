import React from 'react';
import { cn } from '../../utils/cn';

export interface LoadingSpinnerProps {
  className?: string;
  text?: string;
  size?: 'sm' | 'md' | 'lg' | string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className, text, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-14 h-14 border-4',
  }[size] || 'w-10 h-10 border-4';

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <div className={cn("border-emerald-200 border-t-emerald-600 rounded-full animate-spin", sizeClasses)}></div>
      {text && <p className="text-emerald-700 font-medium">{text}</p>}
    </div>
  );
};
