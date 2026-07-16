'use client';

import { useState } from 'react';
import { Download, FileText, Calendar, Users, Package, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ReportsEngineView() {
  const [period, setPeriod] = useState('30d');
  const [reportType, setReportType] = useState('sales');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/admin/reports?type=${reportType}&period=${period}`);
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to export report.");
    } finally {
      setIsExporting(false);
    }
  };

  const types = [
    { id: 'sales', label: 'Sales & Orders', icon: DollarSign, desc: 'Complete ledger of all orders placed.' },
    { id: 'customers', label: 'Customer Base', icon: Users, desc: 'CRM export containing demographics and tiers.' },
    { id: 'inventory', label: 'Inventory Stock', icon: Package, desc: 'Current snapshot of all product stock levels.' }
  ];

  const periods = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: 'month', label: 'This Month' },
    { id: 'all', label: 'All Time' }
  ];

  return (
    <div className="glass-card p-6 md:p-8 max-w-3xl">
      <h2 className="text-foreground font-display text-xl font-bold mb-6 flex items-center gap-2">
        <FileText className="w-5 h-5 text-luxe-accent" />
        Advanced Export Engine
      </h2>

      <div className="space-y-8">
        {/* Step 1: Data Type */}
        <div>
          <label className="text-foreground/ text-sm font-semibold uppercase tracking-wider mb-3 block">1. Select Data Module</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {types.map(t => (
              <button
                key={t.id}
                onClick={() => setReportType(t.id)}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all",
                  reportType === t.id 
                    ? "border-luxe-accent bg-luxe-accent/10" 
                    : "border-foreground/ bg-foreground/ hover:border-foreground/"
                )}
              >
                <t.icon className={cn("w-5 h-5 mb-2", reportType === t.id ? "text-luxe-accent" : "text-foreground/")} />
                <p className="text-foreground font-medium text-sm">{t.label}</p>
                <p className="text-foreground/ text-[10px] mt-1 line-clamp-2">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Date Range */}
        <div>
          <label className="text-foreground/ text-sm font-semibold uppercase tracking-wider mb-3 block">2. Select Date Range</label>
          <div className="flex flex-wrap gap-2">
            {periods.map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm transition-all border",
                  period === p.id 
                    ? "border-luxe-accent text-luxe-accent bg-luxe-accent/5" 
                    : "border-foreground/ text-foreground/ hover:text-foreground bg-foreground/"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          {reportType === 'inventory' && (
            <p className="text-amber-400/80 text-xs mt-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Inventory reports are real-time snapshots; date range will be ignored.
            </p>
          )}
        </div>

        {/* Step 3: Export */}
        <div className="pt-6 border-t border-foreground/">
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Generating CSV...' : 'Export to CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
