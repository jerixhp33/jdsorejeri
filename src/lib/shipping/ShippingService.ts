import type { Order } from '@/types';
import type { ShippingProvider, PackageDetails, ShipmentResult, TrackingStatus } from './types';
import { PackageBuilder } from './PackageBuilder';

export class ShippingService {
  private providers: Map<string, ShippingProvider>;
  private defaultProviderId: string;

  constructor(providers: ShippingProvider[], defaultProviderId: string) {
    this.providers = new Map(providers.map(p => [p.id, p]));
    this.defaultProviderId = defaultProviderId;
  }

  getProvider(id?: string): ShippingProvider {
    const providerId = id || this.defaultProviderId;
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Shipping provider '${providerId}' not found.`);
    }
    return provider;
  }

  /**
   * Orchestrates the creation of a shipment.
   * 1. Validates order status
   * 2. Builds package metrics
   * 3. Calls the designated Provider
   * 4. Returns the result for the DB layer to save
   */
  async fulfillOrder(order: Order, providerId?: string): Promise<ShipmentResult> {
    if (order.status !== 'packed') {
      return { success: false, error: 'Order must be in packed status to generate a shipment.' };
    }

    const provider = this.getProvider(providerId);
    const pkg = PackageBuilder.calculateOrderPackage(order);

    try {
      const result = await provider.createShipment(order, pkg);
      return result;
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to create shipment' };
    }
  }

  async track(trackingNumber: string, providerId?: string): Promise<TrackingStatus> {
    const provider = this.getProvider(providerId);
    return provider.trackShipment(trackingNumber);
  }

  async generateLabel(trackingNumber: string, format: 'PDF' | 'PNG' | 'ZPL' = 'PDF', providerId?: string): Promise<string | Buffer> {
    const provider = this.getProvider(providerId);
    return provider.generateLabel(trackingNumber, format);
  }
}
