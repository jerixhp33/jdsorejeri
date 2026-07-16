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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block w-full" ref={dropdownRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`relative cursor-pointer transition-opacity ${disabled || isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
      >
        {type === 'order' ? (
          <OrderStatusBadge status={value as OrderStatus} />
        ) : (
          <PaymentStatusBadge status={value as PaymentStatus} />
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden text-sm">
          <div className="py-1 max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={(e) => { e.stopPropagation(); handleSelect(opt.value); }}
                className={`w-full text-left px-4 py-2.5 transition-colors ${
                  value === opt.value 
                    ? 'bg-zinc-800 text-foreground font-medium' 
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
