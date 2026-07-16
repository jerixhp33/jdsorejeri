'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className="w-10 h-10 rounded-full flex items-center justify-center text-foreground/50 bg-foreground/5 border border-foreground/5">
        <div className="w-5 h-5 opacity-0" />
      </button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 text-foreground/60 bg-foreground/5 hover:bg-foreground/10 hover:text-foreground border border-foreground/5 shadow-sm"
      aria-label="Toggle Theme"
    >
      <Sun className={`absolute w-5 h-5 transition-all duration-300 ${isDark ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'}`} />
      <Moon className={`absolute w-5 h-5 transition-all duration-300 ${isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'}`} />
    </button>
  );
}
