import { createClient } from '@/lib/supabase/server';
import { ThemeAdminClient } from './ThemeAdminClient';

export const metadata = {
  title: 'Theme & Atmosphere | Admin',
};

export default async function AdminThemePage() {
  const supabase = await createClient();
  const { data: themes } = await supabase
    .from('home_theme_config')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ThemeAdminClient initialThemes={themes || []} />
    </div>
  );
}
