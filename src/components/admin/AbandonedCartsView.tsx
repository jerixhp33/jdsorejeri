'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Phone, MessageCircle, Clock, ShoppingBag, Check } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919360490974';

export function AbandonedCartsView() {
  const [carts, setCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchCarts();
  }, []);

  const fetchCarts = async () => {
    try {
      const { data, error } = await supabase
        .from('abandoned_carts')
        .select('*')
        .eq('status', 'pending')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setCarts(data || []);
    } catch (error) {
      console.error('Error fetching abandoned carts:', error);
      toast.error('Failed to load abandoned carts');
    } finally {
      setLoading(false);
    }
  };

  const markAsRecovered = async (id: string) => {
    try {
      const { error } = await supabase
        .from('abandoned_carts')
        .update({ status: 'recovered' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Marked as recovered');
      fetchCarts();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const markAsIgnored = async (id: string) => {
    try {
      const { error } = await supabase
        .from('abandoned_carts')
        .update({ status: 'ignored' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Cart dismissed');
      fetchCarts();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const sendWhatsApp = (cart: any) => {
    if (!cart.phone_number) return;
    const cleanPhone = cart.phone_number.replace(/\D/g, '');
    const waNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    
    let itemsList = '';
    let total = 0;
    cart.cart_data.forEach((item: any) => {
      itemsList += `\n- ${item.product.name} (Qty: ${item.quantity})`;
      total += item.unit_price * item.quantity;
    });

    const msg = `Hi ${cart.customer_name || 'there'}! 👋\n\nWe noticed you left some amazing items in your JD Store cart:\n${itemsList}\n\nTotal: ${formatCurrency(total)}\n\nStill interested? Let us know if you need any help completing your order!`;
    
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) {
    return <div className="p-8 text-white/50 text-center font-medium animate-pulse">Loading carts...</div>;
  }

  if (carts.length === 0) {
    return (
      <div className="p-16 text-center">
        <ShoppingBag className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-xl font-display font-semibold text-white mb-2">No abandoned carts</h3>
        <p className="text-white/50">All your customers are finishing their checkouts!</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Abandoned Carts</h2>
          <p className="text-white/50 text-sm">Follow up with customers who left items in their cart.</p>
        </div>
        <div className="bg-luxe-accent/20 text-luxe-accent px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {carts.length} Pending Carts
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {carts.map((cart) => {
          const totalValue = cart.cart_data.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0);
          
          return (
            <div key={cart.id} className="glass-card p-6 border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {cart.customer_name || 'Anonymous User'}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-white/50">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Last updated {new Date(cart.updated_at).toLocaleDateString()} {new Date(cart.updated_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-luxe-accent block mb-1">
                    {formatCurrency(totalValue)}
                  </span>
                  <span className="text-xs text-white/40">{cart.cart_data.length} items</span>
                </div>
              </div>

              <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {cart.cart_data.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 bg-white/5 p-2 rounded-lg">
                    <div className="w-12 h-16 relative rounded overflow-hidden flex-shrink-0 bg-black">
                      {item.product.images?.[0]?.url && (
                        <Image src={item.product.images[0].url} alt="" fill className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.product.name}</p>
                      <p className="text-xs text-white/50">
                        Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                {cart.phone_number ? (
                  <button
                    onClick={() => sendWhatsApp(cart)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Recover on WhatsApp
                  </button>
                ) : (
                  <div className="flex-1 bg-white/5 text-white/40 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium">
                    <Phone className="w-4 h-4" />
                    No Phone Number
                  </div>
                )}
                
                <button
                  onClick={() => markAsRecovered(cart.id)}
                  title="Mark as Recovered"
                  className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-luxe-accent/20 hover:text-luxe-accent text-white rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => markAsIgnored(cart.id)}
                  title="Dismiss Cart"
                  className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white rounded-lg transition-colors"
                >
                  <Clock className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
