import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { PageLoader } from '@/components/shared/PageLoader';
import { Toaster } from 'sonner';
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

export const metadata: Metadata = {
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
          <PageLoader />
          {children}
          <Toaster
            position="top-right"
            expand={false}
            richColors
            theme="dark"
            toastOptions={{
              classNames: {
                toast: 'glass-card !border-white/15',
                title: 'text-white',
                description: 'text-white/60',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}