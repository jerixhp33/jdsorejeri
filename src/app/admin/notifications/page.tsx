import { AdminNotificationPanel } from '@/components/admin/AdminNotificationPanel';

export const metadata = {
  title: 'Admin Notifications Inbox | JD Store'
};

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <AdminNotificationPanel />
    </div>
  );
}
