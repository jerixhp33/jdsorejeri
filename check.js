const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

if (!urlMatch || !keyMatch) {
  console.error("Missing env vars in .env.local");
  process.exit(1);
}

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function check() {
  const now = new Date().toISOString();
  console.log('Now (UTC):', now);
  
  const { data, error } = await supabase
    .from('flash_sales')
    .select('*, products:flash_sale_products(id, flash_sale_id, product_id)')
    .eq('is_active', true)
    .lte('start_at', now)
    .gt('end_at', now)
    .order('created_at', { ascending: false });
    
  console.log('Result:', JSON.stringify({ data, error }, null, 2));
}

check();
