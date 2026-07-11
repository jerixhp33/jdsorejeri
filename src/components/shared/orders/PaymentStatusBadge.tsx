'use client';

import { PAYMENT_STATUS_CONFIG } from '@/lib/orders';
import type { PaymentStatus } from '@/types';
import * as Icons from 'lucide-react';

interface Props {
  status: PaymentStatus;
  className?: string;
  showIcon?: boolean;
}

export function PaymentStatusBadge({ status, className = '', showIcon = true }: Props) {
  const config = PAYMENT_STATUS_CONFIG[status];
  
  if (!config) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ${className}`}>
        {status}
      </span>
    );
  }

  const IconComponent = (Icons as any)[config.icon] || Icons.DollarSign;

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-sm backdrop-blur-md ${config.bgColor} ${config.color} ${config.borderColor} ${className}`}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5" />}
      {config.label}
    </span>
  );
}
