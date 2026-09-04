export function Diya({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Subtle glow behind flame */}
      <circle cx="50" cy="35" r="25" fill="#fcd34d" opacity="0.2" className="diya-glow" />
      
      {/* Outer Flame (Orange) */}
      <path
        d="M50 15C50 15 65 35 65 45C65 53.2843 58.2843 60 50 60C41.7157 60 35 53.2843 35 45C35 35 50 15 50 15Z"
        fill="#f59e0b"
        className="diya-flame"
      />
      
      {/* Inner Flame (Yellow) */}
      <path
        d="M50 25C50 25 58 40 58 47C58 51.4183 54.4183 55 50 55C45.5817 55 42 51.4183 42 47C42 40 50 25 50 25Z"
        fill="#fcd34d"
        className="diya-flame-inner"
      />
      
      {/* Diya Base */}
      <path
        d="M20 55C20 55 20 75 50 75C80 75 80 55 80 55Z"
        fill="#b45309"
      />
      
      {/* Diya Rim Highlight */}
      <path
        d="M20 55C20 55 40 60 50 60C60 60 80 55 80 55"
        stroke="#fcd34d"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Diya Base Shadow/Details */}
      <path
        d="M30 65C30 65 40 70 50 70C60 70 70 65 70 65"
        stroke="#78350f"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
