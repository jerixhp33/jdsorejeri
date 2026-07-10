import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { PageLoader } from '@/components/shared/PageLoader';
import { SmoothScroll } from '@/components/shared/SmoothScroll';
import { ServiceWorkerRegister } from '@/components/shared/ServiceWorkerRegister';
import { OfflineStatusMonitor } from '@/components/shared/OfflineStatusMonitor';
import { ToastSound } from '@/components/shared/ToastSound';
import { PwaInstallPrompt } from '@/components/shared/PwaInstallPrompt';
import { PushNotificationPrompt } from '@/components/shared/PushNotificationPrompt';
import { Toaster } from 'sonner';
import { Providers } from '@/components/Providers';
import { ContentProtector } from '@/components/shared/ContentProtector';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const getBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SITE_URL || 'https://jdsorejeri.vercel.app';
  if (url.includes('localhost') && process.env.NODE_ENV === 'production') {
    return 'https://jdsorejeri.vercel.app';
  }
  return url;
};

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  manifest: '/manifest.json',
  title: {
    default: 'JD Store — Premium Wall Posters & Earrings',
    template: '%s | JD Store',
  },
  description:
    'Discover premium handcrafted wall posters and earrings. Museum-quality prints and artisan jewelry for the discerning collector.',
  keywords: ['wall posters', 'earrings', 'premium jewelry', 'art prints', 'home decor', 'Tamil Nadu'],
  authors: [{ name: 'JD Store' }],
  creator: 'JD Store',
  publisher: 'JD Store',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    title: 'JD Store — Premium Wall Posters & Earrings',
    description: 'Museum-quality prints and artisan jewelry for the discerning collector.',
    siteName: 'JD Store',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JD Store — Premium Wall Posters & Earrings',
    description: 'Museum-quality prints and artisan jewelry for the discerning collector.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable}`}
    >
      <body className="font-sans antialiased overflow-x-hidden" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Providers>
            <ContentProtector />
            <SmoothScroll />
            <ServiceWorkerRegister />
            <OfflineStatusMonitor />
            <ToastSound />
            <PwaInstallPrompt />
            <PushNotificationPrompt />
            <PageLoader />
            {children}
            <Toaster
              position="top-right"
              expand={true}
              richColors
              theme="dark"
              toastOptions={{
                classNames: {
                  toast: 'bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl !rounded-2xl',
                  title: 'text-white font-semibold text-sm tracking-wide',
                  description: 'text-white/60 text-xs',
                  actionButton: 'bg-luxe-accent text-black font-semibold !rounded-xl',
                  cancelButton: 'bg-white/10 text-white hover:bg-white/20 !rounded-xl',
                  success: '!bg-green-500/10 !border-green-500/20 !text-green-400',
                  error: '!bg-red-500/10 !border-red-500/20 !text-red-400',
                },
              }}
            />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}