/**
 * WhatsApp AI Service
 *
 * Sends WhatsApp messages via the WhatsApp AI Bot API.
 * Used for order confirmations, status updates, and shipping notifications.
 */

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'http://localhost:8000';
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || '';
const WHATSAPP_ACCOUNT_ID = process.env.WHATSAPP_ACCOUNT_ID || '';

/**
 * Send a WhatsApp message to a phone number.
 *
 * @param phone - Phone number with country code (e.g. "919444709686")
 * @param message - The message text to send
 * @returns The API response data
 * @throws If the API call fails
 */
export async function sendWhatsApp(phone: string, message: string) {
  if (!WHATSAPP_API_KEY || !WHATSAPP_ACCOUNT_ID) {
    console.warn('[whatsapp] Missing WHATSAPP_API_KEY or WHATSAPP_ACCOUNT_ID env vars, skipping');
    return null;
  }

  // Normalize: strip +, spaces, dashes — keep only digits
  const normalized = phone.replace(/[+\s\-()]/g, '');

  if (!normalized || normalized.length < 10) {
    console.warn(`[whatsapp] Invalid phone number: ${phone}`);
    return null;
  }

  const res = await fetch(`${WHATSAPP_API_URL}/api/v1/messages/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account_id: WHATSAPP_ACCOUNT_ID,
      phone: normalized,
      message,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('[whatsapp] Send failed:', err);
    throw new Error(`WhatsApp send failed: ${(err as any).detail || res.statusText}`);
  }

  const data = await res.json();
  console.log(`[whatsapp] Message sent to ${normalized}`);
  return data;
}
