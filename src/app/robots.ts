import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jdsorejeri.vercel.app';
  if (baseUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
    baseUrl = 'https://jdsorejeri.vercel.app';
  }
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/api', '/checkout'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
