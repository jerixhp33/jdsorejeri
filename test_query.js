const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testQuery() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      delivery_addresses(*),
      orders!orders_user_id_fkey(
        *,
        order_items(*, product:products(name, category_id, images)),
        shipments(*),
        order_events(*)
      )
    `)
    .eq('id', '5d69894f-58c4-4bbd-aa97-1213b8c982bb')
    .single();

  console.log('Error:', error);
  console.log('Data:', data ? 'Success' : 'Null');
}

testQuery();
