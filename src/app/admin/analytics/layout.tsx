'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, Package, Users, Truck, DollarSign, FileText, Sparkles, X, Loader2
} from 'lucide-react';

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);

  const handleGenerateInsights = async () => {
    setIsAiModalOpen(true);
    if (aiInsights) return; // Don't regenerate if already open
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/generate-insights', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setAiInsights(data.result);
      } else {
        setAiInsights("Failed to generate insights. Please try again.");
      }
    } catch (err) {
      setAiInsights("Network error generating insights.");
    } finally {
      setIsGenerating(false);
    }
  };

  const tabs = [
    { name: 'Sales', href: '/admin/analytics/sales', icon: TrendingUp },
    { name: 'Inventory', href: '/admin/analytics/inventory', icon: Package },
    { name: 'Customers', href: '/admin/analytics/customers', icon: Users },
    { name: 'Shipping', href: '/admin/analytics/shipping', icon: Truck },
    { name: 'Finance', href: '/admin/analytics/finance', icon: DollarSign },
    { name: 'Reports', href: '/admin/analytics/reports', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Business Analytics</h1>
          <p className="text-white/50 text-sm mt-1">Deep insights into your store's performance</p>
        </div>
        
        <button onClick={handleGenerateInsights} className="btn-primary flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          Generate AI Insights
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-white/10 no-scrollbar">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                isActive
                  ? "border-luxe-accent text-luxe-accent bg-luxe-accent/5 rounded-t-lg"
                  : "border-transparent text-white/50 hover:text-white hover:bg-white/5 rounded-t-lg"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="pt-2">
        {children}
      </div>

      {/* AI Business Assistant Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-luxe-darker border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-luxe-accent/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-luxe-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">AI Business Assistant</h2>
                  <p className="text-white/40 text-xs">Powered by Groq 8B</p>
                </div>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/50 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-luxe-accent" />
                  <p className="animate-pulse text-sm">Analyzing 30 days of business data...</p>
                </div>
              ) : (
                <div className="prose prose-invert prose-p:text-white/70 prose-headings:text-white prose-li:text-white/70 prose-a:text-luxe-accent max-w-none prose-sm sm:prose-base">
                  {aiInsights?.split('\n').map((line, i) => {
                    if (line.startsWith('### ')) return <h3 key={i} className="text-luxe-accent mt-6 mb-3">{line.replace('### ', '')}</h3>;
                    if (line.startsWith('* ')) return <li key={i} className="ml-4 mb-1">{line.replace('* ', '')}</li>;
                    if (line.trim() === '') return <br key={i} />;
                    return <p key={i} className="mb-2">{line}</p>;
                  })}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-white/10 bg-black/20 text-center">
               <p className="text-[10px] text-white/30 uppercase tracking-widest">AI generated insights may occasionally contain inaccuracies.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
