'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export const ACTIONS = {
  NEXT: 'next',
  PREV: 'prev',
  CLOSE: 'close',
  SKIP: 'skip',
};

export const EVENTS = {
  STEP_AFTER: 'step:after',
};

export const STATUS = {
  FINISHED: 'finished',
  SKIPPED: 'skipped',
};

export default function Joyride({
  steps = [],
  run = false,
  continuous = true,
  showProgress = false,
  showSkipButton = true,
  callback = () => {},
  styles = {},
  locale = {},
}) {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (run && steps.length > 0) {
      setIndex(0);
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [run, steps]);

  useEffect(() => {
    if (!visible) return;
    const step = steps[index];
    if (!step) return;
    if (step.target && step.target !== 'body') {
      const el = document.querySelector(step.target);
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [visible, index, steps]);

  const doCallback = (status) => {
    try {
      callback({ status });
    } catch (e) {
      // swallow callback errors
    }
  };

  const handleNext = () => {
    const nextIndex = index + 1;
    if (nextIndex >= steps.length) {
      setVisible(false);
      doCallback(STATUS.FINISHED);
    } else {
      setIndex(nextIndex);
    }
  };

  const handleBack = () => {
    setIndex((i) => Math.max(0, i - 1));
  };

  const handleSkip = () => {
    setVisible(false);
    doCallback(STATUS.SKIPPED);
  };

  if (!visible || steps.length === 0) return null;

  const step = steps[index] || {};

  // compute tooltip position
  const tooltipBase = {
    position: 'absolute',
    zIndex: 10001,
    maxWidth: 420,
  };

  let tooltipStyle = {};
  if (step.target && step.target !== 'body') {
    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      tooltipStyle = {
        top: `${rect.bottom + window.scrollY + 8}px`,
        left: `${rect.left + window.scrollX}px`,
      };
    } else {
      tooltipStyle = { top: '20%', left: '50%', transform: 'translateX(-50%)' };
    }
  } else {
    tooltipStyle = { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  }

  const mergedTooltipStyle = { ...tooltipBase, ...tooltipStyle };

  const overlay = (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000 }}
      onClick={() => {
        if (showSkipButton) handleSkip();
      }}
    />
  );

  const tooltip = (
    <div style={mergedTooltipStyle}>
      <div style={{ background: '#fff', color: '#111827', padding: 16, borderRadius: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        {step.title && <div style={{ fontWeight: 600, marginBottom: 8 }}>{step.title}</div>}
        <div style={{ marginBottom: 12 }}>{step.content}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div>
            {index > 0 && (
              <button onClick={handleBack} style={{ background: 'transparent', border: 'none', color: '#0ea5e9', fontWeight: 600, cursor: 'pointer' }}>
                {locale.back || 'Back'}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {showSkipButton && (
              <button onClick={handleSkip} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                {locale.skip || 'Skip'}
              </button>
            )}
            <button onClick={handleNext} style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              {index === steps.length - 1 ? (locale.last || 'Finish') : (locale.next || 'Next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <>
      {overlay}
      {tooltip}
    </>,
    document.body
  );
}
