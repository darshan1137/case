'use client';

import { useEffect, useState } from 'react';
import { Languages, Check, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', nativeName: 'हिंदी' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳', nativeName: 'ગુજરાતી' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳', nativeName: 'తెలుగు' },
  { code: 'bn', name: 'Bengali', flag: '🇮🇳', nativeName: 'বাংলা' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', flag: '🇮🇳', nativeName: 'ਪੰਜਾਬੀ' },
];

export default function GoogleTranslate() {
  const [currentLang, setCurrentLang] = useState('en');
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    // Define the global initializer used by Google's script
    window.googleTranslateElementInit = () => {
      if (!window.google || !window.google.translate) return;
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: languages.map((l) => l.code).join(','),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
      } catch (e) {
        // ignore if initialization fails
      }

      setIsLoaded(true);

      setTimeout(() => {
        const translateElement = document.getElementById('google_translate_element');
        if (translateElement) translateElement.style.display = 'none';
        const gtBanner = document.querySelector('.goog-te-banner-frame');
        if (gtBanner) gtBanner.style.display = 'none';
        document.body.style.top = '0';
        document.body.style.position = 'static';
      }, 100);
    };

    // Add hiding styles to head
    const style = document.createElement('style');
    style.innerHTML = `
      .goog-te-banner-frame,
      .goog-te-balloon-frame,
      .goog-te-ftab-frame {
        display: none !important;
      }
      body {
        top: 0 !important;
        position: static !important;
      }
      #google_translate_element {
        display: none !important;
      }
      .skiptranslate {
        display: none !important;
      }
      body > .skiptranslate {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    const onLoaded = () => {
      setIsLoaded(true);
      setTimeout(() => {
        const translateElement = document.getElementById('google_translate_element');
        if (translateElement) translateElement.style.display = 'none';
        const gtBanner = document.querySelector('.goog-te-banner-frame');
        if (gtBanner) gtBanner.style.display = 'none';
        document.body.style.top = '0';
        document.body.style.position = 'static';
      }, 100);
    };

    window.addEventListener('googleTranslateLoaded', onLoaded);
    if (window.google && window.google.translate) onLoaded();

    return () => {
      if (style.parentNode) style.parentNode.removeChild(style);
      window.removeEventListener('googleTranslateLoaded', onLoaded);
    };
  }, []);

  const changeLanguage = (langCode) => {
    setCurrentLang(langCode);
    
    // First, try to use the select element if it's available
    const selectElement = document.querySelector('.goog-te-combo');
    if (selectElement) {
      selectElement.value = langCode;
      selectElement.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    // Fallback to iframe method
    const iframe = document.querySelector('.goog-te-menu-frame');
    if (!iframe) {
      // Google Translate might not be loaded yet, wait and retry
      setTimeout(() => {
        const retrySelect = document.querySelector('.goog-te-combo');
        if (retrySelect) {
          retrySelect.value = langCode;
          retrySelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, 500);
      return;
    }

    try {
      const innerDoc = iframe.contentDocument || iframe.contentWindow.document;
      const langButtons = innerDoc.querySelectorAll('.goog-te-menu2-item span.text');

      for (let i = 0; i < langButtons.length; i++) {
        const langText = langButtons[i].textContent.trim();
        const lang = languages.find(l => l.name === langText);

        if (lang && lang.code === langCode) {
          langButtons[i].click();
        }
      }
    } catch (error) {
      // Silently handle errors - Google Translate might be loading
      console.log('Google Translate is initializing...');
    }
  };

  // Get current language
  useEffect(() => {
    const checkCurrentLanguage = () => {
      const selectElement = document.querySelector('.goog-te-combo');
      if (selectElement) {
        const currentValue = selectElement.value;
        if (currentValue) {
          setCurrentLang(currentValue);
        }
      }
    };

    const interval = setInterval(checkCurrentLanguage, 1000);
    return () => clearInterval(interval);
  }, [isLoaded]);

  const currentLanguage = languages.find(l => l.code === currentLang) || languages[0];

  return (
    <>
      {/* Hidden Google Translate Element */}
      <div id="google_translate_element" style={{ display: 'none' }}></div>

      {/* Beautiful Custom Language Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="group relative flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50/80 rounded-xl transition-all border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md">
            <Globe className="w-4 h-4 transition-transform group-hover:rotate-12" />
            <span className="hidden sm:inline text-sm font-medium">
              {currentLanguage.flag}
            </span>
            <span className="hidden md:inline text-xs font-medium">
              {currentLanguage.nativeName}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-64 bg-white/98 backdrop-blur-xl border-slate-200/80 shadow-2xl rounded-2xl p-2" 
          align="end"
          sideOffset={8}
        >
          <DropdownMenuLabel className="px-3 py-2 flex items-center gap-2 text-slate-700">
            <Globe className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold">Select Language</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-200/60 my-1" />
          
          <div className="max-h-[400px] overflow-y-auto space-y-1 py-1">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`flex items-center justify-between px-3 py-2.5 mx-1 rounded-xl text-sm cursor-pointer transition-all ${
                  currentLang === lang.code
                    ? 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 shadow-sm'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{lang.nativeName}</span>
                    <span className="text-xs text-slate-500">{lang.name}</span>
                  </div>
                </div>
                {currentLang === lang.code && (
                  <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
