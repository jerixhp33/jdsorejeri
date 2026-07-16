'use client';

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

export function PrintButton({ 
  label = 'Print', 
  isPdf = false, 
  filename = 'download.pdf', 
  targetId = '' 
}: { 
  label?: string, 
  isPdf?: boolean, 
  filename?: string, 
  targetId?: string 
}) {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    if (!isPdf || !targetId) {
      window.print();
      return;
    }

    try {
      // Use native window.print() which provides a better scaling experience natively on all devices
      window.print();
    } catch (error) {
      console.error('Print failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handlePrint}
      disabled={loading}
      className="bg-background text-foreground px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition shadow-md flex items-center gap-2 disabled:opacity-70"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isPdf ? (
        <Download className="w-5 h-5" />
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
        </svg>
      )}
      {loading ? 'Generating PDF...' : label}
    </button>
  );
}
