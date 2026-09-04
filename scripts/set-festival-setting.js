const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = envContent.split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '');
  return acc;
}, {});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'] || '', env['SUPABASE_SERVICE_ROLE_KEY'] || '');

async function run() {
  const { error } = await supabase.from('settings').upsert({
    key: 'festival_theme_enabled',
    value: 'true',
    description: 'Enable the festival theme on the homepage (Diwali/Festive gradient wrapper). Disables ambient aura when ON.',
    updated_at: new Date().toISOString()
  });
  if (error) console.error(error);
  else console.log('Successfully added festival_theme_enabled to settings!');
}

run();
