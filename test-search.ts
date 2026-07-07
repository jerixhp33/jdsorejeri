import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hxeayujekyexdpljzdpe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZWF5dWpla3lleGRwbGp6ZHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNDUwNDIsImV4cCI6MjA5ODgyMTA0Mn0.mYt6Ct6hogrVuLU6cief5NPDHvoMStqN71OhWHXPCsE'
);

async function test() {
  const query = 'poster';
  const { data, error } = await supabase
    .from('products')
    .select('slug, name, product_type, price, images:product_images(url, is_primary)')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .eq('is_active', true)
    .limit(5);

  console.log('Error:', error);
  console.log('Data count:', data?.length);
  console.log('Data:', JSON.stringify(data, null, 2));
}

test();
