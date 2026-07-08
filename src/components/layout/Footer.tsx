import Link from 'next/link';
import { JDLogo } from '@/components/shared/JDLogo';
import { Instagram, Twitter, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

const FOOTER_LINKS = {
  Shop: [
    { label: 'Wall Posters', href: '/posters' },
    { label: 'Earrings', href: '/earrings' },
    { label: 'Collections', href: '/collections' },
  ],
  Help: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'FAQs', href: '/contact#faq' },
    { label: 'Shipping Policy', href: '/about#shipping' },
    { label: 'Return Policy', href: '/about#returns' },
  ],
  Account: [
    { label: 'My Account', href: '/dashboard' },
    { label: 'My Orders', href: '/dashboard/orders' },
    { label: 'Wishlist', href: '/wishlist' },
    { label: 'Cart', href: '/cart' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-luxe-near-black border-t border-white/10">
      {/* Main footer */}
      <div className="page-container py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <JDLogo size={36} />
              <span className="font-display text-xl font-bold text-white">JD Store</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs mb-6">
              Premium wall posters and artisan earrings crafted for those who appreciate beauty in
              every detail. Delivered across Tamil Nadu.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white/50 text-sm">
                <MapPin className="w-4 h-4 text-luxe-accent flex-shrink-0" />
                Tamil Nadu, India
              </div>
              <div className="flex items-center gap-3 text-white/50 text-sm">
                <Phone className="w-4 h-4 text-luxe-accent flex-shrink-0" />
                <a href="tel:+919360490974" className="hover:text-white transition-colors">
                  +91 9360490974
                </a>
              </div>
              <div className="flex items-center gap-3 text-white/50 text-sm">
                <Mail className="w-4 h-4 text-luxe-accent flex-shrink-0" />
                <a href="mailto:jdstore.jeri@gmail.com" className="hover:text-white transition-colors">
                  jdstore.jeri@gmail.com
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <a
                href="https://www.instagram.com/wtxs_jexi?igsh=bXhldGV2ZmppMXhr"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/919360490974"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all"
                aria-label="WhatsApp"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-white font-semibold text-sm mb-4">{section}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link prefetch={true} href={link.href}
                      className="text-white/40 text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="page-container py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/30 text-xs">
              © {new Date().getFullYear()} JD Store. All rights reserved.
            </p>
            <div className="flex items-center gap-5">
              <Link prefetch={true} href="/about#privacy"
                className="text-white/30 text-xs hover:text-white/60 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link prefetch={true} href="/about#terms"
                className="text-white/30 text-xs hover:text-white/60 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
