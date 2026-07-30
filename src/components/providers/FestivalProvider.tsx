'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Festival } from '@/types';

interface FestivalContextType {
  activeFestival: Festival | null;
  optOut: boolean;
  setOptOut: (val: boolean) => void;
}

const FestivalContext = createContext<FestivalContextType>({
  activeFestival: null,
  optOut: false,
  setOptOut: () => {},
});

export function useFestival() {
  return useContext(FestivalContext);
}

export function FestivalProvider({
  children,
  initialFestival,
}: {
  children: React.ReactNode;
  initialFestival: Festival | null;
}) {
  const [activeFestival, setActiveFestival] = useState<Festival | null>(initialFestival);
  const [optOut, setOptOut] = useState(false);

  // Load opt-out preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem('jd_festival_opt_out');
      if (stored === 'true') {
        setOptOut(true);
      }
    } catch (e) {}
  }, []);

  const handleSetOptOut = (val: boolean) => {
    setOptOut(val);
    try {
      localStorage.setItem('jd_festival_opt_out', String(val));
    } catch (e) {}
  };

  // Check festival expiration/activation client-side
  useEffect(() => {
    if (!initialFestival) return;

    const checkFestival = () => {
      const now = new Date().getTime();
      const start = new Date(initialFestival.start_at).getTime();
      const end = new Date(initialFestival.end_at).getTime();
      const isActive = initialFestival.is_active && now >= start && now < end;

      setActiveFestival(isActive ? initialFestival : null);
    };

    // Check immediately
    checkFestival();

    // Check every minute
    const interval = setInterval(checkFestival, 60000);
    return () => clearInterval(interval);
  }, [initialFestival]);

  // Apply theme to document
  useEffect(() => {
    if (activeFestival && !optOut) {
      document.documentElement.setAttribute('data-theme', activeFestival.theme_type);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [activeFestival, optOut]);

  return (
    <FestivalContext.Provider value={{ activeFestival, optOut, setOptOut: handleSetOptOut }}>
      {children}
    </FestivalContext.Provider>
  );
}
