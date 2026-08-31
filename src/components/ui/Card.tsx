import React from 'react';
import { cn } from '../../utils/cn';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden transition-colors text-slate-800 dark:text-slate-100", 
        className
      )} 
      {...props} 
    />
  )
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between", 
        className
      )} 
      {...props} 
    />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 
      ref={ref} 
      className={cn(
        "font-bold text-slate-800 dark:text-slate-100 tracking-tight", 
        className
      )} 
      {...props} 
    />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p 
      ref={ref} 
      className={cn("text-xs text-slate-500 dark:text-slate-400 mt-1", className)} 
      {...props} 
    />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn("p-5 text-slate-700 dark:text-slate-300", className)} 
      {...props} 
    />
  )
);
CardContent.displayName = "CardContent";
