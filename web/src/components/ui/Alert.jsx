'use client';

import { cn } from '@/lib/utils';

const Alert = ({ className, variant = 'default', children, ...props }) => {
  const variants = {
    default: 'bg-gray-50 text-gray-800 border-gray-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error: 'bg-red-50 text-red-800 border-red-200',
  };

  return (
    <div
      className={cn(
        'relative w-full rounded-lg border p-4',
        variants[variant],
        className
      )}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
};

const AlertTitle = ({ className, children, ...props }) => {
  return (
    <h5
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h5>
  );
};

const AlertDescription = ({ className, children, ...props }) => {
  return (
    <div className={cn('text-sm opacity-90', className)} {...props}>
      {children}
    </div>
  );
};

export { Alert, AlertTitle, AlertDescription };
