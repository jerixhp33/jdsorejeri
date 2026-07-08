'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { JDLogo } from '@/components/shared/JDLogo';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Shield, Star, Truck, Chrome, ChevronLeft } from 'lucide-react';

const TRUST_ITEMS = [
  { icon: Shield, text: 'Secure Google Sign-In' },
  { icon: Star, text: 'Premium Experience' },
  { icon: Truck, text: 'Tamil Nadu Delivery' },
];

export function LoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxe-black flex">
      {/* Left decorative panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden items-center justify-center">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-luxe-near-black via-luxe-dark to-luxe-black" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-luxe-accent/8 blur-[100px]" />

        <div className="relative z-10 p-12 max-w-lg">
          <Link prefetch={true} href="/" className="flex items-center gap-2.5 mb-12">
            <JDLogo size={42} />
            <span className="font-display text-2xl font-bold text-white">JD Store</span>
          </Link>

          <h1 className="font-display text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
            Art for your <span className="text-gradient-gold">walls</span>,
            <br />
            jewelry for your <span className="text-gradient-gold">soul</span>
          </h1>
          <p className="text-white/50 text-base leading-relaxed mb-12">
            Join thousands of customers who trust JD Store for premium wall posters and handcrafted
            earrings delivered across Tamil Nadu.
          </p>

          <div className="space-y-4">
            {TRUST_ITEMS.map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-luxe-accent/15 border border-luxe-accent/25 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-luxe-accent" />
                </div>
                <span className="text-white/60 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <Link prefetch={true} href="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
            <JDLogo size={34} />
            <span className="font-display text-xl font-bold text-white">JD Store</span>
          </Link>

          <h2 className="font-display text-3xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-white/50 text-sm mb-10">
            Sign in with your Google account to continue
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-4 rounded-2xl hover:bg-white/90 transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-white/25 text-xs">only Google Sign-In supported</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <p className="text-white/30 text-xs text-center mt-8 leading-relaxed">
            By signing in, you agree to our{' '}
            <Link prefetch={true} href="/about#terms" className="text-white/50 hover:text-white underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link prefetch={true} href="/about#privacy" className="text-white/50 hover:text-white underline">
              Privacy Policy
            </Link>
          </p>

          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <Link prefetch={true} href="/" className="btn-glass !py-2 !px-4 text-xs group mt-4">
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to store
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
