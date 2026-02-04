'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const DropdownMenuContext = React.createContext({
  open: false,
  setOpen: () => {},
});

export function DropdownMenu({ children, open: controlledOpen, onOpenChange }) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ children, asChild }) {
  const { open, setOpen } = React.useContext(DropdownMenuContext);
  const triggerRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target)) {
        const content = document.querySelector('[data-dropdown-content]');
        if (content && !content.contains(event.target)) {
          setOpen(false);
        }
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, setOpen]);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref: triggerRef,
      onClick: (e) => {
        children.props.onClick?.(e);
        setOpen(!open);
      },
      'aria-expanded': open,
      'aria-haspopup': 'true',
    });
  }

  return (
    <button
      ref={triggerRef}
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      aria-haspopup="true"
      className="focus:outline-none"
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}) {
  const { open, setOpen } = React.useContext(DropdownMenuContext);
  const contentRef = React.useRef(null);

  if (!open) return null;

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <div
      ref={contentRef}
      data-dropdown-content
      className={cn(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-xl border bg-white shadow-lg',
        'animate-in fade-in-0 zoom-in-95',
        alignmentClasses[align],
        className
      )}
      style={{ top: `calc(100% + ${sideOffset}px)` }}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  className,
  onClick,
  asChild,
  ...props
}) {
  const { setOpen } = React.useContext(DropdownMenuContext);

  const handleClick = (e) => {
    onClick?.(e);
    setOpen(false);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        handleClick(e);
      },
      className: cn(children.props.className),
    });
  }

  return (
    <div
      role="menuitem"
      onClick={handleClick}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none',
        'transition-colors',
        'hover:bg-slate-100 focus:bg-slate-100',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({ children, className, ...props }) {
  return (
    <div
      className={cn('px-2 py-1.5 text-sm font-semibold text-slate-900', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className, ...props }) {
  return (
    <div
      className={cn('-mx-1 my-1 h-px bg-slate-200', className)}
      {...props}
    />
  );
}
