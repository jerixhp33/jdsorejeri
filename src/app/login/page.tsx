import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginPage } from '@/components/auth/LoginPage';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your JD Store account',
};

export default function LoginRoute() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-foreground/ border-t-white animate-spin" />
      </div>
    }>
      <LoginPage />
    </Suspense>
  );
}
