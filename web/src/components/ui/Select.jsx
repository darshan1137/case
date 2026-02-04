'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Select = forwardRef(
  ({ className, error, children, placeholder, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500',
          className
        )}
        ref={ref}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

export { Select };
