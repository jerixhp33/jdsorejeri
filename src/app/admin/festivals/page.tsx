import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { PartyPopper } from 'lucide-react';
import { FestivalClient } from './FestivalClient';

export const metadata = {
  title: 'Festivals | Admin',
};

export default async function FestivalsPage() {
  const supabase = createClient();
  
  const { data: festivals, error } = await supabase
    .from('festivals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching festivals:', error);
  }

  return (
    <div className="flex-1 overflow-y-auto bg-black min-h-screen">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <AdminHeader 
          title="Festivals & Themes" 
          description="Manage festive overlays, atmospheric lighting, and particle effects."
          icon={PartyPopper}
        />
        
        <FestivalClient initialFestivals={festivals || []} />
      </div>
    </div>
  );
}
