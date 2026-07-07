'use client';

import { useId } from 'react';

interface JDLogoProps {
  size?: number;
  className?: string;
}

export function JDLogo({
  size = 42,
  className = '',
}: JDLogoProps) {
  const uid = useId().replace(/:/g, '');
  const silverId = `silver-${uid}`;
  const goldId = `gold-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 420 420"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      className={className}
    >
      <defs>
        {/* Silver */}
        <linearGradient
          id={silverId}
          x1="40"
          y1="40"
          x2="170"
          y2="340"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset=".35" stopColor="#F3F3F3" />
          <stop offset=".75" stopColor="#DADADA" />
          <stop offset="1" stopColor="#BABABA" />
        </linearGradient>

        {/* Gold */}
        <linearGradient
          id={goldId}
          x1="250"
          y1="20"
          x2="390"
          y2="380"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFF2C3" />
          <stop offset=".18" stopColor="#E9C86E" />
          <stop offset=".38" stopColor="#C99537" />
          <stop offset=".55" stopColor="#B98128" />
          <stop offset=".8" stopColor="#E0B85A" />
          <stop offset="1" stopColor="#8C6120" />
        </linearGradient>
      </defs>

      {/* J */}

      <path
        fill={`url(#${silverId})`}
        d="
        M122 72
        C148 72 168 88 168 115
        L168 278
        C168 345 131 385 83 385
        C49 385 26 365 26 337
        C26 312 45 293 69 293
        C92 293 109 308 109 329
        C109 342 102 352 92 360
        C98 362 106 363 116 363
        C143 363 152 335 152 289
        L152 118
        C152 92 139 84 122 82
        Z
        "
      />

      <rect
        x="122"
        y="66"
        width="70"
        height="6"
        rx="3"
        fill={`url(#${silverId})`}
      />

      {/* D */}

      <path
        fill={`url(#${goldId})`}
        d="
        M218 66
        L218 72
        L275 72
        C355 72 394 121 394 210
        C394 299 355 348 275 348
        L218 348
        L218 354
        L280 354
        C374 354 414 300 414 210
        C414 120 374 66 280 66
        Z
        "
      />

      {/* Thin top line */}

      <rect
        x="218"
        y="66"
        width="58"
        height="4"
        fill={`url(#${goldId})`}
      />

      {/* Thin bottom line */}

      <rect
        x="218"
        y="350"
        width="58"
        height="4"
        fill={`url(#${goldId})`}
      />
    </svg>
  );
}