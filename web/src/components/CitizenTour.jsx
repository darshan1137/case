'use client';

import { useEffect, useState } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from '@/components/Tour';

export default function CitizenTour({ run, onComplete }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const steps = [
    {
      target: 'body',
      content: 'Welcome to your Citizen Dashboard! Let me show you around and explain what each section does.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[href="/citizen/dashboard"]',
      content: 'Dashboard: Your home base showing quick stats, recent reports, and an overview of all your submitted issues.',
      placement: 'right',
    },
    {
      target: '[href="/citizen/reports/new"]',
      content: 'New Report: Submit a new infrastructure issue. Upload photos and our AI will automatically detect the problem type (pothole, garbage, broken pipe, etc.).',
      placement: 'right',
    },
    {
      target: '[href="/citizen/reports"]',
      content: 'My Reports: View all your submitted reports, track their status, and see which ones are pending, assigned, or resolved.',
      placement: 'right',
    },
    {
      target: '[href="/citizen/track"]',
      content: 'Track Status: Real-time tracking of your reports. See exactly where your issue is in the resolution process.',
      placement: 'right',
    },
    {
      target: '[href="/map"]',
      content: 'Infrastructure Map: Interactive map showing all reported issues in your area with color-coded markers by status and type.',
      placement: 'right',
    },
    {
      target: '[href="/route"]',
      content: 'Route Optimizer: Plan optimal routes considering real-time traffic and road conditions. Useful during infrastructure disruptions.',
      placement: 'right',
    },
    {
      target: '[href="/citizen/profile"]',
      content: 'Profile: Manage your account settings, view your report history statistics, and update your contact information.',
      placement: 'right',
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Tour completed or skipped
      localStorage.setItem('citizenTourCompleted', 'true');
      if (onComplete) {
        onComplete();
      }
    }
  };

  if (!mounted) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: '#fff',
          backgroundColor: '#fff',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          primaryColor: '#4f46e5',
          textColor: '#1f2937',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
        tooltipTitle: {
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '8px',
        },
        tooltipContent: {
          fontSize: '15px',
          lineHeight: '1.6',
          padding: '12px 0',
        },
        buttonNext: {
          backgroundColor: '#4f46e5',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.2s',
        },
        buttonBack: {
          color: '#4f46e5',
          marginRight: 12,
          fontSize: '14px',
          fontWeight: '600',
        },
        buttonSkip: {
          color: '#64748b',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
}
