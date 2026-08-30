import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, style, ...props }, ref) => {
    let themeCtx: ReturnType<typeof useTheme> | null = null;
    try {
      themeCtx = useTheme();
    } catch {
      // theme context not yet loaded or outside provider
    }

    const currentHex = themeCtx?.currentThemeOption?.primaryHex || '#059669';

    const variants = {
      primary: 'text-white shadow-md hover:opacity-90 active:scale-[0.98]',
      secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700',
      outline: 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
      ghost: 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800',
      danger: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900'
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-12 px-8 text-base'
    };

    const dynamicStyle: React.CSSProperties = {
      ...style,
      ...(variant === 'primary' ? { backgroundColor: currentHex } : {})
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        style={dynamicStyle}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
