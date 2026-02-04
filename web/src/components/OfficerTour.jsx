'use client';

import { useEffect, useState } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from '@/components/Tour';

export default function OfficerTour({ run, onComplete, userRole }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isClassA = userRole === 'class_a';
  const isClassB = userRole === 'class_b';
  const isClassC = userRole === 'class_c';

  // Get role-specific title
  const getRoleTitle = () => {
    if (isClassA) return 'Class A Officer / City Commissioner';
    if (isClassB) return 'Class B Officer / Department Head';
    return 'Class C Officer / Ward Supervisor';
  };

  // Get role-specific scope
  const getScope = () => {
    if (isClassA) return 'city-wide';
    if (isClassB) return 'department-level';
    return 'ward-level';
  };

  const steps = [
    {
      target: 'body',
      content: `Welcome to your ${getRoleTitle()} Dashboard! You have ${getScope()} access. Let me guide you through your management tools.`,
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[href="/officer/dashboard"]',
      content: 'Dashboard: Overview of all reports, tickets, and work orders in your jurisdiction. Quick stats and recent activity.',
      placement: 'right',
    },
    {
      target: '[href="/officer/tickets"]',
      content: 'Tickets: AI-validated infrastructure issues from citizens. Review, accept, reject, or override AI categorization.',
      placement: 'right',
    },
    {
      target: '[href="/officer/reports"]',
      content: 'Reports: Citizen-submitted reports awaiting validation. Verify legitimacy, categorize issues, and close resolved reports.',
      placement: 'right',
    },
    {
      target: '[href="/officer/work-orders"]',
      content: 'Work Orders: Create, assign, and monitor work orders for contractors. Track progress from assignment to completion verification.',
      placement: 'right',
    },
    {
      target: '[href="/officer/contractors"]',
      content: 'Contractors: Manage contractor database. View specializations, assign jobs, verify work completion, and monitor performance.',
      placement: 'right',
    },
    {
      target: '[href="/map"]',
      content: 'Infrastructure Map: Geographic view of all issues and work orders in your area. Identify hotspots and coordinate field operations.',
      placement: 'right',
    },
    {
      target: '[href="/route"]',
      content: 'Route Optimizer: Plan efficient inspection routes for field verification visits.',
      placement: 'right',
    },
    {
      target: '[href="/officer/assets"]',
      content: 'Assets: Infrastructure asset management. View and track public assets like bridges, hospitals, schools, and utilities.',
      placement: 'right',
    },
    {
      target: '[href="/officer/analytics"]',
      content: `Analytics: ${getScope()} performance metrics, SLA tracking, resolution trends, and contractor efficiency reports.`,
      placement: 'right',
    },
  ];

  // Add Class B/A specific steps
  if (isClassB || isClassA) {
    steps.push({
      target: '[href="/officer/team"]',
      content: 'Team: Manage team members, assign responsibilities, and monitor performance of officers under your supervision.',
      placement: 'right',
    });
    steps.push({
      target: '[href="/officer/budgets"]',
      content: 'Budgets: Department budget allocation, expense tracking, and financial planning for infrastructure work.',
      placement: 'right',
    });
  }

  steps.push({
    target: '[href="/officer/profile"]',
    content: 'Profile: Manage your account details, notification preferences, and view your administrative actions history.',
    placement: 'right',
  });

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Tour completed or skipped
      localStorage.setItem('officerTourCompleted', 'true');
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
          primaryColor: '#0ea5e9',
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
          backgroundColor: '#0ea5e9',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.2s',
        },
        buttonBack: {
          color: '#0ea5e9',
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
