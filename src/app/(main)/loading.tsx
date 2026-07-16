import { JDLogo } from '@/components/shared/JDLogo';

export default function HomeLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a] overflow-hidden">
      {/* Soft ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full pointer-events-none animate-pulse"
        style={{ background: 'radial-gradient(circle, rgba(200,169,110,0.06) 0%, transparent 70%)' }}
      />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo with pulse ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute rounded-full border border-luxe-accent/20 animate-ping" style={{ width: 80, height: 80, animationDuration: '2s' }} />
          <JDLogo size={56} />
        </div>

        {/* Brand name */}
        <div className="text-center">
          <p className="font-display text-2xl font-bold tracking-widest text-white">
            JD Store
          </p>
          <p className="text-white/30 text-[11px] tracking-[0.3em] uppercase mt-2 animate-pulse">
            Loading Experience...
          </p>
        </div>
      </div>
    </div>
  );
}
