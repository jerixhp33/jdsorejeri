# Disaster Recovery Plan

This document outlines the disaster recovery procedures for JD Store.

## Supabase Database Restoration
Supabase provides automated backups and Point-in-Time Recovery (PITR) on Pro plans and above.

### Scenario 1: Accidental Data Deletion (Table level)
1. Go to the Supabase Dashboard -> Database -> Backups.
2. If PITR is enabled, select the exact minute before the deletion occurred.
3. Click **Restore**.
4. The database will be unavailable for approximately 2-5 minutes during the restore.

### Scenario 2: Full Database Corruption
1. Go to Supabase Dashboard -> Database -> Backups.
2. Select the latest healthy daily backup.
3. Click **Restore**.
4. Notify users via email/status page of the data rollback.

## Vercel Deployment Rollback
If a bad deployment crashes the production app:
1. Go to Vercel Dashboard -> Deployments.
2. Find the last known good deployment (indicated by a green check and previous timestamp).
3. Click the three dots -> **Promote to Production** (or **Assign Custom Domains**).
4. Vercel will instantly route traffic to the stable build without rebuilding.

## Third-Party API Outages
- **Courier (Delhivery/STCourier)**: The Fulfillment Engine falls back to `ManualProvider` automatically if API endpoints are unreachable. Admin can manually export CSV and upload it to the courier portal.
- **Payment Gateway**: Switch the active payment gateway in the admin settings or environment variables if the primary one goes down.

## Emergency Contact
- **Tech Lead**: tech@jdstore.com
- **Hosting Support**: Vercel Enterprise Support
- **Database Support**: Supabase Enterprise Support
