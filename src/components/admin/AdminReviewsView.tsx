'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle2, XCircle, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelativeTime } from '@/lib/utils';
import Image from 'next/image';

interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  image_url: string | null;
  is_verified: boolean;
  is_approved: boolean;
  created_at: string;
  user_profiles: { name: string; email: string; avatar_url: string | null };
  products: { name: string; image_paths: string[] };
}

export function AdminReviewsView({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const filtered = reviews.filter(r => {
    if (filter === 'pending') return !r.is_approved;
    if (filter === 'approved') return r.is_approved;
    return true;
  });

  const handleToggleApprove = async (id: string, current: boolean) => {
    const res = await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_approved: !current })
    });
    
    if (res.ok) {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: !current } : r));
      toast.success(current ? 'Review hidden' : 'Review approved');
    } else {
      toast.error('Failed to update review');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review permanently?')) return;
    const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setReviews(prev => prev.filter(r => r.id !== id));
      toast.success('Review deleted');
    } else {
      toast.error('Failed to delete review');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Product Reviews</h1>
          <p className="text-white/50 text-sm mt-1">Manage and moderate user reviews and photos.</p>
        </div>
        
        <div className="flex gap-2">
          {['all', 'pending', 'approved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize",
                filter === f ? "bg-white text-black" : "bg-white/5 text-white hover:bg-white/10"
              )}
            >
              {f} {f === 'pending' && reviews.filter(r => !r.is_approved).length > 0 && `(${reviews.filter(r => !r.is_approved).length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center py-20 text-white/30">
              <Star className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No reviews found.</p>
            </motion.div>
          ) : (
            filtered.map((review, i) => (
              <motion.div
                key={review.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "p-5 rounded-2xl border transition-all",
                  review.is_approved ? "bg-white/5 border-white/10" : "bg-yellow-500/5 border-yellow-500/20"
                )}
              >
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="flex-1 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                      {review.user_profiles?.avatar_url ? (
                        <img src={review.user_profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/50">{review.user_profiles?.name?.[0] || '?'}</div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{review.user_profiles?.name || 'Anonymous'}</p>
                        {review.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-luxe-accent" />}
                        <span className="text-white/30 text-xs text-nowrap">&bull; {formatRelativeTime(review.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex text-yellow-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={cn("w-3.5 h-3.5", i < review.rating ? "fill-current" : "opacity-30")} />
                          ))}
                        </div>
                        <span className="text-white/40 text-xs">on</span>
                        <span className="text-white/70 text-xs font-medium">{review.products?.name}</span>
                      </div>
                      
                      <div className="mt-3">
                        {review.title && <p className="text-white font-medium text-sm mb-1">{review.title}</p>}
                        {review.body && <p className="text-white/70 text-sm">{review.body}</p>}
                      </div>
                    </div>
                  </div>

                  {review.image_url && (
                    <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden border border-white/10 relative group">
                      <Image src={review.image_url} alt="Review" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a href={review.image_url} target="_blank" rel="noreferrer" className="text-white text-xs underline">View Full</a>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-center md:justify-start gap-2 border-t border-white/10 pt-4 md:border-0 md:pt-0">
                    <button
                      onClick={() => handleToggleApprove(review.id, review.is_approved)}
                      className={cn(
                        "btn-luxe-outline py-2 px-4 flex-1 md:flex-none flex items-center justify-center gap-2",
                        review.is_approved ? "text-white/50 hover:border-red-400 hover:text-red-400" : "bg-luxe-accent/10 border-luxe-accent text-luxe-accent hover:bg-luxe-accent hover:text-black"
                      )}
                    >
                      {review.is_approved ? <><XCircle className="w-4 h-4"/> Hide</> : <><CheckCircle2 className="w-4 h-4"/> Approve</>}
                    </button>
                    <button onClick={() => handleDelete(review.id)} className="p-2 rounded-xl bg-white/5 text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
