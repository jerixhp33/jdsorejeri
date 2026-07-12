import React from 'react';

export function InvoiceFooter() {
  const now = new Date();
  
  return (
    <div className="mt-auto">
      {/* Thank you note */}
      <div className="text-center mb-6">
        <p className="font-serif italic text-xl text-black mb-2">Thank you for shopping with JD Store!</p>
        <p className="text-sm text-gray-600">For support or queries, contact us on WhatsApp.</p>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <div className="flex justify-between items-end">
          <div className="text-[10px] text-gray-500 space-y-1">
            <p><span className="font-bold text-gray-800">Email:</span> jdstore.jeri@gmail.com</p>
            <p><span className="font-bold text-gray-800">Website:</span> https://jdstorejeri.vercel.app/</p>
            <p className="mt-2 text-[9px] text-gray-400">
              Generated: {now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </p>
          </div>
          
          <div className="text-right text-[9px] text-gray-400 uppercase tracking-widest leading-relaxed">
            <p>This is a computer-generated invoice.</p>
            <p>No signature is required.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
