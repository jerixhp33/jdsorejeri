import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { PartyPopper } from 'lucide-react';
import { FestivalClient } from './FestivalClient';

export const metadata = {
  title: 'Festivals | Admin',
};

export default async function FestivalsPage() {
  const supabase = await createClient();
  
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
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-luxe-accent/10 rounded-xl">
            <PartyPopper className="text-luxe-accent w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Festivals & Themes</h1>
            <p className="text-white/40 text-sm">Manage festive overlays, atmospheric lighting, and particle effects.</p>
          </div>
        </div>
        
        <FestivalClient initialFestivals={festivals || []} />
      </div>
    </div>
  );
}
