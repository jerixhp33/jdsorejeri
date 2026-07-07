// ============================================================
// DATABASE TYPES - Match Supabase schema exactly
// ============================================================

export type UserRole = 'user' | 'admin' | 'super_admin';
export type ProductType = 'poster' | 'earring';
export type OrderStatus = 'pending' | 'confirmed' | 'packed' | 'ready' | 'delivered' | 'cancelled';
export type PosterOrientation = 'portrait' | 'landscape' | 'square';
export type PosterFinish = 'matte' | 'glossy' | 'satin' | 'metallic';
export type NotificationType = 'order' | 'product' | 'offer' | 'system' | 'admin';
export type EmailCampaignStatus = 'draft' | 'sent' | 'scheduled';
export type BannerPosition = 'hero' | 'top' | 'middle' | 'bottom' | 'sidebar';

// ============================================================
// USER TYPES
// ============================================================

export interface UserProfile {
  id: string;
  uid: string;
  name: string;
  email: string;
  profile_picture?: string;
  role: UserRole;
  phone?: string;
  created_at: string;
  updated_at: string;
  last_active?: string;
}

export interface LoginLog {
  id: string;
  user_id: string;
  login_time: string;
  device?: string;
  browser?: string;
  ip_address?: string;
  user_agent?: string;
}

// ============================================================
// PRODUCT TYPES
// ============================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  product_type: ProductType;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface PosterSize {
  id: string;
  product_id: string;
  label: string; // e.g. "A4", "A3", "12×18"
  width_cm: number;
  height_cm: number;
  price: number;
  stock: number;
  sku: string;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text?: string;
  display_order: number;
  is_primary: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  product_type: ProductType;
  category_id: string;
  category?: Category;
  tags: string[];
  is_active: boolean;
  is_featured: boolean;
  is_trending: boolean;
  is_best_seller: boolean;

  // Shared attributes
  material?: string;

  // Poster-specific
  finish?: PosterFinish;
  orientation?: PosterOrientation;
  custom_size_available?: boolean;

  // Earring-specific
  color?: string;
  weight_grams?: number;
  price?: number; // for earrings
  stock?: number; // for earrings
  sku?: string; // for earrings

  images?: ProductImage[];
  sizes?: PosterSize[]; // for posters
  average_rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// CART TYPES
// ============================================================

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  product?: Product;
  poster_size_id?: string;
  poster_size?: PosterSize;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface Cart {
  id: string;
  user_id: string;
  items?: CartItem[];
  created_at: string;
  updated_at: string;
}

// ============================================================
// WISHLIST TYPES
// ============================================================

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product?: Product;
  created_at: string;
}

// ============================================================
// ORDER TYPES
// ============================================================

export interface DeliveryAddress {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  alternate_phone?: string;
  house_no: string;
  street: string;
  area: string;
  city: string;
  district: string;
  pincode: string;
  landmark?: string;
  is_default: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: Product;
  poster_size_id?: string;
  poster_size?: PosterSize;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  user?: UserProfile;
  status: OrderStatus;
  items?: OrderItem[];
  delivery_address_id?: string;
  delivery_address?: DeliveryAddress;
  subtotal: number;
  delivery_charge: number;
  total: number;
  delivery_notes?: string;
  delivery_instructions?: string;
  whatsapp_sent: boolean;
  whatsapp_message?: string;
  admin_notes?: string;
  cancelled_reason?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// REVIEW TYPES
// ============================================================

export interface Review {
  id: string;
  user_id: string;
  user?: UserProfile;
  product_id: string;
  rating: number; // 1-5
  title?: string;
  body?: string;
  is_verified: boolean;
  is_approved: boolean;
  created_at: string;
}

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export interface Notification {
  id: string;
  user_id?: string; // null = broadcast
  title: string;
  body: string;
  type: NotificationType;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

// ============================================================
// BANNER TYPES
// ============================================================

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  mobile_image_url?: string;
  cta_text?: string;
  cta_url?: string;
  position: BannerPosition;
  is_active: boolean;
  display_order: number;
  starts_at?: string;
  ends_at?: string;
  created_at: string;
}

// ============================================================
// COLLECTION TYPES
// ============================================================

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cover_image_url?: string;
  is_active: boolean;
  display_order: number;
  products?: Product[];
  created_at: string;
}

// ============================================================
// TESTIMONIAL TYPES
// ============================================================

export interface Testimonial {
  id: string;
  author_name: string;
  author_image?: string;
  author_location?: string;
  body: string;
  rating: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

// ============================================================
// FAQ TYPES
// ============================================================

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// ============================================================
// EMAIL CAMPAIGN TYPES
// ============================================================

export interface EmailCampaign {
  id: string;
  title: string;
  subject: string;
  html_body: string;
  text_body?: string;
  status: EmailCampaignStatus;
  target_all: boolean;
  target_user_ids?: string[];
  sent_count: number;
  failed_count: number;
  opened_count: number;
  scheduled_at?: string;
  sent_at?: string;
  created_by: string;
  created_at: string;
}

// ============================================================
// ANALYTICS TYPES
// ============================================================

export interface AnalyticsEvent {
  id: string;
  user_id?: string;
  session_id?: string;
  event_type: string;
  event_data?: Record<string, unknown>;
  page?: string;
  device?: string;
  browser?: string;
  ip_address?: string;
  created_at: string;
}

export interface AnalyticsSummary {
  total_users: number;
  today_users: number;
  total_orders: number;
  today_orders: number;
  total_revenue: number;
  today_revenue: number;
  total_products: number;
  active_carts: number;
  conversion_rate: number;
  average_order_value: number;
}

export interface DailySales {
  date: string;
  revenue: number;
  orders: number;
}

// ============================================================
// ACTIVITY / AUDIT LOG TYPES
// ============================================================

export interface ActivityLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  created_at: string;
}

// ============================================================
// FORM TYPES
// ============================================================

export interface CheckoutFormData {
  full_name: string;
  phone: string;
  alternate_phone?: string;
  email: string;
  house_no: string;
  street: string;
  area: string;
  city: string;
  district: string;
  pincode: string;
  landmark?: string;
  delivery_notes?: string;
  delivery_instructions?: string;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ============================================================
// FILTER / SORT TYPES
// ============================================================

export interface ProductFilters {
  category?: string;
  product_type?: ProductType;
  min_price?: number;
  max_price?: number;
  material?: string;
  color?: string;
  size?: string;
  sort?: 'newest' | 'popular' | 'price_asc' | 'price_desc' | 'rating';
  search?: string;
  in_stock?: boolean;
  is_featured?: boolean;
  is_trending?: boolean;
}

// ============================================================
// WHATSAPP TYPES
// ============================================================

export interface WhatsAppOrderPayload {
  customer_name: string;
  phone: string;
  address: string;
  district: string;
  items: Array<{
    name: string;
    size?: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  delivery_charge: number;
  total: number;
  notes?: string;
}
