import type { Order } from '@/types';

export interface PackageDimensions {
  length: number; // cm
  width: number;  // cm
  height: number; // cm
}

export interface PackageDetails {
  deadWeight: number; // kg
  volumetricWeight: number; // kg
  chargeableWeight: number; // kg
  dimensions: PackageDimensions;
  packageCount: number;
}

export interface ShipmentResult {
  success: boolean;
  trackingNumber?: string;
  trackingUrl?: string;
  labelUrl?: string;
  providerReference?: string;
  error?: string;
  estimatedDelivery?: Date;
  shippingCost?: number;
}

export interface TrackingEvent {
  status: string;
  location?: string;
  timestamp: Date;
  description?: string;
}

export interface TrackingStatus {
  success: boolean;
  currentStatus: string; // 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception'
  events: TrackingEvent[];
  estimatedDelivery?: Date;
  error?: string;
}

export interface ShippingRate {
  providerId: string;
  serviceName: string; // e.g. 'Standard', 'Express'
  cost: number;
  estimatedDays: number;
}

export interface ShippingProvider {
  id: string;
  name: string;
  
  createShipment(order: Order, pkg: PackageDetails): Promise<ShipmentResult>;
  cancelShipment(trackingNumber: string): Promise<boolean>;
  trackShipment(trackingNumber: string): Promise<TrackingStatus>;
  generateLabel(trackingNumber: string, format: 'PDF' | 'PNG' | 'ZPL'): Promise<string | Buffer>;
  getRates(pkg: PackageDetails, destinationPincode: string): Promise<ShippingRate[]>;
  schedulePickup(shipmentIds: string[]): Promise<boolean>;
  downloadManifest(date: Date): Promise<string | Buffer>;
}
