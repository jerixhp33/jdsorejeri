'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import type { Product } from '@/types';

interface DynamicShowcaseProps {
  products: Product[];
}

function formatTitle(type: string): string {
  if (type === 'hair_clip') return 'Hair Clips';
  if (type === 'other') return 'Miscellaneous';
  return type.charAt(0).toUpperCase() + type.slice(1) + 's';
}

export function DynamicShowcase({ products }: DynamicShowcaseProps) {
  if (!products.length) return null;

  // Group products by type
  const grouped = products.reduce((acc, product) => {
    const type = product.product_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Render a section for each product type that has at least 1 featured product
  return (
    <>
      {Object.entries(grouped).map(([type, typeProducts]) => (
        <section key={type} className="py-2 mb-8 lg:mb-12">
          <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 md:mb-12">
              <div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-luxe-accent text-sm tracking-widest uppercase mb-3"
                >
                  Featured Collection
                </motion.p>
                <motion.h2
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="section-title"
                >
                  Top {formatTitle(type)}
                </motion.h2>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Link prefetch={true} href={`/category/${type}`}
                  className="flex items-center gap-2 text-sm text-foreground/ hover:text-foreground transition-colors group"
                >
                  View all {formatTitle(type).toLowerCase()}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 items-start">
              {typeProducts.slice(0, 8).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
