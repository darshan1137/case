'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const Preloader = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(true);

  const steps = [
    { 
      word: 'CAPTURE', 
      icon: (
        <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="80" height="80" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3"/>
          <motion.path
            d="M 20 20 L 40 20 M 60 20 L 80 20 M 20 80 L 40 80 M 60 80 L 80 80"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8 }}
          />
          <motion.circle
            cx="50"
            cy="50"
            r="15"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          />
        </svg>
      ),
      description: 'Real-time civic issue detection'
    },
    { 
      word: 'ASSESS', 
      icon: (
        <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <motion.circle
            cx="30"
            cy="70"
            r="8"
            fill="currentColor"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          />
          <motion.circle
            cx="50"
            cy="45"
            r="8"
            fill="currentColor"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
          />
          <motion.circle
            cx="70"
            cy="30"
            r="8"
            fill="currentColor"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 }}
          />
          <motion.path
            d="M 30 70 L 50 45 L 70 30"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          />
        </svg>
      ),
      description: 'AI-powered priority analysis'
    },
    { 
      word: 'SERVE', 
      icon: (
        <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <motion.rect
            x="20"
            y="50"
            width="20"
            height="35"
            fill="currentColor"
            opacity="0.6"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.2 }}
            style={{ transformOrigin: 'bottom' }}
          />
          <motion.rect
            x="45"
            y="35"
            width="20"
            height="50"
            fill="currentColor"
            opacity="0.8"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.4 }}
            style={{ transformOrigin: 'bottom' }}
          />
          <motion.rect
            x="70"
            y="20"
            width="20"
            height="65"
            fill="currentColor"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.6 }}
            style={{ transformOrigin: 'bottom' }}
          />
          <motion.path
            d="M 50 10 L 55 15 L 50 20 L 45 15 Z"
            fill="currentColor"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          />
        </svg>
      ),
      description: 'Swift municipal response'
    },
    { 
      word: 'EVOLVE', 
      icon: (
        <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <motion.path
            d="M 20 80 Q 35 60, 50 50 T 80 20"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
          />
          <motion.circle
            cx="80"
            cy="20"
            r="6"
            fill="currentColor"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1] }}
            transition={{ delay: 1, duration: 0.5 }}
          />
          <motion.path
            d="M 75 12 L 80 20 L 72 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          />
        </svg>
      ),
      description: 'Continuous improvement cycle'
    }
  ];

  useEffect(() => {
    const timers = [];
    
    // Step through each word (0-4s, 1s each)
    steps.forEach((_, index) => {
      timers.push(setTimeout(() => setCurrentStep(index + 1), index * 1000));
    });

    // Transition to brand (4-5s)
    timers.push(setTimeout(() => setCurrentStep(5), 4000));

    // Logo reveal (5-6.5s)
    timers.push(setTimeout(() => setCurrentStep(6), 5000));

    // Credit frame (6.5-8s)
    timers.push(setTimeout(() => setCurrentStep(7), 6500));

    // Complete (8s total)
    timers.push(setTimeout(() => {
      setShow(false);
      setTimeout(() => onComplete?.(), 300);
    }, 8000));

    return () => timers.forEach(timer => clearTimeout(timer));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-blue-950 to-indigo-950">
        {/* Animated grid pattern */}
        <motion.div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
          animate={{
            backgroundPosition: ['0px 0px', '50px 50px']
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        
        {/* Tricolor gradient overlay (subtle) */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: currentStep >= 5 ? 0.2 : 0 }}
          transition={{ duration: 1 }}
          style={{
            background: 'linear-gradient(to bottom, rgba(79, 70, 229, 0.4) 0%, rgba(59, 130, 246, 0.4) 50%, rgba(99, 102, 241, 0.4) 100%)'
          }}
        />
      </div>

      <div className="relative h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {/* Steps 1-4: Individual Words */}
          {currentStep > 0 && currentStep <= 4 && (
            <motion.div
              key={`step-${currentStep}`}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -20 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
              className="text-center"
            >
              <motion.div
                className="text-white mb-6"
                animate={{ 
                  filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {steps[currentStep - 1].icon}
              </motion.div>
              <motion.h2
                className="text-6xl md:text-8xl font-bold text-white tracking-wider mb-4"
                initial={{ letterSpacing: '0.5em', opacity: 0 }}
                animate={{ letterSpacing: '0.2em', opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                {steps[currentStep - 1].word}
              </motion.h2>
              <motion.p
                className="text-slate-300 text-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {steps[currentStep - 1].description}
              </motion.p>
            </motion.div>
          )}

          {/* Step 5: Words Converge to CASE */}
          {currentStep === 5 && (
            <motion.div
              key="converge"
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="relative w-full h-32">
                {['CAPTURE', 'ASSESS', 'SERVE', 'EVOLVE'].map((word, idx) => (
                  <motion.div
                    key={word}
                    className="absolute left-1/2 top-1/2 text-4xl font-bold text-white"
                    initial={{
                      x: ['-200%', '200%', '200%', '-200%'][idx],
                      y: ['-200%', '-200%', '200%', '200%'][idx],
                      opacity: 0.7
                    }}
                    animate={{
                      x: '-50%',
                      y: '-50%',
                      opacity: 0,
                      scale: 0.5
                    }}
                    transition={{ duration: 0.8 }}
                  >
                    {word}
                  </motion.div>
                ))}
                
                <motion.h1
                  className="absolute left-1/2 top-1/2 text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-300 to-indigo-500"
                  initial={{ scale: 0, opacity: 0, x: '-50%', y: '-50%' }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  CASE
                </motion.h1>
              </div>
            </motion.div>
          )}

          {/* Step 6: Logo & Full Branding */}
          {currentStep === 6 && (
            <motion.div
              key="logo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              {/* Logo */}
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                className="mb-8"
              >
                <Image 
                  src="/logo.svg" 
                  alt="CASE Logo" 
                  width={120} 
                  height={120}
                  className="mx-auto drop-shadow-2xl"
                />
              </motion.div>

              {/* Brand Name */}
              <motion.h1
                className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-300 to-indigo-500 mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                CASE
              </motion.h1>

              {/* Tagline */}
              <motion.p
                className="text-2xl text-slate-300 mb-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Civic Action & Service Excellence
              </motion.p>

              {/* Government Badge */}
              <motion.div
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <svg className="w-6 h-6 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="text-white font-semibold">Government of India Initiative</span>
                <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </motion.div>
            </motion.div>
          )}

          {/* Step 7: Credits */}
          {currentStep === 7 && (
            <motion.div
              key="credits"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.div
                className="mb-6"
                animate={{
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
              >
                <div className="text-4xl mb-2">🇮🇳</div>
                <p className="text-3xl font-bold text-white mb-2">Built in Bharat</p>
              </motion.div>
              
              <motion.p
                className="text-xl text-slate-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Designed & Developed by{' '}
                <span className="font-bold bg-gradient-to-r from-indigo-400 to-blue-500 bg-clip-text text-transparent">
                  Coding Gurus
                </span>
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Preloader;
