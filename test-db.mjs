import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDb() {
  const { data: subs, error: err1 } = await supabase.from('push_subscriptions').select('*');
  console.log('--- PUSH SUBSCRIPTIONS ---');
  console.log(subs);
  if (err1) console.error(err1);

  const { data: orders, error: err2 } = await supabase.from('orders').select('id, order_number, user_id, created_at').order('created_at', { ascending: false }).limit(3);
  console.log('\n--- LATEST 3 ORDERS ---');
  console.log(orders);
  if (err2) console.error(err2);
  
  const { data: profiles, error: err3 } = await supabase
    .from('user_profiles')
    .select('id, uid, email, role')
    .in('uid', [
      '51ef11d5-bcb0-445b-84d3-74fbbf155290', 
      '6b6ef851-0304-4ab1-b4c0-06f4a0387e98',
      '153047cf-7b19-49b5-bfdf-210ca7a90cbd'
    ]);
  console.log('\n--- SPECIFIC USER PROFILES ---');
  console.log(profiles);
  if (err3) console.error(err3);
  
  const { data: p2 } = await supabase.from('user_profiles').select('id, uid, email').eq('id', '51ef11d5-bcb0-445b-84d3-74fbbf155290');
  console.log('\n--- PROFILE BY ID ---');
  console.log(p2);
}

checkDb();
