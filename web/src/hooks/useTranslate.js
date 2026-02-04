import { useContext } from 'react';
import { TranslationContext } from '@/context/TranslationContext';

export function useTranslate() {
  const context = useContext(TranslationContext);

  if (!context) {
    throw new Error('useTranslate must be used within a TranslationProvider');
  }

  return context;
}
