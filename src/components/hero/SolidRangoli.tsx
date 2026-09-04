export function SolidRangoli({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Outer base */}
      <circle cx="100" cy="100" r="95" fill="#D9945B" opacity="0.15" />
      <circle cx="100" cy="100" r="85" stroke="#D9945B" strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />
      
      {/* 12-point star layer */}
      <g stroke="#8C4627" strokeWidth="1.5" fill="#F4E8D1" opacity="0.6">
        <path d="M100 20 L115 70 L180 70 L130 100 L150 160 L100 120 L50 160 L70 100 L20 70 L85 70 Z" />
        <path d="M100 180 L85 130 L20 130 L70 100 L50 40 L100 80 L150 40 L130 100 L180 130 L115 130 Z" />
      </g>

      {/* Circular rings */}
      <circle cx="100" cy="100" r="60" fill="#D9945B" opacity="0.2" />
      <circle cx="100" cy="100" r="50" stroke="#8C4627" strokeWidth="1" />
      
      {/* Inner 8-point flower */}
      <g fill="#D96C32" opacity="0.7">
        <circle cx="100" cy="65" r="10" />
        <circle cx="100" cy="135" r="10" />
        <circle cx="65" cy="100" r="10" />
        <circle cx="135" cy="100" r="10" />
        <circle cx="75" cy="75" r="10" />
        <circle cx="125" cy="125" r="10" />
        <circle cx="75" cy="125" r="10" />
        <circle cx="125" cy="75" r="10" />
      </g>

      {/* Core */}
      <circle cx="100" cy="100" r="25" fill="#8C4627" opacity="0.8" />
      <circle cx="100" cy="100" r="15" fill="#FDFBF7" opacity="0.9" />
      <circle cx="100" cy="100" r="5" fill="#D96C32" />
    </svg>
  );
}
