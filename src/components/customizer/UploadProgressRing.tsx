'use client';

import { motion } from 'framer-motion';

interface UploadProgressRingProps {
  percentage: number;
  fileSizeMb?: number;
  uploadedMb?: number;
  statusText?: string;
  size?: number;
  strokeWidth?: number;
}

export function UploadProgressRing({
  percentage,
  fileSizeMb,
  uploadedMb,
  statusText = 'Uploading photo...',
  size = 140,
  strokeWidth = 10
}: UploadProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Background Track */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-white/10"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Progress Ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-amber-400"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-white tracking-tight">{percentage}%</span>
        </div>
      </div>

      {/* Upload Details */}
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-amber-300 animate-pulse">
          {percentage === 100 ? 'Processing & Analyzing...' : statusText}
        </p>
        {fileSizeMb && uploadedMb !== undefined && (
          <p className="text-xs text-white/60 font-mono">
            {uploadedMb.toFixed(1)} MB / {fileSizeMb.toFixed(1)} MB
          </p>
        )}
      </div>
    </div>
  );
}
