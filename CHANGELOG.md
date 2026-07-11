# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.0.0] - 2026-07-11

### Added
- Enterprise Product Management with variants, options, and bulk pricing.
- Complete Orders Management flow with real-time sync.
- Customer CRM module with aggregated lifetime value tracking.
- Shipping & Fulfillment Engine with Mock ST Courier integration.
- Analytics Dashboard for Sales, Customers, Inventory, and Shipping metrics.
- AI Business Assistant for generating actionable insights from reports.
- Role-based Security via robust Supabase Row Level Security (RLS) policies.
- Full Testing Infrastructure (Vitest, React Testing Library, Playwright).
- Automated CI/CD pipelines via GitHub Actions.
- Comprehensive Production Audit and Documentation suite.

### Fixed
- Unprotected Admin API authorization routes (generate-insights, reports).
- Broken RLS relationships linking users to customer records.
- Privilege escalation vector allowing arbitrary role updates.
- Dependency vulnerability updates (nodemailer).

### Security
- Hardened server-side API authorization.
- Protected `user_profiles` role column with a dedicated Postgres trigger.
- Optimized and secured database policies and indexes.
- Scanned and remediated environment variable exposure.
