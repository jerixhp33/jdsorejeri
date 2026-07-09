'use client';

import { useEffect } from 'react';

function playSnapSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Primary rounded pop (sine wave)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);

    // High click snap (triangle wave)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(2200, ctx.currentTime);
    clickOsc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.02);

    clickGain.gain.setValueAtTime(0.06, ctx.currentTime);
    clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start();
    clickOsc.stop(ctx.currentTime + 0.03);
  } catch (e) {
    // Handle browser autoplay policy restrictions silently
  }
}

export function ToastSound() {
  useEffect(() => {
    let observer: MutationObserver | null = null;

    const findToasterAndObserve = () => {
      const toaster = document.querySelector('[data-sonner-toaster]');
      if (!toaster) return false;

      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length > 0) {
            // New toast added — play pop sound!
            playSnapSound();
          }
        });
      });

      observer.observe(toaster, { childList: true, subtree: true });
      return true;
    };

    // Poll to wait for Sonner Toaster container to mount
    const interval = setInterval(() => {
      if (findToasterAndObserve()) {
        clearInterval(interval);
      }
    }, 200);

    return () => {
      if (observer) observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null;
}
