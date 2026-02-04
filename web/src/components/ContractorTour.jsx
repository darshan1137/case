'use client';

import { useEffect, useState } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';

export default function ContractorTour({ run, onComplete }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const steps = [
    {
      target: 'body',
      content: 'Welcome to your Contractor Dashboard! Let me guide you through all the tools available to manage your work.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[href="/contractor/dashboard"]',
      content: 'Dashboard: Your main hub showing active jobs, pending assignments, performance metrics, and recent work orders.',
      placement: 'right',
    },
    {
      target: '[href="/contractor/jobs"]',
      content: 'Assigned Jobs: All work orders assigned to you. Accept or reject assignments, and view job details including location and requirements.',
      placement: 'right',
    },
    {
      target: '[href="/contractor/jobs/active"]',
      content: 'Active Jobs: Work orders you\'ve accepted and are currently working on. Update status (en route → on site → in progress → completed) and upload proof of work.',
      placement: 'right',
    },
    {
      target: '[href="/contractor/jobs/completed"]',
      content: 'Completed: History of all your finished work orders. View verification status and completion details.',
      placement: 'right',
    },
    {
      target: '[href="/map"]',
      content: 'Infrastructure Map: See all assigned and available work locations on an interactive map with directions.',
      placement: 'right',
    },
    {
      target: '[href="/route"]',
      content: 'Route Optimizer: Plan the most efficient route to visit multiple job sites, considering real-time traffic.',
      placement: 'right',
    },
    {
      target: '[href="/contractor/performance"]',
      content: 'Performance: Track your performance metrics including completion rate, average resolution time, and earnings.',
      placement: 'right',
    },
    {
      target: '[href="/contractor/profile"]',
      content: 'Profile: Manage your company details, specializations, service areas, and contact information.',
      placement: 'right',
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Tour completed or skipped
      localStorage.setItem('contractorTourCompleted', 'true');
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
          primaryColor: '#f59e0b',
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
          backgroundColor: '#f59e0b',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.2s',
        },
        buttonBack: {
          color: '#f59e0b',
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
