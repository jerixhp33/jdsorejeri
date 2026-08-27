-- Grant permissions for custom_uploads
GRANT ALL ON TABLE public.custom_uploads TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.custom_image_audit_logs TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.notifications TO anon, authenticated, service_role;
