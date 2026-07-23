DROP POLICY IF EXISTS "Admins can manage abandoned carts" ON public.abandoned_carts;

CREATE POLICY "Admins can manage abandoned carts"
  ON public.abandoned_carts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.uid = auth.uid()::text
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.uid = auth.uid()::text
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );
