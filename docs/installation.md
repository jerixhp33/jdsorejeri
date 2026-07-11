# Installation Guide

Follow these steps to set up JD Store locally.

## Prerequisites
- Node.js 20.x
- NPM 10.x
- Supabase CLI (optional, for local DB)

## 1. Clone & Install
```bash
git clone https://github.com/your-org/jd-store.git
cd jd-store
npm install
```

## 2. Environment Variables
Copy the `.env.example` file to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the required values:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY` (for AI Assistant)

## 3. Database Setup (Supabase)
Link your local project to your Supabase project and push the schema:
```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

## 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

## 5. Testing
- **Unit Tests**: `npm run test`
- **E2E Tests**: `npx playwright test`
