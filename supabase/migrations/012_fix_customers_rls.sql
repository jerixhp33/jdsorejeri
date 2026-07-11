-- ============================================================
-- Fix Customers Table RLS and Add Indexes
-- ============================================================

DROP POLICY IF EXISTS "Admins can view all customers" ON customers;
DROP POLICY IF EXISTS "Admins can update all customers" ON customers;
DROP POLICY IF EXISTS "Users can view own customer record" ON customers;

-- Fix Admin Policies (use get_my_role() helper or check uid)
CREATE POLICY "Admins can view all customers" ON customers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.uid = auth.uid()::TEXT AND user_profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update all customers" ON customers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.uid = auth.uid()::TEXT AND user_profiles.role IN ('admin', 'super_admin')
        )
    );

-- Fix User Policy (join user_profiles to match auth.uid)
CREATE POLICY "Users can view own customer record" ON customers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = customers.user_id AND user_profiles.uid = auth.uid()::TEXT
        )
    );

-- Add missing performance indexes
CREATE INDEX IF NOT EXISTS idx_customers_user ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created ON customers(created_at DESC);
