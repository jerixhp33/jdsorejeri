import React, { useState } from 'react';
import { X, Truck, Check } from 'lucide-react';
import { toast } from 'sonner';

export type ShipmentModalData = {
  provider: string;
  tracking_number: string;
  tracking_url: string;
  notify_email: boolean;
  notify_whatsapp: boolean;
};

interface ShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShipmentModalData) => Promise<void>;
  status: 'shipped' | 'out_for_delivery';
}

export function ShipmentModal({ isOpen, onClose, onSubmit, status }: ShipmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ShipmentModalData>({
    provider: 'ST Courier',
    tracking_number: '',
    tracking_url: '',
    notify_email: true,
    notify_whatsapp: true,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.provider || !formData.tracking_number) {
      toast.error('Please fill in Courier and Tracking Number');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit tracking details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = status === 'shipped' ? 'Mark as Shipped' : 'Mark Out for Delivery';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1C1C1C] rounded-2xl w-full max-w-md border border-white/10 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-2 text-white font-medium">
            <Truck className="w-4 h-4 text-[#C1A063]" />
            {title}
          </div>
          <button onClick={onClose} className="p-1 text-white/50 hover:text-white rounded hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Courier Provider *</label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C1A063]"
                required
              >
                <option value="ST Courier">ST Courier</option>
                <option value="DTDC">DTDC</option>
                <option value="Delhivery">Delhivery</option>
                <option value="BlueDart">BlueDart</option>
                <option value="India Post">India Post</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {formData.provider === 'Other' && (
              <div>
                <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Custom Courier Name *</label>
                <input
                  type="text"
                  placeholder="E.g., FedEx"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C1A063]"
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">AWB / Tracking Number *</label>
              <input
                type="text"
                placeholder="e.g., ST123456789"
                value={formData.tracking_number}
                onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C1A063]"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Tracking URL (Optional)</label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.tracking_url}
                onChange={(e) => setFormData({ ...formData, tracking_url: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C1A063]"
              />
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Notification Options */}
          <div className="space-y-2">
            <label className="block text-xs text-white/50 mb-2 uppercase tracking-wider">Customer Notifications</label>
            
            <label className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-black/30 cursor-pointer hover:bg-white/5 transition group">
              <div className={`w-5 h-5 rounded flex items-center justify-center border ${formData.notify_email ? 'bg-[#C1A063] border-[#C1A063]' : 'border-white/20 group-hover:border-white/40'}`}>
                {formData.notify_email && <Check className="w-3 h-3 text-black" />}
              </div>
              <span className="text-sm text-white/80 select-none">Send Email Notification</span>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={formData.notify_email} 
                onChange={(e) => setFormData({...formData, notify_email: e.target.checked})} 
              />
            </label>
            
            <label className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-black/30 cursor-pointer hover:bg-white/5 transition group">
              <div className={`w-5 h-5 rounded flex items-center justify-center border ${formData.notify_whatsapp ? 'bg-[#25D366] border-[#25D366]' : 'border-white/20 group-hover:border-white/40'}`}>
                {formData.notify_whatsapp && <Check className="w-3 h-3 text-black" />}
              </div>
              <span className="text-sm text-white/80 select-none">Generate WhatsApp Message</span>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={formData.notify_whatsapp} 
                onChange={(e) => setFormData({...formData, notify_whatsapp: e.target.checked})} 
              />
            </label>
          </div>

          {/* Footer */}
          <div className="pt-2 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Saving...' : 'Confirm & Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
