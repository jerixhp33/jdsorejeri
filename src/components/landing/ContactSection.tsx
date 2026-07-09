'use client';

import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, MessageCircle, Clock } from 'lucide-react';

export function ContactSection() {
  return (
    <section id="contact" className="py-2">
      <div className="page-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Info */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-luxe-accent text-sm tracking-widest uppercase mb-3"
            >
              Contact
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="section-title mb-4"
            >
              We're here to help
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-white/50 text-base leading-relaxed mb-10"
            >
              Questions about your order, custom sizes, or anything else? Reach us directly — we
              respond within hours, not days.
            </motion.p>

            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-luxe-accent/10 border border-luxe-accent/20 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-luxe-accent" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm mb-0.5">WhatsApp</p>
                  <a
                    href="https://wa.me/919360490974"
                    rel="noopener noreferrer"
                    className="text-white/50 text-sm hover:text-luxe-accent transition-colors"
                  >
                    +91 9360490974
                  </a>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-luxe-accent/10 border border-luxe-accent/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-luxe-accent" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm mb-0.5">Email</p>
                  <a
                    href="mailto:jdstore.jeri@gmail.com"
                    className="text-white/50 text-sm hover:text-luxe-accent transition-colors"
                  >
                    jdstore.jeri@gmail.com
                  </a>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-luxe-accent/10 border border-luxe-accent/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-luxe-accent" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm mb-0.5">Location</p>
                  <p className="text-white/50 text-sm">Tamil Nadu, India</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-luxe-accent/10 border border-luxe-accent/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-luxe-accent" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm mb-0.5">Hours</p>
                  <p className="text-white/50 text-sm">Mon–Sat, 9 AM – 7 PM IST</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right: CTA card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-7 h-7 text-green-400" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white mb-3">
              Chat with us on WhatsApp
            </h3>
            <p className="text-white/50 text-sm leading-relaxed mb-8">
              The fastest way to get help, place custom orders, or ask about a product. We typically
              reply within 30 minutes during business hours.
            </p>
            <a
              href="https://wa.me/919360490974?text=Hi%20JD%20Store!%20I%20have%20a%20question."
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-green-400 transition-colors w-full justify-center"
            >
              <MessageCircle className="w-4 h-4" />
              Start a Conversation
            </a>
            <p className="text-white/25 text-xs mt-4">Usually replies in under 30 minutes</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
