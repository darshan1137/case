'use client';

import { cn } from '@/lib/utils';

const Spinner = ({ className, size = 'default', ...props }) => {
  const sizes = {
    sm: 'h-4 w-4',
    default: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-200 border-t-blue-600',
        sizes[size],
        className
      )}
      {...props}
    />
  );
};

const LoadingOverlay = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-lg bg-white p-6 shadow-xl">
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="lg" />
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
};

const PageLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Spinner size="lg" />
    </div>
  );
};

export { Spinner, LoadingOverlay, PageLoader };
