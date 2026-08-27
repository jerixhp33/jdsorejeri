'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import type { Product } from '@/types';

interface BestSellersProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
  noContainer?: boolean;
}

export function BestSellers({ products, title = "Best Sellers", subtitle = "Most Loved", viewAllLink = "/best-sellers", noContainer = false }: BestSellersProps) {
  if (!products.length) return null;

  return (
    <section className="py-2">
      <div className={noContainer ? "" : "page-container"}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-luxe-accent text-sm tracking-widest uppercase mb-3"
            >
              {subtitle}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="section-title"
            >
              {title}
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Link prefetch={true} href={viewAllLink}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors group"
            >
              View all products
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Grid / Horizontal Scroll */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative -mx-4 px-4 md:mx-0 md:px-0 py-4"
        >
          {/* True transparent mask to blend perfectly with the global aura background */}
          <div 
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 pt-4 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-6 md:pb-0 md:pt-0 scroll-smooth items-stretch [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ 
              maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)'
            }}
          >
            {/* Duplicate array for simulated infinite scroll */}
            {[...products.slice(0, 8), ...products.slice(0, 8), ...products.slice(0, 8)].map((product, i) => (
              <div 
                key={`${product.id}-${i}`} 
                className="w-[55vw] sm:w-[45vw] flex-shrink-0 snap-center md:snap-start md:w-auto md:flex-shrink-1 transition-transform duration-300 hover:scale-[1.02]"
              >
                <ProductCard product={product} index={i % 8} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
