import { Suspense } from 'react';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';

export const dynamic = 'force-dynamic';

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="page-container py-24 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-foreground/ border-t-white animate-spin mx-auto" />
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  );
}
