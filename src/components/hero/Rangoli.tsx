export function Rangoli({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g opacity="0.15" stroke="currentColor" strokeWidth="1">
        {/* Center */}
        <circle cx="100" cy="100" r="10" />
        <circle cx="100" cy="100" r="20" strokeDasharray="2 4" />
        
        {/* Outer Rings */}
        <circle cx="100" cy="100" r="80" />
        <circle cx="100" cy="100" r="95" strokeDasharray="4 8" />

        {/* Petals */}
        <path d="M100 20 C80 50, 80 80, 100 80 C120 80, 120 50, 100 20 Z" />
        <path d="M100 180 C80 150, 80 120, 100 120 C120 120, 120 150, 100 180 Z" />
        <path d="M20 100 C50 80, 80 80, 80 100 C80 120, 50 120, 20 100 Z" />
        <path d="M180 100 C150 80, 120 80, 120 100 C120 120, 150 120, 180 100 Z" />

        <path d="M43 43 C65 65, 75 85, 85 85 C95 85, 85 65, 43 43 Z" />
        <path d="M157 157 C135 135, 125 115, 115 115 C105 115, 115 135, 157 157 Z" />
        <path d="M157 43 C135 65, 125 85, 115 85 C105 85, 115 65, 157 43 Z" />
        <path d="M43 157 C65 135, 75 115, 85 115 C95 115, 85 135, 43 157 Z" />
      </g>
    </svg>
  );
}
