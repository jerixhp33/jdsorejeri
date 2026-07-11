import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      user:user_profiles(name, email, phone),
      delivery_address:delivery_addresses(*),
      items:order_items(
        *,
        product:products(name, slug, images:product_images(url)),
        poster_size:poster_sizes(label)
      ),
      events:order_events(*),
      payments(*),
      shipments(*),
      returns(*),
      refunds(*)
    `)
    .limit(1);

  if (error) {
    console.error('Query Error:', error);
  } else {
    console.log('Success, rows found:', data?.length);
  }
}

run();
