'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, RefreshCw, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react';

// Use an environment variable for the backend URL, fallback to localhost for development
const WHATSAPP_API_URL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL || 'http://localhost:8000';

export function WhatsAppDashboard() {
  const [status, setStatus] = useState<string>('checking');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${WHATSAPP_API_URL}/api/whatsapp/status`);
      if (!res.ok) throw new Error('Failed to fetch status');
      const data = await res.json();
      setStatus(data.status);
      setError(null);
      setLastUpdated(new Date());

      if (data.status === 'awaiting_scan') {
        fetchQr();
      }
    } catch (err: any) {
      setError(err.message || 'Could not connect to WhatsApp service');
      setStatus('disconnected');
    }
  };

  const fetchQr = async () => {
    try {
      const res = await fetch(`${WHATSAPP_API_URL}/api/whatsapp/qr`);
      if (!res.ok) throw new Error('Failed to fetch QR');
      const data = await res.json();
      if (data.qr) {
        setQrCode(data.qr);
      }
    } catch (err: any) {
      console.error('Error fetching QR:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 5 seconds
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Status Card */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-luxe-accent" />
            Connection Status
          </h2>
          <button 
            onClick={fetchStatus}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-8">
          {status === 'checking' && (
            <div className="flex flex-col items-center gap-4 text-white/60">
              <Loader2 className="w-8 h-8 animate-spin text-luxe-accent" />
              <p>Checking connection to bot server...</p>
            </div>
          )}

          {status === 'connected' && (
            <div className="flex flex-col items-center gap-4 text-green-400">
              <div className="w-16 h-16 bg-green-400/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">Connected</p>
                <p className="text-sm mt-1">The bot is active and handling messages.</p>
              </div>
            </div>
          )}

          {status === 'disconnected' && (
            <div className="flex flex-col items-center gap-4 text-white/60">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">Disconnected</p>
                <p className="text-sm mt-1 text-red-400">{error || 'Bot service is offline.'}</p>
                <p className="text-xs mt-4">Make sure the Python backend is running.</p>
              </div>
            </div>
          )}

          {status === 'awaiting_scan' && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-center mb-4">
                <p className="text-xl font-bold text-white">Scan to Connect</p>
                <p className="text-sm mt-1 text-white/60">Open WhatsApp on your phone and link a device.</p>
              </div>
              
              {qrCode ? (
                <div className="p-4 bg-white rounded-xl">
                  <QRCodeSVG value={qrCode} size={200} />
                </div>
              ) : (
                <div className="w-[200px] h-[200px] bg-white/5 rounded-xl flex flex-col items-center justify-center text-white/40">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-xs">Loading QR...</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-auto pt-4 border-t border-white/5 text-xs text-white/40 text-center">
          Last checked: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">How it works</h2>
        <ul className="space-y-4 text-sm text-white/70">
          <li className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-luxe-accent/20 text-luxe-accent flex items-center justify-center shrink-0">1</div>
            <p>Ensure the Python bot server (Neonize) is deployed and running on Railway.</p>
          </li>
          <li className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-luxe-accent/20 text-luxe-accent flex items-center justify-center shrink-0">2</div>
            <p>If disconnected, a QR code will appear here. Scan it using the "Linked Devices" feature in your WhatsApp mobile app.</p>
          </li>
          <li className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-luxe-accent/20 text-luxe-accent flex items-center justify-center shrink-0">3</div>
            <p>Once connected, JD Store will automatically route order notifications, abandoned cart reminders, and invoices through WhatsApp.</p>
          </li>
          <li className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-luxe-accent/20 text-luxe-accent flex items-center justify-center shrink-0">4</div>
            <p>Incoming messages from customers will be automatically handled by the Gemini AI.</p>
          </li>
        </ul>
        
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-xs text-white/50 mb-2 uppercase font-semibold tracking-wider">Configuration</p>
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/70">API URL</span>
            <code className="text-luxe-accent bg-luxe-accent/10 px-2 py-1 rounded">{WHATSAPP_API_URL}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
