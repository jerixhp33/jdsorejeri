-- Create customers table linked to user_profiles
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
    customer_number TEXT UNIQUE,
    loyalty_points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    membership_tier TEXT DEFAULT 'bronze',
    admin_notes TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies for customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Admins can read all customers
CREATE POLICY "Admins can view all customers" ON customers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
        )
    );

-- Admins can update all customers
CREATE POLICY "Admins can update all customers" ON customers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
        )
    );

-- Users can view their own customer record
CREATE POLICY "Users can view own customer record" ON customers
    FOR SELECT USING (user_id = auth.uid());

-- Function to automatically create a customer record when a user_profile is created
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER AS $$
DECLARE
    new_customer_number TEXT;
BEGIN
    -- Generate a simple customer number (e.g. CUST-123456)
    new_customer_number := 'CUST-' || floor(random() * 900000 + 100000)::TEXT;
    
    INSERT INTO public.customers (user_id, customer_number)
    VALUES (NEW.id, new_customer_number);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create customer on user_profile insert
CREATE TRIGGER on_profile_created_create_customer
    AFTER INSERT ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_customer();
