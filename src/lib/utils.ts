import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { WhatsAppOrderPayload } from '@/types';

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency in INR
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date
export function formatDate(
  dateString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date);
}

// Format relative time
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return formatDate(dateString);
}

// Generate slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Generate order number
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LX${timestamp}${random}`;
}

// Calculate delivery charge
export function calculateDeliveryCharge(subtotal: number): number {
  if (subtotal >= 999) return 0; // Free delivery above ₹999
  return 60; // Standard delivery ₹60
}

// Generate WhatsApp message
export function generateWhatsAppMessage(payload: WhatsAppOrderPayload): string {
  const itemsList = payload.items
    .map(
      (item, i) =>
        `*${i + 1}. ${item.name}*${item.size ? `\n   ↳ Size: ${item.size}` : ''}\n   ↳ ${item.quantity} × ${formatCurrency(item.price)} = *${formatCurrency(item.price * item.quantity)}*`
    )
    .join('\n\n');

  const message = `🌟 *NEW ORDER | JD STORE* 🌟
━━━━━━━━━━━━━━━━━━━━━━━━

📦 *ORDER ID:* #${payload.order_number || 'PENDING'}

👤 *CUSTOMER DETAILS*
▪️ *Name:* ${payload.customer_name}
▪️ *Phone:* ${payload.phone}

📍 *DELIVERY ADDRESS*
${payload.address}
*District:* ${payload.district}

━━━━━━━━━━━━━━━━━━━━━━━━
🛍️ *ORDER SUMMARY*

${itemsList}
━━━━━━━━━━━━━━━━━━━━━━━━

🧾 *BILLING DETAILS*
▫️ *Subtotal:* ${formatCurrency(payload.subtotal)}
▫️ *Delivery:* ${payload.delivery_charge === 0 ? 'FREE' : formatCurrency(payload.delivery_charge)}${payload.discount_amount ? `\n▫️ *Discount (${payload.coupon_code}):* -${formatCurrency(payload.discount_amount)}` : ''}

💰 *GRAND TOTAL: ${formatCurrency(payload.total)}*
━━━━━━━━━━━━━━━━━━━━━━━━
${payload.notes ? `\n📝 *SPECIAL INSTRUCTIONS*\n_${payload.notes}_\n━━━━━━━━━━━━━━━━━━━━━━━━\n` : ''}
⚠️ *PAYMENT INSTRUCTIONS*
1️⃣ We accept UPI payments only (No COD).
2️⃣ Send this message to us.
3️⃣ Return to the website, complete the UPI payment using the QR code, and send us the screenshot!

✅ *Please send this message to proceed!*`;

  return message;
}

// Open WhatsApp with pre-filled message
// Uses location.href instead of window.open to avoid popup blockers in PWA standalone mode
export function openWhatsApp(phone: string, message: string): void {
  const cleanPhone = phone.replace(/\D/g, '');
  const whatsappNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const url = `https://wa.me/${whatsappNumber}?text=${message}`;
  window.location.href = url;
}

// Validate Indian pincode
export function validatePincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode);
}

// Validate Indian phone number
export function validatePhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

// Get star rating array for display
export function getStarRating(rating: number): number[] {
  return Array.from({ length: 5 }, (_, i) => (i < Math.floor(rating) ? 1 : i < rating ? 0.5 : 0));
}

// Parse device info from user agent
export function parseDeviceInfo(userAgent: string): { device: string; browser: string } {
  const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
  const isTablet = /ipad|tablet/i.test(userAgent);

  let device = 'Desktop';
  if (isTablet) device = 'Tablet';
  else if (isMobile) device = 'Mobile';

  let browser = 'Unknown';
  if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) browser = 'Chrome';
  else if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
  else if (/edg/i.test(userAgent)) browser = 'Edge';
  else if (/opera/i.test(userAgent)) browser = 'Opera';

  return { device, browser };
}

// Generate SKU
export function generateSKU(productName: string, variant?: string): string {
  const base = productName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4);
  const variantPart = variant
    ? variant
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 3)
    : '';
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${base}${variantPart}${random}`;
}

// Deep clone object
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Check if image URL is valid
export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

// Convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Tamil Nadu districts
export const TAMIL_NADU_DISTRICTS = [
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kancheepuram',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Nilgiris',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivaganga',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupattur',
  'Tiruppur',
  'Tiruvallur',
  'Tiruvannamalai',
  'Tiruvarur',
  'Vellore',
  'Viluppuram',
  'Virudhunagar',
] as const;

export type TamilNaduDistrict = (typeof TAMIL_NADU_DISTRICTS)[number];

// Cities by district (common cities for each district)
export const CITIES_BY_DISTRICT: Record<string, string[]> = {
  Chennai: ['Chennai', 'Ambattur', 'Avadi', 'Sholinganallur', 'Perambur', 'Tambaram'],
  Coimbatore: ['Coimbatore', 'Tiruppur', 'Pollachi', 'Mettupalayam'],
  Madurai: ['Madurai', 'Melur', 'Vadipatti', 'Peraiyur'],
  Salem: ['Salem', 'Omalur', 'Mettur', 'Sankagiri'],
  Tiruchirappalli: ['Tiruchirappalli', 'Srirangam', 'Thuraiyur', 'Perambalur'],
  // Add more as needed — fallback to a generic input
};