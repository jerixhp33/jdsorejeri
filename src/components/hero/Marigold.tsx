export function Marigold({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="50" cy="50" r="45" fill="#D96C32" />
      
      {/* Outer petals layer */}
      <path d="M50 5 C55 25, 45 25, 50 5Z" fill="#E88B41" />
      <path d="M72 13 C67 30, 58 24, 72 13Z" fill="#E88B41" />
      <path d="M89 31 C72 38, 67 31, 89 31Z" fill="#E88B41" />
      <path d="M95 50 C75 55, 75 45, 95 50Z" fill="#E88B41" />
      <path d="M89 69 C72 62, 67 69, 89 69Z" fill="#E88B41" />
      <path d="M72 87 C67 70, 58 76, 72 87Z" fill="#E88B41" />
      <path d="M50 95 C55 75, 45 75, 50 95Z" fill="#E88B41" />
      <path d="M28 87 C33 70, 42 76, 28 87Z" fill="#E88B41" />
      <path d="M11 69 C28 62, 33 69, 11 69Z" fill="#E88B41" />
      <path d="M5 50 C25 55, 25 45, 5 50Z" fill="#E88B41" />
      <path d="M11 31 C28 38, 33 31, 11 31Z" fill="#E88B41" />
      <path d="M28 13 C33 30, 42 24, 28 13Z" fill="#E88B41" />
      
      {/* Inner petals layer */}
      <circle cx="50" cy="50" r="30" fill="#E27C37" />
      <path d="M50 20 C53 35, 47 35, 50 20Z" fill="#F4A259" />
      <path d="M71 29 C60 41, 54 37, 71 29Z" fill="#F4A259" />
      <path d="M80 50 C65 53, 65 47, 80 50Z" fill="#F4A259" />
      <path d="M71 71 C60 59, 54 63, 71 71Z" fill="#F4A259" />
      <path d="M50 80 C53 65, 47 65, 50 80Z" fill="#F4A259" />
      <path d="M29 71 C40 59, 46 63, 29 71Z" fill="#F4A259" />
      <path d="M20 50 C35 53, 35 47, 20 50Z" fill="#F4A259" />
      <path d="M29 29 C40 41, 46 37, 29 29Z" fill="#F4A259" />

      {/* Core */}
      <circle cx="50" cy="50" r="15" fill="#F7B267" />
      <circle cx="50" cy="50" r="8" fill="#F4D35E" />
    </svg>
  );
}
