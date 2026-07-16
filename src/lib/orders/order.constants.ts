// ============================================================
// JD Store — Unified Order Domain Constants
// Single source of truth for the entire Orders module
// ============================================================

import type { OrderStatus, PaymentStatus, FulfillmentStatus } from '@/types';

// ============================================================
// ORDER STATUS
// ============================================================

export interface StatusConfig {
  label: string;
  color: string;       // Tailwind text color class
  bgColor: string;     // Tailwind bg color class
  borderColor: string; // Tailwind border color class
  icon: string;        // Lucide icon name
  sortOrder: number;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pending:          { label: 'Pending',           color: 'text-amber-400',   bgColor: 'bg-amber-400/10',   borderColor: 'border-amber-400/30',   icon: 'Clock',           sortOrder: 0 },
  confirmed:        { label: 'Confirmed',         color: 'text-blue-400',    bgColor: 'bg-blue-400/10',    borderColor: 'border-blue-400/30',    icon: 'CheckCircle',     sortOrder: 1 },
  processing:       { label: 'Processing',        color: 'text-indigo-400',  bgColor: 'bg-indigo-400/10',  borderColor: 'border-indigo-400/30',  icon: 'Loader',          sortOrder: 2 },
  packed:           { label: 'Packed',            color: 'text-purple-400',  bgColor: 'bg-purple-400/10',  borderColor: 'border-purple-400/30',  icon: 'Package',         sortOrder: 3 },
  label_generated:  { label: 'Label Generated',  color: 'text-cyan-400',    bgColor: 'bg-cyan-400/10',    borderColor: 'border-cyan-400/30',    icon: 'Tag',             sortOrder: 4 },
  shipped:          { label: 'Shipped',           color: 'text-sky-400',     bgColor: 'bg-sky-400/10',     borderColor: 'border-sky-400/30',     icon: 'Truck',           sortOrder: 5 },
  out_for_delivery: { label: 'Out for Delivery',  color: 'text-orange-400',  bgColor: 'bg-orange-400/10',  borderColor: 'border-orange-400/30',  icon: 'MapPin',          sortOrder: 6 },
  delivered:        { label: 'Delivered',          color: 'text-green-400',   bgColor: 'bg-green-400/10',   borderColor: 'border-green-400/30',   icon: 'CheckCircle2',    sortOrder: 7 },
  cancelled:        { label: 'Cancelled',          color: 'text-red-400',     bgColor: 'bg-red-400/10',     borderColor: 'border-red-400/30',     icon: 'XCircle',         sortOrder: 8 },
  return_requested: { label: 'Return Requested',  color: 'text-yellow-400',  bgColor: 'bg-yellow-400/10',  borderColor: 'border-yellow-400/30',  icon: 'RotateCcw',       sortOrder: 9 },
  returned:         { label: 'Returned',           color: 'text-orange-300',  bgColor: 'bg-orange-300/10',  borderColor: 'border-orange-300/30',  icon: 'PackageCheck',    sortOrder: 10 },
  refund_requested: { label: 'Refund Requested',  color: 'text-pink-400',    bgColor: 'bg-pink-400/10',    borderColor: 'border-pink-400/30',    icon: 'DollarSign',      sortOrder: 11 },
  refunded:         { label: 'Refunded',           color: 'text-gray-400',    bgColor: 'bg-gray-400/10',    borderColor: 'border-gray-400/30',    icon: 'BadgeCheck',      sortOrder: 12 },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, StatusConfig> = {
  pending:            { label: 'Pending',            color: 'text-amber-400',  bgColor: 'bg-amber-400/10',  borderColor: 'border-amber-400/30',  icon: 'Clock',        sortOrder: 0 },
  paid:               { label: 'Paid',               color: 'text-green-400',  bgColor: 'bg-green-400/10',  borderColor: 'border-green-400/30',  icon: 'CheckCircle',  sortOrder: 1 },
  failed:             { label: 'Failed',             color: 'text-red-400',    bgColor: 'bg-red-400/10',    borderColor: 'border-red-400/30',    icon: 'XCircle',      sortOrder: 2 },
  partially_refunded: { label: 'Partially Refunded', color: 'text-orange-400', bgColor: 'bg-orange-400/10', borderColor: 'border-orange-400/30', icon: 'AlertCircle',  sortOrder: 3 },
  refunded:           { label: 'Refunded',           color: 'text-gray-400',   bgColor: 'bg-gray-400/10',   borderColor: 'border-gray-400/30',   icon: 'RotateCcw',    sortOrder: 4 },
};

export const FULFILLMENT_STATUS_CONFIG: Record<FulfillmentStatus, StatusConfig> = {
  unfulfilled: { label: 'Unfulfilled', color: 'text-gray-400',   bgColor: 'bg-gray-400/10',   borderColor: 'border-gray-400/30',   icon: 'Circle',       sortOrder: 0 },
  processing:  { label: 'Processing',  color: 'text-blue-400',   bgColor: 'bg-blue-400/10',   borderColor: 'border-blue-400/30',   icon: 'Loader',       sortOrder: 1 },
  packed:      { label: 'Packed',      color: 'text-purple-400', bgColor: 'bg-purple-400/10', borderColor: 'border-purple-400/30', icon: 'Package',      sortOrder: 2 },
  shipped:     { label: 'Shipped',     color: 'text-sky-400',    bgColor: 'bg-sky-400/10',    borderColor: 'border-sky-400/30',    icon: 'Truck',        sortOrder: 3 },
  delivered:   { label: 'Delivered',   color: 'text-green-400',  bgColor: 'bg-green-400/10',  borderColor: 'border-green-400/30',  icon: 'CheckCircle2', sortOrder: 4 },
};

// ============================================================
// ORDER LIFECYCLE
// ============================================================

/** Standard forward progression */
export const ORDER_LIFECYCLE: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'label_generated',
  'shipped',
  'out_for_delivery',
  'delivered',
];

/** Valid status transitions from each state */
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['processing', 'packed', 'cancelled'],
  processing:       ['packed', 'cancelled'],
  packed:           ['label_generated', 'shipped', 'cancelled'],
  label_generated:  ['shipped', 'cancelled'],
  shipped:          ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered:        ['return_requested'],
  cancelled:        [],
  return_requested: ['returned', 'delivered'],
  returned:         ['refund_requested'],
  refund_requested: ['refunded'],
  refunded:         [],
};

// ============================================================
// TIMELINE EVENT TYPES
// ============================================================

export const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  order_created:       { label: 'Order Placed',         icon: 'ShoppingBag',  color: 'text-blue-400' },
  payment_received:    { label: 'Payment Received',     icon: 'CreditCard',   color: 'text-green-400' },
  payment_failed:      { label: 'Payment Failed',       icon: 'XCircle',      color: 'text-red-400' },
  order_confirmed:     { label: 'Order Confirmed',      icon: 'CheckCircle',  color: 'text-blue-400' },
  order_processing:    { label: 'Processing Started',   icon: 'Loader',       color: 'text-indigo-400' },
  order_packed:        { label: 'Order Packed',          icon: 'Package',      color: 'text-purple-400' },
  label_generated:     { label: 'Shipping Label Created', icon: 'Tag',        color: 'text-cyan-400' },
  order_shipped:       { label: 'Order Shipped',         icon: 'Truck',        color: 'text-sky-400' },
  out_for_delivery:    { label: 'Out for Delivery',      icon: 'MapPin',       color: 'text-orange-400' },
  order_delivered:     { label: 'Order Delivered',       icon: 'CheckCircle2', color: 'text-green-400' },
  order_cancelled:     { label: 'Order Cancelled',       icon: 'XCircle',      color: 'text-red-400' },
  return_requested:    { label: 'Return Requested',      icon: 'RotateCcw',    color: 'text-yellow-400' },
  return_approved:     { label: 'Return Approved',       icon: 'CheckCircle',  color: 'text-green-400' },
  return_received:     { label: 'Return Received',       icon: 'PackageCheck', color: 'text-blue-400' },
  refund_requested:    { label: 'Refund Requested',      icon: 'DollarSign',   color: 'text-pink-400' },
  refund_approved:     { label: 'Refund Approved',       icon: 'CheckCircle',  color: 'text-green-400' },
  refund_completed:    { label: 'Refund Completed',      icon: 'BadgeCheck',   color: 'text-green-400' },
  admin_note:          { label: 'Admin Note',            icon: 'StickyNote',   color: 'text-gray-400' },
  customer_message:    { label: 'Customer Message',      icon: 'MessageCircle', color: 'text-blue-300' },
  courier_update:      { label: 'Courier Update',        icon: 'Truck',        color: 'text-sky-300' },
  status_change:       { label: 'Status Updated',        icon: 'RefreshCw',    color: 'text-foreground/' },
};

// ============================================================
// HELPERS
// ============================================================

/** Get the label for an order status */
export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_CONFIG[status]?.label || status;
}

/** Get the label for a payment status */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  return PAYMENT_STATUS_CONFIG[status]?.label || status;
}

/** Check if a status transition is valid */
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Get the lifecycle progress (0-100) for a given status */
export function getLifecycleProgress(status: OrderStatus): number {
  const idx = ORDER_LIFECYCLE.indexOf(status);
  if (idx === -1) return 0;
  return Math.round((idx / (ORDER_LIFECYCLE.length - 1)) * 100);
}

/** Check if an order is in a terminal state */
export function isTerminalStatus(status: OrderStatus): boolean {
  return ['delivered', 'cancelled', 'refunded'].includes(status);
}

/** Check if an order is active (in progress) */
export function isActiveStatus(status: OrderStatus): boolean {
  return ['pending', 'confirmed', 'processing', 'packed', 'label_generated', 'shipped', 'out_for_delivery'].includes(status);
}

/** Get the grand total with backward-compatible fallback */
export function getOrderTotal(order: { grand_total?: number | null; total?: number | null }): number {
  return order.grand_total ?? order.total ?? 0;
}
