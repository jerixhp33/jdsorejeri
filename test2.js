const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const SUPABASE_KEY = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, is_best_seller, product_type, images:product_images(*), category:categories(*)')
    .eq('is_best_seller', true);
  
  if (error) {
    console.log("Error:", error);
    return;
  }
  
  console.log(JSON.stringify(data, null, 2));
}

test();
