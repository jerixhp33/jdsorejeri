# JD Store - Version 1.0 Release Checklist

Use this checklist to ensure all quality, security, and operational standards are met before promoting a release to production.

## 1. Security & Dependencies
- [ ] `npm audit` reports zero High/Critical runtime vulnerabilities.
- [ ] Dependencies updated to secure versions.
- [ ] Production `.env` variables are correct and securely stored (not committed).
- [ ] Supabase RLS policies are active and verified.
- [ ] Admin routes properly enforce `requireAdmin()` on the server side.

## 2. Quality Assurance (Testing)
- [ ] `npm run type-check` passes with 0 errors.
- [ ] `npm run lint` passes with 0 errors.
- [ ] Unit tests (`npx vitest run`) pass at 100%.
- [ ] E2E tests (`npx playwright test`) pass successfully.
- [ ] Manual test order completed end-to-end (Cart → Checkout → Payment → Fulfillment → Refund).

## 3. Build & Deployment
- [ ] `npm run build` succeeds locally without warnings.
- [ ] Staging environment deployment successful.
- [ ] Database migrations (`npx supabase db push`) applied successfully to Staging.
- [ ] Edge Functions (if applicable) deployed.

## 4. Operational Readiness
- [ ] Vercel Analytics and Speed Insights are active.
- [ ] Sentry / Error monitoring is configured and receiving events.
- [ ] Database PITR (Point-in-Time Recovery) or daily backups enabled in Supabase.
- [ ] Staging Sign-off: Beta testers reported no blocking issues.

## 5. Launch
- [ ] Deploy to Production Environment.
- [ ] Run post-deployment smoke tests on Production (e.g., register a test account, check catalog).
- [ ] Monitor logs intensely for the first 24 hours.
