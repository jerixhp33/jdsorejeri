'use client';

import React from 'react';
import Barcode from 'react-barcode';

export function LabelBarcode({ value }: { value: string }) {
  return (
    <div className="flex justify-center w-full">
      <Barcode 
        value={value} 
        format="CODE128" 
        width={2} 
        height={60} 
        displayValue={false} 
        background="transparent"
        lineColor="#000000"
      />
    </div>
  );
}
