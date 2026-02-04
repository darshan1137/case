'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    const html = document.documentElement;
    
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Check current class
      if (html.classList.contains('dark')) {
        setTheme('dark');
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('system');
        applyTheme('system');
      }
    }
  }, []);

  const applyTheme = (newTheme) => {
    const html = document.documentElement;
    
    if (newTheme === 'dark') {
      html.classList.remove('light');
      html.classList.add('dark');
    } else if (newTheme === 'light') {
      html.classList.remove('dark');
      html.classList.add('light');
    } else if (newTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.classList.remove('dark', 'light');
      html.classList.add(systemPrefersDark ? 'dark' : 'light');
    }
  };

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    applyTheme(nextTheme);
  };

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <Sun className="w-4 h-4 text-slate-600 dark:text-slate-400" />
      </button>
    );
  }

  const getIcon = () => {
    if (theme === 'dark') {
      return <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    } else if (theme === 'system') {
      return <Monitor className="w-4 h-4 text-green-600 dark:text-green-400" />;
    }
    return <Sun className="w-4 h-4 text-orange-500" />;
  };

  const getLabel = () => {
    if (theme === 'dark') return 'Dark';
    if (theme === 'system') return 'Auto';
    return 'Light';
  };

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-all border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500"
      title={`Theme: ${getLabel()}`}
    >
      {getIcon()}
      <span className="text-sm font-medium hidden sm:inline">
        {getLabel()}
      </span>
    </button>
  );
}
