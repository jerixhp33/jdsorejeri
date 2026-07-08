'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import type { Testimonial } from '@/types';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  if (!testimonials.length) return null;

  return (
    <section className="py-20 lg:py-28 overflow-hidden">
      <div className="page-container">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-luxe-accent text-sm tracking-widest uppercase mb-3"
          >
            Reviews
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="section-title mb-4"
          >
            What our customers say
          </motion.h2>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.slice(0, 6).map((testimonial, i) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className={cn(
                'rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-md p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500 group',
                i === 0 && 'md:col-span-2 lg:col-span-1'
              )}
            >
              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={cn(
                      'w-4 h-4',
                      j < testimonial.rating
                        ? 'text-luxe-accent fill-current'
                        : 'text-white/20'
                    )}
                  />
                ))}
              </div>

              {/* Quote icon */}
              <Quote className="w-6 h-6 text-luxe-accent/30 mb-3" />

              {/* Body */}
              <p className="text-white/70 text-sm leading-relaxed mb-5 line-clamp-4">
                {testimonial.body}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                {testimonial.author_image ? (
                  <Image
                    src={testimonial.author_image}
                    alt={testimonial.author_name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-luxe-accent/20 border border-luxe-accent/30 flex items-center justify-center">
                    <span className="text-luxe-accent text-sm font-semibold">
                      {getInitials(testimonial.author_name)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-white text-sm font-medium">{testimonial.author_name}</p>
                  {testimonial.author_location && (
                    <p className="text-white/40 text-xs">{testimonial.author_location}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
