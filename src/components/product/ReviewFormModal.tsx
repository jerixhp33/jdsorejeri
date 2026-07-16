'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onSuccess: () => void;
}

export function ReviewFormModal({ isOpen, onClose, productId, productName, onSuccess }: ReviewFormModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim() || undefined,
          reviewBody: body.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      toast.success('Review submitted successfully!');
      onSuccess();
      onClose();
      // Reset form
      setRating(0);
      setTitle('');
      setBody('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-black/80 border border-foreground/ rounded-3xl p-6 sm:p-8 shadow-2xl z-10 overflow-hidden"
        >
          {/* Subtle inner glow */}
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.05), transparent 70%)' }} />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-foreground/ hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-xl font-display font-semibold text-foreground mb-1">Write a Review</h3>
          <p className="text-foreground/ text-sm mb-6">Share your thoughts on {productName}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-foreground/ mb-2">Overall Rating *</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "w-8 h-8 transition-colors",
                        (hoverRating || rating) >= star
                          ? "text-luxe-accent fill-current"
                          : "text-foreground/"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground/ mb-2">
                Review Title <span className="text-foreground/">(Optional)</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. Absolutely beautiful!"
                className="w-full bg-foreground/ border border-foreground/ rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/ focus:outline-none focus:border-luxe-accent/50 transition-colors"
              />
            </div>

            {/* Body */}
            <div>
              <label htmlFor="body" className="block text-sm font-medium text-foreground/ mb-2">
                Review <span className="text-foreground/">(Optional)</span>
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Tell others what you loved about this product..."
                rows={4}
                className="w-full bg-foreground/ border border-foreground/ rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/ focus:outline-none focus:border-luxe-accent/50 transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="w-full btn-luxe flex justify-center py-3.5"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Review'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
