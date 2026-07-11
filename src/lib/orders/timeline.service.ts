import { ORDER_STATUS_CONFIG, getOrderStatusLabel } from './order.constants';
import type { OrderStatus } from '@/types';

export interface TimelineEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  icon: string;
  color: string;
  isCompleted: boolean;
  isCurrent: boolean;
  metadata?: any;
}

/**
 * Builds a chronological timeline for an order, combining its status,
 * events from order_events, shipments, and payments.
 */
export function buildOrderTimeline(
  currentStatus: OrderStatus,
  events: any[] = [],
  createdAt: string,
  updatedAt: string
): TimelineEvent[] {
  // In a real implementation with the full database schema, this would merge
  // the order_events table records with the fixed status lifecycle.
  // Since we are migrating from a simpler system, we will build a 
  // synthetic timeline based on the current status and ORDER_LIFECYCLE.
  
  const lifecycle = [
    'pending',
    'confirmed',
    'processing',
    'packed',
    'shipped',
    'out_for_delivery',
    'delivered'
  ] as OrderStatus[];

  const currentIndex = lifecycle.indexOf(currentStatus);
  const isTerminal = ['cancelled', 'returned', 'refunded'].includes(currentStatus);
  
  const timeline: TimelineEvent[] = [];

  // If it's cancelled, we show placed -> cancelled
  if (currentStatus === 'cancelled') {
    timeline.push({
      id: 'step-pending',
      title: 'Order Placed',
      description: 'Your order was received',
      date: createdAt,
      icon: ORDER_STATUS_CONFIG['pending'].icon,
      color: ORDER_STATUS_CONFIG['pending'].color,
      isCompleted: true,
      isCurrent: false,
    });
    timeline.push({
      id: 'step-cancelled',
      title: 'Order Cancelled',
      description: 'The order has been cancelled',
      date: updatedAt,
      icon: ORDER_STATUS_CONFIG['cancelled'].icon,
      color: ORDER_STATUS_CONFIG['cancelled'].color,
      isCompleted: true,
      isCurrent: true,
    });
    return timeline;
  }

  // Normal flow
  for (let i = 0; i < lifecycle.length; i++) {
    const status = lifecycle[i];
    const isCompleted = isTerminal ? false : (currentIndex >= i);
    const isCurrent = isTerminal ? false : (currentIndex === i);
    
    // Only show up to the current status, plus the NEXT one if not terminal
    if (i > currentIndex + 1 && !isTerminal) break;
    
    // Skip remaining steps if terminal (e.g. returned/refunded)
    if (isTerminal && i > 0) break;

    const config = ORDER_STATUS_CONFIG[status];
    
    timeline.push({
      id: `step-${status}`,
      title: config.label,
      description: getDescriptionForStatus(status),
      // We don't have exact timestamps for all past states yet without order_events,
      // so we use createdAt for the first, updatedAt for the current, and empty for future.
      date: i === 0 ? createdAt : (isCurrent ? updatedAt : ''),
      icon: config.icon,
      color: config.color,
      isCompleted,
      isCurrent,
    });
  }

  // Append terminal return/refund states if applicable
  if (['return_requested', 'returned', 'refund_requested', 'refunded'].includes(currentStatus)) {
    const config = ORDER_STATUS_CONFIG[currentStatus];
    timeline.push({
      id: `step-${currentStatus}`,
      title: config.label,
      description: getDescriptionForStatus(currentStatus),
      date: updatedAt,
      icon: config.icon,
      color: config.color,
      isCompleted: true,
      isCurrent: true,
    });
  }

  // If we have actual events from the DB, we would merge them in here
  // based on timestamps.
  if (events && events.length > 0) {
    events.forEach(evt => {
      // Find where to insert or how to merge
      // For now we just return the synthetic timeline as the primary view
    });
  }

  return timeline;
}

function getDescriptionForStatus(status: OrderStatus): string {
  switch (status) {
    case 'pending': return 'Your order has been received and is awaiting payment confirmation.';
    case 'confirmed': return 'Payment confirmed. We are preparing your order.';
    case 'processing': return 'Your items are being gathered and quality checked.';
    case 'packed': return 'Your order is packed and ready for the courier.';
    case 'label_generated': return 'Shipping label has been created.';
    case 'shipped': return 'Your order has been handed over to the courier.';
    case 'out_for_delivery': return 'Your order is out for delivery today.';
    case 'delivered': return 'Your order has been delivered successfully.';
    case 'cancelled': return 'This order has been cancelled.';
    case 'return_requested': return 'You have requested a return for this order.';
    case 'returned': return 'Your return has been received and processed.';
    case 'refund_requested': return 'A refund has been requested for this order.';
    case 'refunded': return 'Your refund has been issued.';
    default: return '';
  }
}
