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
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  adjustFontFallback: false,
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
  adjustFontFallback: false,
});

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://jdstorejeri.vercel.app';
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  manifest: '/manifest.json',
  applicationName: 'JD Store',
  appleWebApp: {
    title: 'JD Store',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
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
    url: getBaseUrl(),
    title: 'JD Store — Premium Wall Posters & Earrings',
    description: 'Museum-quality prints and artisan jewelry for the discerning collector.',
    siteName: 'JD Store',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'JD Store',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JD Store — Premium Wall Posters & Earrings',
    description: 'Museum-quality prints and artisan jewelry for the discerning collector.',
    images: ['/og-image.jpg'],
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
  other: {
    'robots': 'noai, noimageai',
  },
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
      <head>
        {/* JSON-LD for Site Name */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "JD Store",
              "url": getBaseUrl(),
              "image": `${getBaseUrl()}/icon-512x512.png`,
            })
          }}
        />
      </head>
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
            <MobileBottomNav />
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}