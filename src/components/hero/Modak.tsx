export function Modak({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Subtle glow behind modak */}
      <circle cx="50" cy="50" r="30" fill="#f97316" opacity="0.15" />

      {/* Modak body — rounded dumpling shape */}
      <path
        d="M50 20C50 20 25 35 25 55C25 70 36 80 50 80C64 80 75 70 75 55C75 35 50 20 50 20Z"
        fill="#f97316"
        opacity="0.6"
      />

      {/* Inner highlight */}
      <path
        d="M50 28C50 28 35 40 35 55C35 65 42 72 50 72C58 72 65 65 65 55C65 40 50 28 50 28Z"
        fill="#fdba74"
        opacity="0.3"
      />

      {/* Top fold/pinch lines */}
      <path
        d="M50 20 Q46 30, 50 40"
        stroke="#fdba74"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M50 20 Q54 30, 50 40"
        stroke="#fdba74"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />

      {/* Side crease lines */}
      <path
        d="M38 38 Q42 48, 38 58"
        stroke="#fdba74"
        strokeWidth="1"
        fill="none"
        opacity="0.25"
      />
      <path
        d="M62 38 Q58 48, 62 58"
        stroke="#fdba74"
        strokeWidth="1"
        fill="none"
        opacity="0.25"
      />

      {/* Base shadow */}
      <ellipse cx="50" cy="78" rx="18" ry="4" fill="#9a3412" opacity="0.2" />
    </svg>
  );
}
