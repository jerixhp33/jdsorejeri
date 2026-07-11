-- ============================================================
-- Grant permissions for new tables
-- ============================================================

GRANT ALL ON TABLE order_events TO anon, authenticated, service_role;
GRANT ALL ON TABLE shipments TO anon, authenticated, service_role;
GRANT ALL ON TABLE payments TO anon, authenticated, service_role;
GRANT ALL ON TABLE returns TO anon, authenticated, service_role;
GRANT ALL ON TABLE refunds TO anon, authenticated, service_role;

-- Grant permissions on sequences if any (UUIDs don't need sequences, but just in case)
-- No sequences created, all PKs are gen_random_uuid()
