import { MetadataRoute } from 'next';

// AI crawler bots to block from scraping site content
const AI_BOTS = [
  'GPTBot',           // OpenAI - ChatGPT training
  'ChatGPT-User',     // OpenAI - ChatGPT live browsing
  'OAI-SearchBot',    // OpenAI - search crawler
  'CCBot',            // Common Crawl - used by many AI companies
  'anthropic-ai',     // Anthropic - Claude training
  'ClaudeBot',        // Anthropic - Claude browsing
  'Google-Extended',  // Google - Gemini/Bard training
  'PerplexityBot',    // Perplexity AI
  'Bytespider',       // ByteDance/TikTok AI training
  'Applebot-Extended',// Apple Intelligence training
  'Meta-ExternalAgent',// Meta AI training
  'FacebookBot',      // Meta content scraping
  'cohere-ai',        // Cohere AI training
  'Diffbot',          // Diffbot data extraction
  'ImagesiftBot',     // Image scraping
  'Omgilibot',        // Content aggregation
];

export default function robots(): MetadataRoute.Robots {
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

  return {
    rules: [
      // Allow normal search engines
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/api', '/checkout'],
      },
      // Block all AI crawlers
      ...AI_BOTS.map((bot) => ({
        userAgent: bot,
        disallow: ['/'],
      })),
    ],
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  };
}
