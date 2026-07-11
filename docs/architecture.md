# Architecture

JD Store is a modern, enterprise-grade e-commerce platform built with Next.js App Router and Supabase.

## Tech Stack
- **Frontend**: Next.js 15, React 19, Tailwind CSS, Framer Motion
- **Backend**: Next.js Server Actions, Supabase (PostgreSQL), Edge Functions
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (Email/Password, Magic Link)
- **Testing**: Vitest (Unit), Playwright (E2E)
- **Hosting**: Vercel (Frontend), Supabase (Database)

## Core Modules
1. **Authentication**: Handled via `@supabase/ssr` middleware. Users are mapped to `user_profiles` or `customers` tables.
2. **Product Catalog**: Enterprise structure supporting multiple variants, sizes, colors, and hierarchical categories.
3. **Orders Engine**: Complete lifecycle management from checkout to fulfillment. Uses transactional boundaries.
4. **Fulfillment Engine**: Pluggable courier architecture (Delhivery, STCourier, Manual).
5. **Analytics Engine**: Processes real-time sales, inventory, shipping, and finance metrics.
6. **AI Assistant**: Groq-powered natural language queries for business insights.

## Design Patterns
- **Services Pattern**: Business logic is separated into static classes (e.g., `FinanceAnalyticsService`) for pure logic testing.
- **Dependency Injection**: Courier providers implement a shared `ShippingProvider` interface for easy swapping.
- **Server Components (RSC)**: Used heavily for data fetching to reduce client bundle size.
