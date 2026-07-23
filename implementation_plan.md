# Email Aesthetic & Automation Plan

To achieve highly aesthetic, modern emails that trigger completely automatically, we need to upgrade the email system from basic HTML strings to a robust, component-based email framework.

## User Review Required

> [!IMPORTANT]
> Please review the tools and workflows proposed below. This is a significant infrastructure upgrade that will make your store's communication look extremely professional. 

## Open Questions

> [!QUESTION]
> 1. For the automated "Abandoned Cart" emails, how long should we wait before sending it? (e.g., 1 hour or 24 hours after abandonment?)
> 2. Are there any other automated emails you want besides Welcome, Order Confirmation, Shipping Update, and Abandoned Cart?

## Proposed Changes

### 1. New Email Infrastructure (React Email)
We will install and configure `react-email` and `@react-email/components`. This allows us to build beautiful, responsive emails using React and Tailwind CSS instead of writing messy, hard-to-read raw HTML strings.

#### [NEW] `src/emails/` Directory
We will create dedicated React components for every email type:
- `OrderConfirmationEmail.tsx`: A beautifully formatted receipt with product images and totals.
- `ShippingUpdateEmail.tsx`: Tracking details with a clear "Track Package" button.
- `AbandonedCartEmail.tsx`: A visually appealing reminder showing the exact items they left behind, with a "Complete Purchase" button.
- `WelcomeEmail.tsx`: Sent when a user first signs up.

### 2. Automated Triggers

#### [NEW] Supabase Database Webhooks
Instead of manually triggering emails from the frontend, we will set up Supabase Webhooks to automatically ping our Next.js backend when certain database events happen:
- **Trigger**: New row in `orders` table -> **Action**: Send Order Confirmation Email.
- **Trigger**: Row updated in `shipments` table -> **Action**: Send Shipping Update Email.
- **Trigger**: New row in `user_profiles` -> **Action**: Send Welcome Email.

#### [NEW] Automated Cron Jobs (Vercel Cron)
- **Action**: A scheduled task that runs every hour. It will scan the `abandoned_carts` table for carts older than 1 hour with status `pending`. It will automatically send the `AbandonedCartEmail` and update the status to `reminded`.

### 3. Backend Implementation
#### [MODIFY] `src/lib/email.ts`
- Upgrade the email sender to compile the new React Email components into HTML before sending them via Nodemailer.

#### [NEW] `src/app/api/webhooks/email/route.ts`
- A secure API route that listens for Supabase Webhook events and triggers the correct React Email template.

## Verification Plan

### Automated Tests
- We can preview all the React Emails in the browser locally before deploying them to ensure they look perfect on both desktop and mobile email clients.

### Manual Verification
- We will place a test order to verify the automatic Order Confirmation email arrives instantly.
- We will add a tracking number to verify the Shipping Update email triggers.
- We will simulate an abandoned cart and manually trigger the cron job route to verify the automated recovery email is sent.
