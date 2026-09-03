'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Admin Panel Error</h2>
          <p className="text-white/50 text-sm">
            Something went wrong loading this admin page.
          </p>
          {error.digest && (
            <p className="text-white/30 text-xs mt-2 font-mono">Error ID: {error.digest}</p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-xl bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/admin"
            className="px-6 py-2.5 rounded-xl bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-colors border border-white/10"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
