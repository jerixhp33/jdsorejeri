'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Bell, Search, Mail } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

type WaitlistEntry = any;

interface AdminWaitlistViewProps {
  waitlists: WaitlistEntry[];
}

export function AdminWaitlistView({ waitlists: initial }: AdminWaitlistViewProps) {
  const [waitlists, setWaitlists] = useState(initial);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const supabase = createClient();

  const filteredWaitlists = waitlists.filter((w) => {
    const q = searchQuery.toLowerCase();
    const productName = w.product?.name?.toLowerCase() || '';
    const userEmail = w.user_profile?.email?.toLowerCase() || '';
    const userName = w.user_profile?.name?.toLowerCase() || '';
    return productName.includes(q) || userEmail.includes(q) || userName.includes(q);
  });

  const deleteEntry = async (id: string) => {
    if (!confirm('Remove this user from the waitlist?')) return;
    setIsDeleting(id);
    try {
      const { error } = await supabase.from('waitlists').delete().eq('id', id);
      if (error) throw error;
      setWaitlists((prev) => prev.filter((w) => w.id !== id));
      toast.success('Removed from waitlist');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove entry');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-luxe-accent" />
            Waitlists
          </h1>
          <p className="text-foreground/ text-sm mt-1">Manage users waiting for out-of-stock products</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/ pointer-events-none" />
          <input
            type="text"
            placeholder="Search products or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 bg-foreground/ border border-foreground/ rounded-xl pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-luxe-accent transition-colors"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-foreground/ bg-white/[0.02]">
                <th className="p-4 font-semibold text-foreground/">Product</th>
                <th className="p-4 font-semibold text-foreground/">Variant</th>
                <th className="p-4 font-semibold text-foreground/">Customer</th>
                <th className="p-4 font-semibold text-foreground/">Date Requested</th>
                <th className="p-4 font-semibold text-foreground/ text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWaitlists.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-foreground/">
                    No waitlist entries found.
                  </td>
                </tr>
              ) : (
                filteredWaitlists.map((w, i) => (
                  <motion.tr
                    key={w.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-foreground/ hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-card overflow-hidden flex-shrink-0">
                          {w.product?.images?.[0]?.url && (
                            <img src={w.product.images[0].url} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="text-foreground font-medium">{w.product?.name || 'Unknown Product'}</p>
                          <p className="text-foreground/ text-[10px] uppercase">{w.product?.product_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-foreground/">
                      {w.poster_size?.label ? w.poster_size.label : '-'}
                    </td>
                    <td className="p-4">
                      <p className="text-foreground">{w.user_profile?.name || 'Unknown User'}</p>
                      <a href={`mailto:${w.user_profile?.email}`} className="text-foreground/ text-xs hover:text-luxe-accent flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {w.user_profile?.email}
                      </a>
                    </td>
                    <td className="p-4 text-foreground/">
                      {formatDate(w.created_at)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => deleteEntry(w.id)}
                        disabled={isDeleting === w.id}
                        className="p-2 text-foreground/ hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-50"
                        title="Remove from waitlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
