import { Metadata } from 'next';
import { WhatsAppDashboard } from './components/WhatsAppDashboard';

export const metadata: Metadata = {
  title: 'WhatsApp Bot Management | Admin Dashboard',
  description: 'Manage the JD Store WhatsApp bot connection and settings.',
};

export default function WhatsAppPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">WhatsApp Bot</h1>
        <p className="text-white/60 mt-2">
          Connect and manage your store's WhatsApp notification bot.
        </p>
      </div>

      <WhatsAppDashboard />
    </div>
  );
}
