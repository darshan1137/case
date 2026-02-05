'use client';

import { useEffect, useState, useCallback } from 'react';
import { Globe2 } from 'lucide-react';
import { Button } from '@/components/ui';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
];

const translationCache = {};

// Load persisted cache from localStorage
const loadCacheFromStorage = () => {
  try {
    const stored = localStorage.getItem('translationCache');
    if (stored) {
      Object.assign(translationCache, JSON.parse(stored));
    }
  } catch (e) {
    console.error('Failed to load translation cache:', e);
  }
};

// Save cache to localStorage
const saveCacheToStorage = () => {
  try {
    localStorage.setItem('translationCache', JSON.stringify(translationCache));
  } catch (e) {
    console.error('Failed to save translation cache:', e);
  }
};

// Call on module load
if (typeof window !== 'undefined') {
  loadCacheFromStorage();
}

// Batch translation API calls for faster processing
const batchTranslate = async (texts, targetLang) => {
  const results = new Map();
  const uncachedTexts = [];
  
  // First, check cache for all texts
  texts.forEach(text => {
    const cacheKey = `${text}|${targetLang}`;
    if (translationCache[cacheKey]) {
      results.set(text, translationCache[cacheKey]);
    } else {
      uncachedTexts.push(text);
    }
  });

  // Translate only uncached texts
  if (uncachedTexts.length > 0) {
    // Group texts for batch processing
    for (let i = 0; i < uncachedTexts.length; i += 5) {
      const batch = uncachedTexts.slice(i, i + 5);
      const batchPromises = batch.map(text => translateText(text, targetLang));
      
      try {
        const translations = await Promise.all(batchPromises);
        batch.forEach((text, idx) => {
          if (translations[idx]) {
            results.set(text, translations[idx]);
          }
        });
      } catch (error) {
        console.error('Batch translation error:', error);
      }

      // Small delay between batches to avoid rate limiting
      if (i + 5 < uncachedTexts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  return results;
};

const translateText = async (text, targetLang) => {
  if (!text || text.trim().length === 0) return text;
  if (targetLang === 'en') return text;

  const cacheKey = `${text}|${targetLang}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  try {
    const pair = `en|${targetLang}`;
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}`,
      { headers: { 'User-Agent': 'MyMemoryAPI' } }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.responseStatus === 200 && data.responseData) {
        const translated = data.responseData.translatedText;
        translationCache[cacheKey] = translated;
        saveCacheToStorage(); // Persist cache
        return translated;
      }
    }
  } catch (error) {
    console.error('Translation API error:', error);
  }
  
  return text;
};

const translatePageContent = async (langCode) => {
  if (langCode === 'en') {
    window.location.reload();
    return;
  }

  try {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    const nodesToTranslate = [];
    let node;

    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      
      if (
        text &&
        text.length > 0 &&
        text.length < 300 &&
        !/^[\d\s\-().,/:@#$%&*+=\[\]{}!?;'"<>°|~`\\^]*$/.test(text) &&
        !text.toLowerCase().includes('google') &&
        !text.toLowerCase().includes('translate') &&
        node.parentElement?.tagName !== 'SCRIPT' &&
        node.parentElement?.tagName !== 'STYLE'
      ) {
        nodesToTranslate.push(node);
      }
    }

    // Batch translate all texts at once for speed
    const textContents = nodesToTranslate.map(n => n.textContent);
    const translationMap = await batchTranslate(textContents, langCode);

    // Apply translations to DOM
    nodesToTranslate.forEach((textNode) => {
      const originalText = textNode.textContent;
      const translatedText = translationMap.get(originalText);
      
      if (translatedText && translatedText !== originalText) {
        textNode.textContent = translatedText;
      }
    });

    console.log(`Translation to ${langCode} completed - ${translationMap.size} phrases translated`);
  } catch (error) {
    console.error('Page translation error:', error);
  }
};

export default function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState('en');
  const [isOpen, setIsOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('selectedLanguage');
    if (savedLang && LANGUAGES.find(l => l.code === savedLang)) {
      setCurrentLang(savedLang);
    }
  }, []);

  const changeLanguage = useCallback(async (langCode) => {
    if (langCode === currentLang) {
      setIsOpen(false);
      return;
    }

    setIsTranslating(true);
    setCurrentLang(langCode);
    localStorage.setItem('selectedLanguage', langCode);

    await translatePageContent(langCode);
    
    setIsOpen(false);
    setIsTranslating(false);
  }, [currentLang]);

  const getCurrentLanguage = () => {
    return LANGUAGES.find(lang => lang.code === currentLang) || LANGUAGES[0];
  };

  return (
    <div className="relative">
      {/* Language Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTranslating}
        className="group relative flex items-center gap-2 h-9 px-3 rounded-lg hover:bg-orange-50 dark:hover:bg-slate-700 transition-all duration-200 border border-gray-200 dark:border-slate-600 hover:border-orange-300 dark:hover:border-orange-500 disabled:opacity-50 disabled:cursor-wait bg-white dark:bg-slate-800"
      >
        <Globe2 className={`w-4 h-4 text-orange-500 ${isTranslating ? 'animate-spin' : ''}`} />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
          {getCurrentLanguage().code.toUpperCase()}
        </span>
        <svg
          className={`w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {/* Language Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg rounded-lg z-[9999] overflow-hidden">
          <div className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600 flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-sm text-gray-900 dark:text-white">Select Language</span>
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {LANGUAGES.map((lang) => {
              const isActive = currentLang === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between text-sm transition-colors duration-200 ${
                    isActive
                      ? 'bg-orange-50 dark:bg-orange-900/30 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 text-center font-bold text-xs ${
                      isActive ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {lang.code.toUpperCase()}
                    </span>
                    <div className="flex flex-col">
                      <span className={`font-medium ${isActive ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                        {lang.native}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {lang.name}
                      </span>
                    </div>
                  </div>
                  {isActive && (
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <div className="px-3 py-2 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Powered by MyMemory API
            </p>
            {isTranslating && (
              <p className="text-xs text-orange-500 dark:text-orange-400 text-center mt-1 animate-pulse">
                Translating...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
