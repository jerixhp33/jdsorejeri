const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:product_categories(*), images:product_images(*)')
    .eq('is_active', true)
    .limit(5);
    
  console.log("With product_categories:", error ? error.message : "Success");
  if (data) {
    console.log(data.map(d => ({ name: d.name, images: d.images })));
  }

  const { data: data2, error: error2 } = await supabase
    .from('products')
    .select('*, category:categories(*), images:product_images(*)')
    .eq('is_active', true)
    .limit(5);

  console.log("With categories:", error2 ? error2.message : "Success");
}

test();
