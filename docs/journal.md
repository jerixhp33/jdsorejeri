# JD Store Engineering Journal

This document tracks significant architectural decisions, lessons learned, and the rationale behind major changes. It captures the *why* behind the *what*.

## [v1.0.0] - 2026-07-11

**Context & Goal:** 
The platform reached feature-completion for v1.0.0. The goal was to establish a rock-solid foundation for enterprise-level commerce, focusing on modularity, security, and operational readiness.

**Key Decisions:**
- **Decoupled Architecture:** Separated the Fulfillment Engine from external courier APIs (ST Courier) to allow swapping providers without rewriting core business logic.
- **Strict RLS Enforcement:** Moved all authorization logic to Postgres Row-Level Security and explicit server-side `requireAdmin()` checks, neutralizing privilege escalation attacks.
- **Testing Strategy:** Chose Vitest for business logic and Playwright for E2E user journeys, balancing fast feedback loops with real-world browser testing.

**Lessons Learned:**
- *Security is never done.* The final production audit uncovered a silent privilege escalation vector in the `user_profiles` table that client-side checks missed. A Postgres trigger was required to truly lock it down.
- *Placeholder secrets break E2E.* Playwright E2E tests will timeout if run against a local environment configured with placeholder `.env` keys. Seeding realistic data is a hard prerequisite for meaningful E2E validation.

**Impact:**
JD Store is now structurally sound and ready for Staging (Phase 4.2) and Beta Testing (Phase 4.3). The platform is positioned to scale without a fundamental rewrite.
