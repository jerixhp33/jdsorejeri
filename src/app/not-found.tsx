import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 rounded-full bg-foreground/ border border-foreground/ flex items-center justify-center mx-auto mb-6">
          <span className="text-foreground/ text-4xl font-display font-bold">404</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground mb-3">Page not found</h1>
        <p className="text-foreground/ mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-4 justify-center">
          <Link prefetch={true} href="/" className="btn-glass !px-6 !py-3 text-sm">Back to Home</Link>
          <Link prefetch={true} href="/category/poster" className="btn-glass !px-6 !py-3 text-sm !bg-transparent">View Posters</Link>
        </div>
      </div>
    </div>
  );
}
