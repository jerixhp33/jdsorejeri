'use client';

import { useState } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { motion } from 'framer-motion';
import { Plus, Mail, Send, Clock, CheckCircle, XCircle, Users } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { EmailCampaign, UserProfile } from '@/types';

interface AdminBroadcastViewProps {
  campaigns: EmailCampaign[];
  users: Pick<UserProfile, 'id' | 'name' | 'email'>[];
}

const EMAIL_TEMPLATES = [
  {
    name: 'New Arrival',
    subject: 'New Arrivals at JD Store',
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Georgia,serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:#1a1a1a;padding:32px 40px;text-align:center;">
          <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#c8a96e;letter-spacing:3px;">JD STORE</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 16px;font-size:26px;color:#1a1a1a;font-family:Georgia,serif;">New Arrivals</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#555555;line-height:1.7;">
            We just added beautiful new posters and earrings to our collection. Discover premium wall art and handcrafted jewellery, delivered across Tamil Nadu.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr><td style="background:#c8a96e;border-radius:50px;">
              <a href="https://jdstorejeri.vercel.app" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:bold;color:#000000;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:1px;">Shop New Arrivals</a>
            </td></tr>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9f9f9;padding:24px 40px;border-top:1px solid #eeeeee;">
          <p style="margin:0;font-size:12px;color:#999999;line-height:1.6;">
            You are receiving this email because you signed up at JD Store.<br>
            To unsubscribe, reply with "unsubscribe" in the subject line.<br>
            JD Store, Tamil Nadu, India.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
  {
    name: 'Sale Offer',
    subject: 'Limited Time Offer - Up to 30% Off at JD Store',
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Georgia,serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:#1a1a1a;padding:32px 40px;text-align:center;">
          <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#c8a96e;letter-spacing:3px;">JD STORE</p>
        </td></tr>
        <!-- Offer Banner -->
        <tr><td style="background:#c8a96e;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:13px;font-weight:bold;color:#000000;letter-spacing:2px;font-family:Arial,sans-serif;">LIMITED TIME OFFER</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 8px;font-size:32px;color:#1a1a1a;font-family:Georgia,serif;">Up to 30% Off</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#555555;line-height:1.7;">
            Enjoy up to 30% off on selected wall posters and earrings this weekend only. Premium quality, delivered to your door across Tamil Nadu.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr><td style="background:#c8a96e;border-radius:50px;">
              <a href="https://jdstorejeri.vercel.app" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:bold;color:#000000;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:1px;">Grab the Deal</a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;font-size:12px;color:#999999;">Offer valid this weekend only. While stocks last.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9f9f9;padding:24px 40px;border-top:1px solid #eeeeee;">
          <p style="margin:0;font-size:12px;color:#999999;line-height:1.6;">
            You are receiving this email because you signed up at JD Store.<br>
            To unsubscribe, reply with "unsubscribe" in the subject line.<br>
            JD Store, Tamil Nadu, India.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
];

export function AdminBroadcastView({ campaigns: initial, users }: AdminBroadcastViewProps) {
  const [campaigns, setCampaigns] = useState(initial);
  const [showCompose, setShowCompose] = useState(false);
  const [composeType, setComposeType] = useState<'email' | 'push'>('email');
  
  const [form, setForm] = useState({
    title: '',
    subject: '',
    html_body: '',
    target_all: true,
    target_user_ids: [] as string[],
  });
  
  const [pushForm, setPushForm] = useState({
    title: '',
    body: '',
    url: '/dashboard',
    target_all: true,
    target_user_ids: [] as string[],
  });
  
  const [sending, setSending] = useState(false);

  const applyTemplate = (template: (typeof EMAIL_TEMPLATES)[0]) => {
    setForm((f) => ({ ...f, subject: template.subject, html_body: template.html }));
  };

  const sendCampaign = async () => {
    if (!form.title || !form.subject || !form.html_body) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!form.target_all && form.target_user_ids.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    setSending(true);
    try {
      const currentProfile = await fetch('/api/profile').then((r) => r.json());

      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          subject: form.subject,
          html_body: form.html_body,
          status: 'sent',
          target_all: form.target_all,
          target_user_ids: form.target_all ? null : form.target_user_ids,
          sent_count: form.target_all ? users.length : form.target_user_ids.length,
          sent_at: new Date().toISOString(),
          created_by: currentProfile?.id,
        }),
      });
      const campaign = await res.json();

      if (!res.ok || campaign?.error) throw new Error(campaign?.error || 'Failed to send campaign');

      setCampaigns((prev) => [campaign as EmailCampaign, ...prev]);
      setShowCompose(false);
      setForm({ title: '', subject: '', html_body: '', target_all: true, target_user_ids: [] });

      const sentCount = campaign.sent_count ?? 0;
      const failedCount = campaign.failed_count ?? 0;
      if (failedCount > 0 && sentCount === 0) {
        toast.error(`All ${failedCount} email(s) failed. Check SMTP settings in .env.local`);
      } else if (failedCount > 0) {
        toast.warning(`Sent to ${sentCount} users. ${failedCount} failed.`);
      } else {
        toast.success(`Campaign sent to ${sentCount} user${sentCount !== 1 ? 's' : ''}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send campaign');
    } finally {
      setSending(false);
    }
  };

  const sendPush = async () => {
    if (!pushForm.title || !pushForm.body) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!pushForm.target_all && pushForm.target_user_ids.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pushForm),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to send push notification');

      toast.success('Push notification sent successfully!');
      setShowCompose(false);
      setPushForm({ title: '', body: '', url: '/dashboard', target_all: true, target_user_ids: [] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to send push notification');
    } finally {
      setSending(false);
    }
  };

  const toggleUser = (userId: string) => {
    if (composeType === 'email') {
      setForm((f) => ({
        ...f,
        target_user_ids: f.target_user_ids.includes(userId)
          ? f.target_user_ids.filter((id) => id !== userId)
          : [...f.target_user_ids, userId],
      }));
    } else {
      setPushForm((f) => ({
        ...f,
        target_user_ids: f.target_user_ids.includes(userId)
          ? f.target_user_ids.filter((id) => id !== userId)
          : [...f.target_user_ids, userId],
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-white">Broadcast</h1>
        <button
          onClick={() => setShowCompose(true)}
          className="btn-gold flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          New Message
        </button>
      </div>

      {/* Campaigns list */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <Mail className="w-10 h-10 text-white/20 mx-auto mb-4" />
            <p className="text-white/30">No campaigns sent yet</p>
          </div>
        ) : (
          campaigns.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-luxe-accent/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-luxe-accent" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{c.title}</p>
                    <p className="text-white/50 text-sm">{c.subject}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/30">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {c.sent_count} sent
                      </span>
                      {c.opened_count > 0 && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          {c.opened_count} opened
                        </span>
                      )}
                      {c.failed_count > 0 && (
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-red-400" />
                          {c.failed_count} failed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span
                    className={cn(
                      'badge-luxe text-xs',
                      c.status === 'sent' && '!bg-green-500/20 !text-green-400 !border-green-500/30',
                      c.status === 'draft' && '!bg-white/5 !text-white/40',
                      c.status === 'scheduled' && '!bg-blue-500/20 !text-blue-400 !border-blue-500/30'
                    )}
                  >
                    {c.status}
                  </span>
                  <p className="text-white/30 text-xs mt-2">
                    {c.sent_at ? formatDate(c.sent_at) : formatDate(c.created_at)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Compose modal */}
      {showCompose && (
        <div data-lenis-prevent="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCompose(false)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
            <div className="sticky top-0 p-5 border-b border-white/10 bg-luxe-dark/90 backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Compose Message</h2>
                <button
                  onClick={() => setShowCompose(false)}
                  className="text-white/50 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setComposeType('email')}
                  className={cn(
                    "px-4 py-2 text-sm rounded-lg transition-all",
                    composeType === 'email' ? "bg-luxe-accent text-black font-semibold" : "text-white/50 hover:bg-white/5"
                  )}
                >
                  Email Campaign
                </button>
                <button
                  onClick={() => setComposeType('push')}
                  className={cn(
                    "px-4 py-2 text-sm rounded-lg transition-all",
                    composeType === 'push' ? "bg-luxe-accent text-black font-semibold" : "text-white/50 hover:bg-white/5"
                  )}
                >
                  Push Notification
                </button>
              </div>
            </div>
            
            <div className="p-5 space-y-5">
              {composeType === 'email' ? (
                <>
                  {/* Email Templates */}
                  <div>
                    <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Quick Templates</p>
                <div className="flex gap-2 flex-wrap">
                  {EMAIL_TEMPLATES.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => applyTemplate(t)}
                      className="badge-luxe hover:bg-white/20 transition-all cursor-pointer"
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">
                  Campaign Title *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="input-luxe"
                  placeholder="Internal campaign name"
                />
              </div>

              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">
                  Email Subject *
                </label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="input-luxe"
                  placeholder="Email subject line"
                />
              </div>

              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">
                  HTML Body *
                </label>
                <textarea
                  value={form.html_body}
                  onChange={(e) => setForm((f) => ({ ...f, html_body: e.target.value }))}
                  className="input-luxe resize-none font-mono text-xs"
                  rows={8}
                  placeholder="<html>...</html>"
                />
              </div>

                </>
              ) : (
                <>
                  <div>
                    <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">
                      Notification Title *
                    </label>
                    <input
                      value={pushForm.title}
                      onChange={(e) => setPushForm((f) => ({ ...f, title: e.target.value }))}
                      className="input-luxe"
                      placeholder="E.g., Flash Sale!"
                    />
                  </div>

                  <div>
                    <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">
                      Message Body *
                    </label>
                    <textarea
                      value={pushForm.body}
                      onChange={(e) => setPushForm((f) => ({ ...f, body: e.target.value }))}
                      className="input-luxe resize-none text-sm"
                      rows={3}
                      placeholder="Short notification message..."
                    />
                  </div>
                  
                  <div>
                    <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">
                      Redirect URL (Optional)
                    </label>
                    <input
                      value={pushForm.url}
                      onChange={(e) => setPushForm((f) => ({ ...f, url: e.target.value }))}
                      className="input-luxe text-sm font-mono"
                      placeholder="/dashboard/orders"
                    />
                  </div>
                </>
              )}

              {/* Recipients */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-2 block">
                  Recipients
                </label>
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={composeType === 'email' ? form.target_all : pushForm.target_all}
                    onChange={(e) => {
                      if (composeType === 'email') setForm((f) => ({ ...f, target_all: e.target.checked }));
                      else setPushForm((f) => ({ ...f, target_all: e.target.checked }));
                    }}
                    className="w-4 h-4 accent-luxe-accent"
                  />
                  <span className="text-white/70 text-sm">
                    Send to all users ({users.length})
                  </span>
                </label>

                {!(composeType === 'email' ? form.target_all : pushForm.target_all) && (
                  <div className="max-h-48 overflow-y-auto space-y-1 border border-white/10 rounded-xl p-3">
                    {users.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={composeType === 'email' 
                            ? form.target_user_ids.includes(user.id)
                            : pushForm.target_user_ids.includes(user.id)
                          }
                          onChange={() => toggleUser(user.id)}
                          className="w-3.5 h-3.5 accent-luxe-accent"
                        />
                        <span className="text-white/70 text-sm">{user.name}</span>
                        <span className="text-white/30 text-xs">{user.email}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview */}
              {composeType === 'email' && form.html_body && (
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Preview</p>
                  <div
                    className="border border-white/10 rounded-xl overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: form.html_body }}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => setShowCompose(false)}
                  className="btn-luxe-outline flex-1 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={composeType === 'email' ? sendCampaign : sendPush}
                  disabled={sending}
                  className="btn-gold flex-1 flex items-center justify-center gap-2 text-sm"
                >
                  {sending ? (
                    <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sending ? 'Sending...' : (composeType === 'email' ? 'Send Campaign' : 'Send Push')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}