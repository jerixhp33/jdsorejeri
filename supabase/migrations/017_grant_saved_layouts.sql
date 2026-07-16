-- Grant missing permissions on saved_layouts
GRANT ALL ON TABLE public.saved_layouts TO anon, authenticated, service_role;
