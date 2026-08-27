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
          className="relative -mx-4 px-4 md:mx-0 md:px-0"
        >
          {/* Subtle fade edges for mobile */}
          <div className="absolute left-0 top-0 bottom-8 w-4 bg-gradient-to-r from-black to-transparent z-10 md:hidden pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-8 w-8 bg-gradient-to-l from-black to-transparent z-10 md:hidden pointer-events-none" />
          
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-6 md:pb-0 scroll-smooth items-stretch [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {products.slice(0, 8).map((product, i) => (
              <div 
                key={product.id} 
                className="w-[75vw] sm:w-[45vw] flex-shrink-0 snap-start md:w-auto md:flex-shrink-1"
              >
                <ProductCard product={product} index={i} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
