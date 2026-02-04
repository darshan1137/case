'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from './ui';

export default function ScreenReader() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const synthRef = useRef(null);
  const currentUtteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      stopSpeaking();
      return;
    }

    const handleMouseOver = (e) => {
      if (!isEnabled) return;

      const target = e.target;
      let textToRead = '';

      // Get aria-label first (highest priority)
      if (target.getAttribute('aria-label')) {
        textToRead = target.getAttribute('aria-label');
      }
      // Get button/link text
      else if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        textToRead = target.textContent?.trim() || target.getAttribute('title') || '';
      }
      // Get input labels and placeholders
      else if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const label = document.querySelector(`label[for="${target.id}"]`);
        const labelText = label?.textContent || target.getAttribute('placeholder') || target.name || '';
        const value = target.value ? `Current value: ${target.value}` : '';
        textToRead = `${labelText}. ${value}`;
      }
      // Get heading text
      else if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(target.tagName)) {
        textToRead = `Heading: ${target.textContent?.trim()}`;
      }
      // Get image alt text
      else if (target.tagName === 'IMG') {
        textToRead = target.alt || 'Image';
      }
      // Get general text content for other elements
      else if (target.textContent && target.textContent.trim().length > 0 && target.textContent.trim().length < 200) {
        // Only read if it's not too long and has actual content
        const text = target.textContent.trim();
        if (text && !text.includes('\n\n')) { // Skip if it contains multiple paragraphs
          textToRead = text;
        }
      }

      if (textToRead && textToRead.length > 0) {
        speakText(textToRead);
      }
    };

    const handleFocus = (e) => {
      if (!isEnabled) return;
      handleMouseOver(e); // Reuse the same logic for focus events
    };

    const handleKeyPress = (e) => {
      if (!isEnabled) return;

      // Ctrl + Shift + S to toggle speaking
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        if (isSpeaking) {
          stopSpeaking();
        }
      }

      // Ctrl + Shift + R to read entire page
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        readEntirePage();
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isEnabled, isSpeaking]);

  const speakText = (text) => {
    if (!synthRef.current || !text) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.volume = volume;

    utterance.onstart = () => {
      setIsSpeaking(true);
      currentUtteranceRef.current = utterance;
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    }
  };

  const readEntirePage = () => {
    const mainContent = document.querySelector('main') || document.body;
    const textContent = mainContent.innerText;
    speakText(textContent);
  };

  const toggleScreenReader = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    
    if (newState) {
      speakText('Screen reader enabled. Hover over elements to hear them read aloud. Press Control Shift S to stop speaking. Press Control Shift R to read entire page.');
    } else {
      stopSpeaking();
      speakText('Screen reader disabled');
    }
  };

  return (
    <>
      {/* Screen Reader Controls */}
      <div className="fixed bottom-6 left-6 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
        <div className="flex flex-col gap-1">
          {/* Toggle Button */}
          <button
            onClick={toggleScreenReader}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors text-sm ${
              isEnabled
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            aria-label={isEnabled ? 'Disable screen reader' : 'Enable screen reader'}
            title={isEnabled ? 'Disable screen reader' : 'Enable screen reader'}
          >
            <span className="text-lg" aria-hidden="true">
              {isEnabled ? '🔊' : '🔇'}
            </span>
            <span className="text-xs font-medium">
              {isEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Controls (shown when enabled) */}
          {isEnabled && (
            <div className="flex flex-col gap-1 pt-1 border-t border-gray-200">
              {/* Stop Button */}
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs"
                  aria-label="Stop speaking"
                >
                  <span aria-hidden="true">⏹️</span>
                  <span>Stop</span>
                </button>
              )}

              {/* Read Page Button */}
              <button
                onClick={readEntirePage}
                className="flex items-center gap-1 px-2 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs"
                aria-label="Read entire page"
                title="Read entire page (Ctrl+Shift+R)"
              >
                <span aria-hidden="true">📄</span>
                <span>Read Page</span>
              </button>

              {/* Speed Control */}
              <div className="flex flex-col gap-0.5">
                <label className="text-xs text-gray-600 font-medium leading-none">
                  Speed: {speechRate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  aria-label="Speech rate control"
                />
              </div>

              {/* Volume Control */}
              <div className="flex flex-col gap-0.5">
                <label className="text-xs text-gray-600 font-medium leading-none">
                  Volume: {Math.round(volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  aria-label="Volume control"
                />
              </div>

              {/* Help Text */}
              <div className="text-xs text-gray-500 pt-1 border-t border-gray-200">
                <p className="font-medium mb-0.5 text-xxs">Shortcuts:</p>
                <p className="text-xxs">Ctrl+Shift+S: Stop</p>
                <p className="text-xxs">Ctrl+Shift+R: Read</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      {isEnabled && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm">
            <span className={isSpeaking ? 'animate-pulse' : ''} aria-hidden="true">
              🔊
            </span>
            <span className="font-medium">
              {isSpeaking ? 'Speaking...' : 'Screen Reader Active'}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
