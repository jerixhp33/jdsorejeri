import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(url, key);

async function init() {
  console.log("Checking buckets...");
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error("List buckets error:", listErr);
    return;
  }
  
  console.log("Buckets:", buckets?.map(b => b.name).join(', '));
  
  if (!buckets?.some(b => b.name === 'custom_user_uploads')) {
    console.log("Creating custom_user_uploads...");
    const { data, error } = await supabase.storage.createBucket('custom_user_uploads', {
      public: false,
      fileSizeLimit: 25 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    });
    
    if (error) {
      console.error("Failed to create bucket:", error);
    } else {
      console.log("Bucket created successfully:", data);
    }
  } else {
    console.log("Bucket already exists.");
  }
}

init();
