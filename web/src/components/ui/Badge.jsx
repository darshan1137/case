'use client';

import { cn } from '@/lib/utils';

const Badge = ({ className, variant = 'default', children, ...props }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-800 border border-slate-200',
    primary: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    secondary: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    danger: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
    outline: 'border-2 border-slate-300 text-slate-700 bg-transparent',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export { Badge };
