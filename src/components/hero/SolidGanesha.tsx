export function SolidGanesha({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Halo */}
      <circle cx="100" cy="85" r="55" fill="#D9945B" opacity="0.2" />

      {/* Head */}
      <ellipse cx="100" cy="70" rx="38" ry="35" fill="#8C4627" />

      {/* Ears */}
      <ellipse cx="58" cy="68" rx="18" ry="22" fill="#8C4627" />
      <ellipse cx="142" cy="68" rx="18" ry="22" fill="#8C4627" />
      {/* Ear inner details */}
      <ellipse cx="58" cy="68" rx="10" ry="14" fill="#6B331A" />
      <ellipse cx="142" cy="68" rx="10" ry="14" fill="#6B331A" />

      {/* Crown */}
      <path
        d="M75 45 L82 28 L90 40 L100 20 L110 40 L118 28 L125 45 Z"
        fill="#D96C32"
        stroke="#8C4627"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Crown Jewels */}
      <circle cx="100" cy="30" r="3" fill="#FDFBF7" />
      <circle cx="85" cy="35" r="2" fill="#FDFBF7" />
      <circle cx="115" cy="35" r="2" fill="#FDFBF7" />

      {/* Eyes */}
      <path d="M82 65 Q87 62 92 65" stroke="#FDFBF7" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M108 65 Q113 62 118 65" stroke="#FDFBF7" strokeWidth="2" strokeLinecap="round" fill="none" />
      
      {/* Tilak */}
      <path d="M96 50 L104 50 M96 55 L104 55 M100 60 L100 65" stroke="#FDFBF7" strokeWidth="1.5" strokeLinecap="round" />

      {/* Trunk (curling to the left) */}
      <path
        d="M90 85 Q90 100, 85 105 Q80 110, 75 108 Q70 105, 75 98 L85 90 Z"
        fill="#8C4627"
      />
      <path
        d="M110 85 Q110 105, 95 115 Q80 125, 70 120 Q60 115, 68 100 L76 108 Q72 114, 80 114 Q90 114, 100 95 Z"
        fill="#6B331A"
      />

      {/* Body */}
      <ellipse cx="100" cy="130" rx="40" ry="35" fill="#8C4627" />
      
      {/* Belt/Sash */}
      <path d="M60 130 Q100 150 140 130" stroke="#D9945B" strokeWidth="4" fill="none" />

      {/* Arms - left holding modak */}
      <path
        d="M65 105 Q45 110, 45 130 Q45 140, 55 145"
        stroke="#8C4627"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
      {/* Modak in hand */}
      <path d="M50 135 C50 135 45 145 55 145 C65 145 60 135 60 135 Z" fill="#D9945B" />

      {/* Arms - right giving blessing */}
      <path
        d="M135 105 Q155 110, 155 130 Q155 140, 145 145"
        stroke="#8C4627"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="148" cy="138" r="6" fill="#D96C32" opacity="0.8" />

      {/* Legs/Base (Dhoti) */}
      <path
        d="M70 150 Q70 170, 85 175 Q95 180, 100 175 Q105 180, 115 175 Q130 170, 130 150"
        fill="#D96C32"
      />
      {/* Dhoti folds */}
      <path d="M80 150 L85 170 M120 150 L115 170" stroke="#8C4627" strokeWidth="2" opacity="0.3" />
    </svg>
  );
}
