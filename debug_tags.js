const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: cols } = await supabase.from('collections').select('name, slug');
  console.log('Collections:', cols);

  const { data: prods } = await supabase.from('products').select('name, tags');
  console.log('Products:', JSON.stringify(prods, null, 2));
}

check();
