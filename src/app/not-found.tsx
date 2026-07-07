import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-luxe-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-white/20 text-4xl font-display font-bold">404</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-white/40 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-3 justify-center">
          <Link prefetch={true} href="/" className="btn-gold text-sm">Back to Home</Link>
          <Link prefetch={true} href="/search" className="btn-luxe-outline text-sm">Search Products</Link>
        </div>
      </div>
    </div>
  );
}
