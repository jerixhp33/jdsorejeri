'use client';

import React, { useState, useRef, useEffect } from 'react';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/shared/orders';
import { OrderStatus, PaymentStatus } from '@/types';

type Option = {
  value: string;
  label: string;
};

type Props = {
  type: 'order' | 'payment';
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
  isUpdating?: boolean;
};

export function StatusSelect({ type, value, options, onChange, disabled, isUpdating }: Props) {
  return (
    <div className="relative inline-block w-full group">
      <div 
        className={`relative transition-opacity ${disabled || isUpdating ? 'opacity-50 cursor-not-allowed' : 'group-hover:opacity-80'}`}
      >
        {type === 'order' ? (
          <OrderStatusBadge status={value as OrderStatus} />
        ) : (
          <PaymentStatusBadge status={value as PaymentStatus} />
        )}
      </div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isUpdating}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
