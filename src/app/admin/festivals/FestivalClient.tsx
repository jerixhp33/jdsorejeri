'use client';

import React, { useState } from 'react';
import { Festival } from '@/types';
import { upsertFestival, deleteFestival } from './actions';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Trash2, Edit2, Plus, Calendar, Power } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export function FestivalClient({ initialFestivals }: { initialFestivals: Festival[] }) {
  const [festivals, setFestivals] = useState(initialFestivals);
  const [isEditing, setIsEditing] = useState<Partial<Festival> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const startAtStr = formData.get('start_at') as string;
    const endAtStr = formData.get('end_at') as string;
    
    const payload = {
      ...isEditing,
      name: formData.get('name'),
      theme_type: formData.get('theme_type'),
      start_at: new Date(startAtStr).toISOString(),
      end_at: new Date(endAtStr).toISOString(),
      is_active: formData.get('is_active') === 'on',
    };

    const res = await upsertFestival(payload);
    
    if (res.success) {
      toast.success('Festival saved successfully');
      setIsEditing(null);
      // Ideally we refresh data via router.refresh, but for simple optimistic UI:
      window.location.reload(); 
    } else {
      toast.error(res.error || 'Failed to save festival');
    }
    
    setLoading(false);
  };

  const handleToggle = async (festival: Festival, checked: boolean) => {
    const res = await upsertFestival({ ...festival, is_active: checked });
    if (res.success) {
      toast.success(`Festival ${checked ? 'activated' : 'deactivated'}`);
      setFestivals(festivals.map(f => f.id === festival.id ? { ...f, is_active: checked } : f));
    } else {
      toast.error(res.error || 'Failed to toggle festival');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this festival?')) return;
    
    const res = await deleteFestival(id);
    if (res.success) {
      toast.success('Festival deleted');
      setFestivals(festivals.filter(f => f.id !== id));
    } else {
      toast.error('Failed to delete festival');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">All Festivals</h2>
        <button
          onClick={() => setIsEditing({ is_active: true })}
          className="flex items-center gap-2 bg-luxe-accent text-black px-4 py-2 rounded-lg font-medium hover:bg-luxe-accent/90 transition"
        >
          <Plus size={18} />
          Add Festival
        </button>
      </div>

      <div className="bg-[#111] rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#1a1a1a] border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Theme</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Dates</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {festivals.map(festival => {
              const now = new Date();
              const start = new Date(festival.start_at);
              const end = new Date(festival.end_at);
              const isCurrentlyRunning = festival.is_active && now >= start && now < end;
              
              return (
                <tr key={festival.id} className="hover:bg-white/5 transition">
                  <td className="p-4">
                    <p className="text-white font-medium">{festival.name}</p>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-white/10 text-white/80 text-xs capitalize">
                      {festival.theme_type}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={festival.is_active}
                        onCheckedChange={(checked) => handleToggle(festival, checked)}
                      />
                      <span className={`text-xs ${isCurrentlyRunning ? 'text-green-400' : 'text-white/40'}`}>
                        {isCurrentlyRunning ? 'Currently Active' : (festival.is_active ? 'Scheduled' : 'Inactive')}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Calendar size={14} />
                      {format(start, 'MMM d, yyyy')} - {format(end, 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => setIsEditing(festival)} className="p-2 text-white/50 hover:text-white transition">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(festival.id)} className="p-2 text-white/50 hover:text-red-400 transition ml-2">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {festivals.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-white/40">
                  No festivals scheduled. Click "Add Festival" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">
              {isEditing.id ? 'Edit Festival' : 'New Festival'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase">Name</label>
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={isEditing.name}
                  required 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-luxe-accent transition"
                  placeholder="e.g. Diwali Dhamaka 2026"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase">Theme Type</label>
                <select 
                  name="theme_type"
                  defaultValue={isEditing.theme_type || 'diwali'}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-luxe-accent transition"
                >
                  <option value="diwali">Diwali (Orange/Gold Particles)</option>
                  <option value="christmas">Christmas (Icy/Snow Particles)</option>
                  <option value="pongal">Pongal (Terracotta/Green)</option>
                  <option value="valentines">Valentine's Day (Crimson/Pink)</option>
                  <option value="halloween">Halloween (Purple/Orange)</option>
                  <option value="newyear">New Year (Gold Fireworks)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase">Start Date & Time</label>
                  <input 
                    type="datetime-local" 
                    name="start_at"
                    defaultValue={isEditing.start_at ? new Date(new Date(isEditing.start_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-luxe-accent transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase">End Date & Time</label>
                  <input 
                    type="datetime-local" 
                    name="end_at"
                    defaultValue={isEditing.end_at ? new Date(new Date(isEditing.end_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-luxe-accent transition text-sm"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <Switch 
                  name="is_active" 
                  defaultChecked={isEditing.is_active} 
                />
                <label className="text-sm text-white/80">Allow Activation</label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(null)}
                  className="px-5 py-2.5 rounded-xl font-medium text-white/60 hover:text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl font-medium bg-luxe-accent text-black hover:bg-luxe-accent/90 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Festival'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
