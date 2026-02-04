'use client';

import { useState, useEffect } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from '@/components/Tour';

export default function CASETour({ run = false, onComplete }) {
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    setRunTour(run);
  }, [run]);

  const steps = [
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-2">Welcome to CASE Platform! 🎉</h2>
          <p className="text-gray-700">
            Let's take a quick tour to show you how to report and track civic issues in your city.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.hero-title',
      content: (
        <div>
          <h3 className="text-xl font-bold mb-2">🏛️ CASE Platform</h3>
          <p className="text-gray-700">
            <strong>C</strong>apture, <strong>A</strong>ssess, <strong>S</strong>erve, and <strong>E</strong>volve - 
            Your complete civic engagement solution.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.report-issue-btn',
      content: (
        <div>
          <h3 className="text-xl font-bold mb-2">📝 Report an Issue</h3>
          <p className="text-gray-700">
            Click here to report civic issues like potholes, broken streetlights, water leaks, and more!
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.track-status-btn',
      content: (
        <div>
          <h3 className="text-xl font-bold mb-2">🔍 Track Status</h3>
          <p className="text-gray-700">
            Track the status of your reported issues in real-time and get updates on resolution progress.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.features-section',
      content: (
        <div>
          <h3 className="text-xl font-bold mb-2">✨ Key Features</h3>
          <p className="text-gray-700">
            <strong>CAPTURE:</strong> Real-time reporting with photos<br />
            <strong>ASSESS:</strong> AI-powered priority routing<br />
            <strong>SERVE:</strong> Fast municipal response<br />
            <strong>EVOLVE:</strong> Data-driven improvements
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.categories-section',
      content: (
        <div>
          <h3 className="text-xl font-bold mb-2">🗂️ Issue Categories</h3>
          <p className="text-gray-700">
            Report various types of issues including roads, water supply, sanitation, 
            street lights, and more - all with guaranteed SLA timelines.
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.register-btn',
      content: (
        <div>
          <h3 className="text-xl font-bold mb-2">🚀 Get Started</h3>
          <p className="text-gray-700">
            Ready to make a difference? Register now and start reporting issues in your neighborhood!
          </p>
        </div>
      ),
      placement: 'left',
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      // Update state to advance the tour
      console.log('Joyride step:', index);
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Tour finished or skipped
      setRunTour(false);
      if (onComplete) {
        onComplete();
      }
      // Save that user has seen the tour
      localStorage.setItem('caseTourCompleted', 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#ea580c',
          textColor: '#1e293b',
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          arrowColor: '#ffffff',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        buttonNext: {
          backgroundColor: '#ea580c',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 600,
        },
        buttonBack: {
          color: '#64748b',
          marginRight: 10,
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
