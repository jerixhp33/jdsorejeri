'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, LogIn } from 'lucide-react';
import { formatRelativeTime, cn } from '@/lib/utils';

interface LogEntry {
  id: string;
  created_at?: string;
  login_time?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  ip_address?: string;
  device?: string;
  browser?: string;
  user?: { name: string; email: string } | null;
  admin?: { name: string; email: string } | null;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
}

interface AdminLogsViewProps {
  activityLogs: LogEntry[];
  auditLogs: LogEntry[];
  loginLogs: LogEntry[];
}

type Tab = 'activity' | 'audit' | 'login';

export function AdminLogsView({ activityLogs, auditLogs, loginLogs }: AdminLogsViewProps) {
  const [tab, setTab] = useState<Tab>('activity');

  const tabs: { key: Tab; label: string; icon: typeof Activity; count: number }[] = [
    { key: 'activity', label: 'Activity', icon: Activity, count: activityLogs.length },
    { key: 'audit', label: 'Audit', icon: Shield, count: auditLogs.length },
    { key: 'login', label: 'Login', icon: LogIn, count: loginLogs.length },
  ];

  const renderActivity = () => (
    <div className="space-y-2">
      {activityLogs.map((log) => (
        <div key={log.id} className="glass-card p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-foreground text-sm font-medium">{log.action?.replace(/_/g, ' ')}</p>
              <span className="text-foreground/ text-xs flex-shrink-0">
                {formatRelativeTime(log.created_at!)}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-foreground/">
              {log.user && <span>{log.user.name}</span>}
              {log.entity_type && <span>→ {log.entity_type}</span>}
              {log.ip_address && <span className="font-mono">{log.ip_address}</span>}
            </div>
          </div>
        </div>
      ))}
      {activityLogs.length === 0 && (
        <p className="text-center text-foreground/ py-12">No activity logs</p>
      )}
    </div>
  );

  const renderAudit = () => (
    <div className="space-y-2">
      {auditLogs.map((log) => (
        <div key={log.id} className="glass-card p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-luxe-accent" />
              <p className="text-foreground text-sm font-medium">{log.action?.replace(/_/g, ' ')}</p>
            </div>
            <span className="text-foreground/ text-xs">{formatRelativeTime(log.created_at!)}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-foreground/ mb-2">
            {log.admin && <span>By: {log.admin.name}</span>}
            {log.entity_type && <span>Entity: {log.entity_type}</span>}
          </div>
          {(log.old_values || log.new_values) && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {log.old_values && (
                <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                  <p className="text-red-400 text-[10px] uppercase mb-1">Before</p>
                  <pre className="text-foreground/ text-[10px] overflow-hidden">
                    {JSON.stringify(log.old_values, null, 2).slice(0, 100)}
                  </pre>
                </div>
              )}
              {log.new_values && (
                <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                  <p className="text-green-400 text-[10px] uppercase mb-1">After</p>
                  <pre className="text-foreground/ text-[10px] overflow-hidden">
                    {JSON.stringify(log.new_values, null, 2).slice(0, 100)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      {auditLogs.length === 0 && (
        <p className="text-center text-foreground/ py-12">No audit logs</p>
      )}
    </div>
  );

  const renderLogin = () => (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
        <thead>
          <tr className="border-b border-foreground/">
            {['User', 'Device', 'Browser', 'IP Address', 'Time'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-foreground/ text-xs uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loginLogs.map((log) => (
            <tr key={log.id} className="border-b border-foreground/ hover:bg-white/[0.02]">
              <td className="px-4 py-3 text-foreground text-sm">{log.user?.name || '—'}</td>
              <td className="px-4 py-3 text-foreground/ text-sm">{log.device || '—'}</td>
              <td className="px-4 py-3 text-foreground/ text-sm">{log.browser || '—'}</td>
              <td className="px-4 py-3 text-foreground/ text-xs font-mono">{log.ip_address || '—'}</td>
              <td className="px-4 py-3 text-foreground/ text-xs">
                {formatRelativeTime(log.login_time!)}
              </td>
            </tr>
          ))}
          {loginLogs.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-foreground/ text-sm">
                No login logs
              </td>
            </tr>
          )}
        </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-foreground">System Logs</h1>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
              tab === t.key
                ? 'bg-luxe-accent text-black'
                : 'glass-card text-foreground/ hover:text-foreground'
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className={cn('text-xs rounded-full px-1.5', tab === t.key ? 'bg-black/20 text-black' : 'bg-foreground/ text-foreground/')}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div key={tab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
        {tab === 'activity' && renderActivity()}
        {tab === 'audit' && renderAudit()}
        {tab === 'login' && renderLogin()}
      </motion.div>
    </div>
  );
}
