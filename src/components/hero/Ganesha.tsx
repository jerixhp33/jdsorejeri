export function Ganesha({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Subtle halo glow */}
      <circle cx="100" cy="85" r="55" fill="currentColor" opacity="0.08" />

      {/* Head */}
      <ellipse cx="100" cy="70" rx="38" ry="35" fill="currentColor" opacity="0.25" />

      {/* Ears */}
      <ellipse cx="58" cy="68" rx="18" ry="22" fill="currentColor" opacity="0.2" />
      <ellipse cx="142" cy="68" rx="18" ry="22" fill="currentColor" opacity="0.2" />

      {/* Crown */}
      <path
        d="M75 45 L82 28 L90 40 L100 22 L110 40 L118 28 L125 45"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        opacity="0.3"
        strokeLinejoin="round"
      />

      {/* Eyes */}
      <ellipse cx="87" cy="65" rx="4" ry="3" fill="currentColor" opacity="0.4" />
      <ellipse cx="113" cy="65" rx="4" ry="3" fill="currentColor" opacity="0.4" />

      {/* Trunk (curling to the left) */}
      <path
        d="M100 80 Q100 95, 92 105 Q84 115, 78 112 Q72 108, 76 100 Q80 92, 85 95"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />

      {/* Body */}
      <ellipse cx="100" cy="130" rx="35" ry="32" fill="currentColor" opacity="0.2" />

      {/* Belly marking */}
      <ellipse cx="100" cy="130" rx="18" ry="16" fill="currentColor" opacity="0.08" />

      {/* Arms - left holding modak */}
      <path
        d="M68 115 Q55 120, 52 130 Q50 138, 56 140"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.2"
      />
      {/* Modak in hand */}
      <circle cx="54" cy="138" r="6" fill="currentColor" opacity="0.15" />

      {/* Arms - right */}
      <path
        d="M132 115 Q145 120, 148 130 Q150 138, 144 140"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.2"
      />

      {/* Legs/Base */}
      <path
        d="M75 155 Q75 170, 85 175 Q95 180, 100 175 Q105 180, 115 175 Q125 170, 125 155"
        fill="currentColor"
        opacity="0.18"
      />

      {/* Lotus seat base */}
      <path
        d="M55 175 Q65 168, 78 172 Q90 176, 100 172 Q110 176, 122 172 Q135 168, 145 175"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.15"
      />
      <path
        d="M50 180 Q70 173, 85 177 Q100 181, 115 177 Q130 173, 150 180"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.1"
      />
    </svg>
  );
}
