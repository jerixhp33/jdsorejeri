'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface Setting {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
}

interface AdminSettingsViewProps {
  settings: Setting[];
}

export function AdminSettingsView({ settings: initial }: AdminSettingsViewProps) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState<string | null>(null);

  const getValue = (setting: Setting): string => {
    const v = setting.value;
    if (typeof v === 'string') return v.replace(/^"|"$/g, '');
    if (typeof v === 'boolean') return v.toString();
    if (typeof v === 'number') return v.toString();
    return JSON.stringify(v);
  };

  const updateSetting = async (key: string, rawValue: string) => {
    setSaving(key);
    let value: unknown = rawValue;

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(rawValue);
      value = parsed;
    } catch {
      // Keep as string — wrap in quotes for JSON
      value = rawValue;
    }

    const res = await fetch('/api/admin/settings', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }) });
    const error = res.ok ? null : (await res.json());

    if (!error) {
      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value } : s))
      );
      toast.success('Setting saved');
    } else {
      toast.error('Failed to save setting');
    }
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-white">Settings</h1>

      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-4 h-4 text-luxe-accent" />
          <h2 className="text-white font-semibold">Store Configuration</h2>
        </div>

        <div className="space-y-5">
          {settings.map((setting, i) => (
            <motion.div
              key={setting.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center py-4 border-b border-white/5 last:border-0"
            >
              <div>
                <p className="text-white text-sm font-medium font-mono">{setting.key}</p>
                {setting.description && (
                  <p className="text-white/40 text-xs mt-0.5">{setting.description}</p>
                )}
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  defaultValue={getValue(setting)}
                  onBlur={(e) => {
                    if (e.target.value !== getValue(setting)) {
                      updateSetting(setting.key, e.target.value);
                    }
                  }}
                  className="input-luxe flex-1 text-sm font-mono"
                />
                <button
                  onClick={(e) => {
                    const input = (e.currentTarget.previousSibling as HTMLInputElement);
                    updateSetting(setting.key, input.value);
                  }}
                  disabled={saving === setting.key}
                  className="p-2.5 rounded-xl bg-luxe-accent/20 text-luxe-accent hover:bg-luxe-accent/30 transition-all disabled:opacity-50"
                  title="Save"
                >
                  {saving === setting.key ? (
                    <div className="w-4 h-4 rounded-full border-2 border-luxe-accent/30 border-t-luxe-accent animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="glass-card p-6 border-red-500/20">
        <h2 className="text-red-400 font-semibold mb-4">Danger Zone</h2>
        <p className="text-white/50 text-sm mb-4">
          These actions are irreversible. Please be absolutely certain before proceeding.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => toast.error('This action is disabled for safety')}
            className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-all"
          >
            Clear All Analytics Data
          </button>
          <button
            onClick={() => toast.error('This action is disabled for safety')}
            className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-all"
          >
            Flush Activity Logs
          </button>
        </div>
      </div>
    </div>
  );
}
