'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button, Input } from './ui';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your CASE platform assistant. I can help you navigate the platform, explain features, and answer questions. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }

      // Initialize speech synthesis
      if (window.speechSynthesis) {
        synthRef.current = window.speechSynthesis;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = (text) => {
    if (synthRef.current) {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chatbot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: userMessage })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage = data.answer;
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: assistantMessage
        }]);
        // Auto-read the response aloud
        speakText(assistantMessage);
      } else {
        const errorMessage = 'Sorry, I encountered an error. Please try again or contact support.';
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: errorMessage
        }]);
        speakText(errorMessage);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = 'Sorry, I\'m having trouble connecting. Please try again later.';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }]);
      speakText(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "How do I report an issue?",
    "What are the different user roles?",
    "How does AI validation work?",
    "How do I track my report status?",
    "What is a work order?"
  ];

  return (
    <>
      {/* Chatbot Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-24 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all hover:scale-110 z-50 animate-in fade-in slide-in-from-right-10 duration-500"
          aria-label="Open CASE Assistant chat. Click to start conversation"
          role="button"
          tabIndex={0}
        >
          <span aria-hidden="true">💬</span>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div 
          className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-xl shadow-2xl flex flex-col z-50 border border-gray-200"
          role="dialog"
          aria-label="CASE Assistant Chatbot"
          aria-modal="true"
        >
          {/* Header */}
          <div className="bg-indigo-600 text-white p-4 rounded-t-xl flex items-center justify-between" role="banner">
            <div className="flex items-center space-x-3">
              <span className="text-2xl" aria-hidden="true">🤖</span>
              <div>
                <h3 className="font-semibold" id="chatbot-title">CASE Assistant</h3>
                <p className="text-xs text-indigo-100">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 text-2xl"
              aria-label="Close CASE Assistant chat window"
              role="button"
              tabIndex={0}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          {/* Messages */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
            role="log"
            aria-live="polite"
            aria-atomic="false"
            aria-label="Chat conversation history"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                role="article"
                aria-label={`${message.role === 'user' ? 'Your message' : 'Assistant response'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="flex flex-col">
                      <div className="text-sm prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2" {...props} />,
                            li: ({node, ...props}) => <li className="mb-1" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-indigo-700" {...props} />,
                            code: ({node, ...props}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono" {...props} />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      {/* Speaker button for assistant messages */}
                      <button
                        onClick={() => speakText(message.content)}
                        className="self-end mt-2 text-indigo-600 hover:text-indigo-800 text-xs flex items-center gap-1"
                        aria-label="Read this message aloud using text to speech"
                        role="button"
                        tabIndex={0}
                      >
                        <span className="text-base" aria-hidden="true">🔊</span>
                        <span>Read aloud</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start" role="status" aria-live="polite">
                <div className="bg-white text-gray-800 rounded-lg p-3 shadow-sm border border-gray-200">
                  <span className="sr-only">Assistant is typing...</span>
                  <div className="flex space-x-2" aria-hidden="true">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-white" role="region" aria-label="Suggested questions">
              <p className="text-xs text-gray-500 mb-2" id="quick-questions-label">Quick questions:</p>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="quick-questions-label">
                {quickQuestions.slice(0, 3).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                    aria-label={`Quick question: ${question}`}
                    role="button"
                    tabIndex={0}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl" role="form" aria-label="Message input form">
            <div className="flex space-x-2">
              {/* Voice input button */}
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={loading}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label={isListening ? "Stop voice recording" : "Start voice recording for speech to text input"}
                role="button"
                tabIndex={0}
                aria-pressed={isListening}
              >
                <span aria-hidden="true">{isListening ? '⏹️' : '🎤'}</span>
              </button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? "Listening..." : "Ask me anything..."}
                disabled={loading || isListening}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:bg-gray-100"
                aria-label="Type your question or message to CASE Assistant"
                role="textbox"
                aria-required="false"
                aria-multiline="false"
              />
              
              {/* Stop speaking button (only shown when speaking) */}
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg"
                  aria-label="Stop text to speech playback"
                  role="button"
                  tabIndex={0}
                >
                  <span aria-hidden="true">🔇</span>
                </button>
              )}
              
              <Button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={loading ? "Sending message" : "Send message to CASE Assistant"}
                role="button"
                tabIndex={0}
              >
                <span aria-hidden="true">{loading ? '...' : '→'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
