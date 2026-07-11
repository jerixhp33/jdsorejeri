// ============================================================
// DATABASE TYPES - Match Supabase schema exactly
// ============================================================

export type UserRole = 'user' | 'admin' | 'super_admin';
export type ProductType = 'poster' | 'earring' | 'hairband' | 'bracelet' | 'keychain' | 'hair_clip' | 'other';
export type OrderStatus = 'pending' | 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' | 'refund_requested' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'partially_refunded' | 'refunded';
export type FulfillmentStatus = 'unfulfilled' | 'processing' | 'packed' | 'shipped' | 'delivered';
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
  notification_preferences?: Record<string, boolean>;
  created_at: string;
  updated_at: string;
  last_active?: string;
}

export interface Customer {
  id: string;
  user_id: string;
  customer_number: string;
  loyalty_points: number;
  lifetime_points: number;
  membership_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  admin_notes?: string;
  status: 'active' | 'disabled';
  created_at: string;
  updated_at: string;
  
  // Joined relation
  user_profile?: UserProfile;
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
  storage_path?: string;
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
  attributes?: Record<string, any>;

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
  average_rating?: number;
  review_count?: number;

  // Pricing
  original_price?: number;
  cost_price?: number;
  discount_percent?: number;
  tax_percent?: number;

  // Inventory & Status
  status?: string; // active, draft, out_of_stock, archived
  low_stock_alert?: number;
  continue_selling_oos?: boolean;

  // Shipping
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  courier_category?: string;
  is_free_shipping?: boolean;

  // SEO & Marketing
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  brand?: string;
  short_description?: string;
  is_new_arrival?: boolean;
  is_limited_edition?: boolean;

  // Relations
  sizes?: PosterSize[];

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
  invoice_number?: string;
  user_id: string;
  user?: UserProfile;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  items?: OrderItem[];
  delivery_address_id?: string;
  delivery_address?: DeliveryAddress;
  currency: string;
  subtotal: number;
  tax: number;
  delivery_charge: number;
  shipping_cost: number;
  discount_amount: number;
  coupon_code?: string;
  coupon_id?: string;
  grand_total: number;
  total: number; // legacy fallback
  delivery_notes?: string;
  delivery_instructions?: string;
  whatsapp_sent: boolean;
  whatsapp_message?: string;
  admin_notes?: string;
  admin_internal_notes?: string;
  internal_tags?: string[];
  cancelled_reason?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
  
  // Relations mapped from the new architecture
  events?: OrderEvent[];
  payments?: Payment[];
  shipments?: Shipment[];
  returns?: ReturnRequest[];
  refunds?: Refund[];
}

export interface OrderEvent {
  id: string;
  order_id: string;
  event_type: string;
  title: string;
  description?: string;
  actor_type: 'system' | 'admin' | 'customer' | 'courier';
  performed_by?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  provider: string;
  transaction_id?: string;
  payment_method?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  provider: string;
  provider_reference?: string;
  tracking_number?: string;
  tracking_url?: string;
  status: 'pending' | 'label_generated' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed_attempt' | 'returned_to_sender';
  shipping_cost?: number;
  package_weight?: number;
  estimated_delivery?: string;
  notes?: string;
  label_url?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface ReturnRequest {
  id: string;
  order_id: string;
  status: 'requested' | 'approved' | 'rejected' | 'received' | 'inspected';
  reason: string;
  photos?: string[];
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  approved_by?: string;
}

export interface Refund {
  id: string;
  order_id: string;
  return_id?: string;
  amount: number;
  reason?: string;
  status: 'requested' | 'approved' | 'rejected' | 'refunded' | 'failed';
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface InventoryTransaction {
  id: string;
  product_id: string;
  variant_id?: string;
  type: 'reserve' | 'release' | 'sale' | 'return' | 'manual_adjustment';
  quantity: number;
  reason?: string;
  order_id?: string;
  created_at: string;
  created_by?: string;
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
  // Executive Dashboard Additions
  today_profit: number;
  pending_orders: number;
  active_customers: number;
  inventory_alerts: number;
  returns_count: number;
  refunds_count: number;
}

export interface DailySales {
  date: string;
  revenue: number;
  orders: number;
}

export interface Waitlist {
  id: string;
  user_id: string;
  product_id: string;
  poster_size_id?: string;
  created_at: string;
  product?: Product;
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
  order_number?: string;
  customer_name: string;
  phone: string;
  address: string;
  district: string;
  items: Array<{
    name: string;
    size?: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  subtotal: number;
  delivery_charge: number;
  discount_amount?: number;
  coupon_code?: string;
  total: number;
  notes?: string;
}
