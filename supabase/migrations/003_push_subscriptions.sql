CREATE TABLE public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(uid) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can manage their own subscriptions" 
ON public.push_subscriptions FOR ALL 
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- Admins can read all subscriptions to send broadcasts
CREATE POLICY "Admins can read all subscriptions" 
ON public.push_subscriptions FOR SELECT 
USING (
  auth.uid()::text IN (SELECT uid FROM public.user_profiles WHERE role IN ('admin', 'super_admin'))
);
