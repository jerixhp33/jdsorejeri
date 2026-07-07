# LUXE Store — Complete Setup & Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Supabase Setup](#supabase-setup)
4. [Google OAuth Setup](#google-oauth-setup)
5. [Local Development](#local-development)
6. [Environment Variables](#environment-variables)
7. [Database Migration](#database-migration)
8. [Vercel Deployment](#vercel-deployment)
9. [Admin Setup](#admin-setup)
10. [WhatsApp Configuration](#whatsapp-configuration)
11. [Storage Setup](#storage-setup)
12. [Features Overview](#features-overview)

---

## Prerequisites

- Node.js 18+ and npm/pnpm
- A Supabase account (free tier works)
- A Google Cloud Console account (for OAuth)
- A Vercel account (for deployment)

---

## Project Structure

```
luxe-store/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (main)/             # Store pages (with navbar/footer)
│   │   │   ├── page.tsx        # Landing page
│   │   │   ├── posters/        # Poster listing
│   │   │   ├── earrings/       # Earring listing
│   │   │   ├── product/[slug]/ # Product detail
│   │   │   ├── collections/    # Collections
│   │   │   ├── search/         # Search page
│   │   │   ├── cart/           # Shopping cart
│   │   │   ├── checkout/       # Checkout (WhatsApp flow)
│   │   │   ├── wishlist/       # Wishlist
│   │   │   ├── about/          # About/policies
│   │   │   └── contact/        # Contact + FAQ
│   │   ├── login/              # Google OAuth login
│   │   ├── dashboard/          # User dashboard
│   │   │   ├── page.tsx        # Profile
│   │   │   ├── orders/         # Order history
│   │   │   ├── addresses/      # Saved addresses
│   │   │   └── settings/       # Account settings
│   │   ├── admin/              # Admin panel
│   │   │   ├── page.tsx        # Dashboard
│   │   │   ├── orders/         # Order management
│   │   │   ├── products/       # Product CRUD
│   │   │   ├── users/          # User management
│   │   │   ├── analytics/      # Analytics & reports
│   │   │   ├── broadcast/      # Email campaigns
│   │   │   ├── banners/        # Banner management
│   │   │   ├── collections/    # Collection management
│   │   │   ├── logs/           # System logs
│   │   │   └── settings/       # Store settings
│   │   └── api/                # API routes
│   │       └── auth/callback/  # OAuth callback
│   ├── components/
│   │   ├── landing/            # Landing page sections
│   │   ├── layout/             # Navbar, Footer
│   │   ├── product/            # ProductCard, Detail, etc.
│   │   ├── cart/               # Cart components
│   │   ├── checkout/           # Checkout flow
│   │   ├── dashboard/          # User dashboard
│   │   ├── admin/              # Admin panel
│   │   ├── auth/               # Login page
│   │   └── shared/             # ThemeProvider, etc.
│   ├── hooks/                  # React hooks
│   │   ├── useAuth.ts
│   │   ├── useCart.ts
│   │   ├── useWishlist.ts
│   │   └── useNotifications.ts
│   ├── lib/                    # Utilities & data access
│   │   ├── supabase/           # Supabase clients
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── cart.ts
│   │   ├── orders.ts
│   │   ├── analytics.ts
│   │   └── utils.ts
│   ├── types/                  # TypeScript types
│   └── styles/                 # Global CSS
├── supabase/
│   └── migrations/             # SQL migrations
├── public/                     # Static assets
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Enter project name: `luxe-store`
4. Set a strong database password (save this!)
5. Choose region closest to Tamil Nadu: `ap-south-1` (Singapore or Mumbai)
6. Click **Create new project** and wait ~2 minutes

### 2. Get Your API Keys

Go to **Project Settings → API**:
- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

---

## Google OAuth Setup

### 1. Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to **APIs & Services → OAuth consent screen**
4. Select **External** user type
5. Fill in required fields:
   - App name: `LUXE Store`
   - User support email: your email
   - Authorized domain: `your-project.supabase.co`
6. Add scopes: `email`, `profile`, `openid`
7. Go to **APIs & Services → Credentials**
8. Click **Create Credentials → OAuth 2.0 Client IDs**
9. Application type: **Web application**
10. Add Authorized redirect URIs:
    - `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
    - `http://localhost:3000/api/auth/callback` (for development)
11. Copy **Client ID** and **Client Secret**

### 2. Enable in Supabase

1. Go to **Authentication → Providers → Google**
2. Enable Google provider
3. Paste your Google Client ID and Secret
4. Save

---

## Local Development

```bash
# Clone or navigate to project
cd luxe-store

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Fill in your values in .env.local
# (See Environment Variables section below)

# Run the development server
npm run dev

# Open http://localhost:3000
```

---

## Environment Variables

Create `.env.local` with these values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Change to your domain in production

# WhatsApp (country code + number, no spaces)
NEXT_PUBLIC_WHATSAPP_NUMBER=919999999999
```

---

## Database Migration

### Run Migrations in Supabase

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and click **Run**
4. Then run `supabase/migrations/002_storage_policies.sql`

### Verify Tables

After running, go to **Table Editor** and confirm these tables exist:
- `user_profiles`, `login_logs`
- `products`, `product_categories`, `poster_sizes`, `product_images`
- `carts`, `cart_items`, `wishlists`
- `orders`, `order_items`, `delivery_addresses`
- `reviews`, `notifications`, `banners`
- `collections`, `collection_products`, `testimonials`, `faqs`
- `email_campaigns`, `analytics_events`, `activity_logs`, `audit_logs`, `settings`

---

## Vercel Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/luxe-store.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New → Project**
3. Import your GitHub repository
4. Framework: **Next.js** (auto-detected)
5. Add Environment Variables (same as `.env.local` but change `NEXT_PUBLIC_SITE_URL` to your Vercel URL)
6. Click **Deploy**

### 3. Update OAuth Redirect URLs

After deployment, update your Google OAuth authorized redirect URIs:
- Add: `https://your-app.vercel.app/api/auth/callback`

And update Supabase Auth settings to allow your production domain.

---

## Admin Setup

### Make Yourself an Admin

After your first login:

1. Go to **Supabase SQL Editor**
2. Run:

```sql
UPDATE user_profiles
SET role = 'super_admin'
WHERE email = 'your@email.com';
```

3. Sign out and sign back in
4. Visit `/admin` — you should now have access

---

## WhatsApp Configuration

1. Update `NEXT_PUBLIC_WHATSAPP_NUMBER` in `.env.local` with your business WhatsApp number
2. Format: country code + number (e.g., `919876543210` for +91 98765 43210)
3. Make sure this number has WhatsApp installed and can receive messages
4. Consider using [WhatsApp Business API](https://business.whatsapp.com/) for production

---

## Storage Setup

Product images should be uploaded to Supabase Storage:

1. Go to **Storage** in Supabase dashboard
2. The `product-images` bucket was created by migration 002
3. To upload: Admin Panel → Products → Add Product → Add image URL
4. Get the URL from Supabase Storage after upload

For the admin panel image upload flow, images should be uploaded to Supabase Storage first, then the public URL added to the product.

---

## Features Overview

### Customer Features
- ✅ Google Sign-In (OAuth)
- ✅ Landing page with hero, featured products, collections, testimonials, FAQ
- ✅ Poster catalog with size selection and price updates
- ✅ Earring catalog
- ✅ Search with live results
- ✅ Filters: category, price, stock, sort
- ✅ Product detail with gallery, zoom, size picker
- ✅ Wishlist (saved to Supabase)
- ✅ Cart (stored in Supabase)
- ✅ WhatsApp checkout flow
- ✅ Delivery form (Tamil Nadu districts, pincode validation)
- ✅ Order history dashboard
- ✅ Saved addresses
- ✅ Realtime notifications

### Admin Features
- ✅ Role-based access control (user / admin / super_admin)
- ✅ Dashboard with revenue charts and stats
- ✅ Order management with status progression
- ✅ Product CRUD (create, edit, feature, hide, delete)
- ✅ User management (view, role assignment)
- ✅ Analytics (revenue, orders, devices, top products)
- ✅ Email campaign broadcast
- ✅ System logs (activity, audit, login)
- ✅ Store settings

### Security
- ✅ Google OAuth only (no passwords)
- ✅ Row Level Security (RLS) on all tables
- ✅ Admin middleware on all `/admin` routes
- ✅ Server-side auth validation
- ✅ Input validation with Zod
- ✅ Audit logging for all admin actions
- ✅ HTTPS-ready

---

## Adding Sample Products

After setting up the database, add sample products via the Admin Panel:

1. Go to `/admin/products`
2. Click **Add Product**
3. For posters: add sizes via the product form
4. Upload images to Supabase Storage and paste the URLs

Or use the Supabase SQL editor to bulk insert:

```sql
-- Example: Insert a sample poster
INSERT INTO products (slug, name, description, product_type, category_id, is_active, is_featured, material, finish, orientation)
SELECT 
  'minimal-abstract-001',
  'Minimal Abstract No. 1',
  'A stunning minimalist abstract print featuring clean geometric forms on a muted background.',
  'poster',
  id,
  true,
  true,
  '250gsm Premium Art Paper',
  'matte',
  'portrait'
FROM product_categories WHERE slug = 'minimalist' LIMIT 1;
```

---

## Troubleshooting

### "Auth session not found"
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Verify Google OAuth is enabled in Supabase

### "Permission denied" on Supabase
- Ensure RLS policies were applied (run migration 001)
- Check that the user profile was created correctly

### WhatsApp not opening
- Check `NEXT_PUBLIC_WHATSAPP_NUMBER` format (no + or spaces)
- Test: `https://wa.me/919999999999` should open WhatsApp

### Admin panel shows 404
- Make sure your user has `admin` or `super_admin` role
- Run the UPDATE query in Supabase SQL Editor

---

## Support

For questions or issues:
- WhatsApp: +91 99999 99999
- Email: hello@luxestore.in
