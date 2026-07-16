'use client';

import { motion } from 'framer-motion';
import { Shield, Truck, RefreshCw, Award, Headphones, Sparkles } from 'lucide-react';

const FEATURES = [
  {
    icon: Award,
    title: 'Museum-Grade Quality',
    body: 'Every poster printed on premium 250gsm paper with UV-resistant inks that last for decades without fading.',
  },
  {
    icon: Sparkles,
    title: 'Artisan Crafted',
    body: 'Each earring is handcrafted by skilled artisans. No mass production — every piece is unique.',
  },
  {
    icon: Truck,
    title: 'Fast Tamil Nadu Delivery',
    body: 'We deliver to all 38 districts of Tamil Nadu within 3–5 business days. Free delivery on orders above ₹999.',
  },
  {
    icon: Shield,
    title: 'Secure WhatsApp Orders',
    body: 'No complex payment gateways. Order easily via WhatsApp with personal confirmation from our team.',
  },
  {
    icon: RefreshCw,
    title: 'Easy Returns',
    body: 'Not happy with your purchase? We offer hassle-free returns within 7 days of delivery.',
  },
  {
    icon: Headphones,
    title: 'Personal Support',
    body: 'Real humans, not bots. Reach us directly on WhatsApp for any questions, anytime.',
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-2">
      <div className="page-container">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-luxe-accent text-sm tracking-widest uppercase mb-3"
          >
            Why JD
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="section-title mb-4"
          >
            Crafted for the discerning
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="section-subtitle mx-auto"
          >
            We obsess over quality so you don't have to. From materials to packaging, every detail
            is intentional.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl md:rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-md p-4 md:p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500 group"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-luxe-accent/10 border border-luxe-accent/20 flex items-center justify-center mb-3 md:mb-5 group-hover:bg-luxe-accent/20 transition-colors">
                <feature.icon className="w-4 h-4 md:w-5 md:h-5 text-luxe-accent" />
              </div>
              <h3 className="text-white font-semibold text-sm md:text-base mb-1 md:mb-2">{feature.title}</h3>
              <p className="text-white/45 text-[11px] md:text-sm leading-relaxed">{feature.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
