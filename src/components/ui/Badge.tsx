import React from 'react';
import { cn } from '../../utils/cn';

export const Badge: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div className={cn("inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500", className)} {...props}>
      {children}
    </div>
  );
};
