export function BananaLeaf({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M50 190C50 190 20 150 10 100C0 50 40 10 50 10C60 10 100 50 90 100C80 150 50 190 50 190Z"
        fill="#7A8B60"
        opacity="0.9"
      />
      {/* Center stem */}
      <path d="M50 10 L50 190" stroke="#5D6D46" strokeWidth="2" strokeLinecap="round" />
      {/* Side veins */}
      <path d="M50 40 L30 30" stroke="#5D6D46" strokeWidth="1" strokeLinecap="round" />
      <path d="M50 40 L70 30" stroke="#5D6D46" strokeWidth="1" strokeLinecap="round" />
      <path d="M50 70 L20 60" stroke="#5D6D46" strokeWidth="1" strokeLinecap="round" />
      <path d="M50 70 L80 60" stroke="#5D6D46" strokeWidth="1" strokeLinecap="round" />
      <path d="M50 100 L15 95" stroke="#5D6D46" strokeWidth="1" strokeLinecap="round" />
      <path d="M50 100 L85 95" stroke="#5D6D46" strokeWidth="1" strokeLinecap="round" />
      <path d="M50 130 L25 130" stroke="#5D6D46" strokeWidth="1" strokeLinecap="round" />
      <path d="M50 130 L75 130" stroke="#5D6D46" strokeWidth="1" strokeLinecap="round" />
      <path d="M50 160 L35 165" stroke="#5D6D46" strokeWidth="1" strokeLinecap="round" />
      <path d="M50 160 L65 165" stroke="#5D6D46" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
