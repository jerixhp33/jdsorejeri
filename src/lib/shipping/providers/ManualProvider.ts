import type { Order } from '@/types';
import type { ShippingProvider, PackageDetails, ShipmentResult, TrackingStatus, ShippingRate } from '../types';

export class ManualProvider implements ShippingProvider {
  id = 'manual';
  name = 'Manual Fulfillment';

  async createShipment(order: Order, pkg: PackageDetails): Promise<ShipmentResult> {
    // For manual fulfillment, the tracking number might be a reference to an internal driver or simply "MANUAL-XXXX"
    const trackingNumber = `MANUAL-${order.order_number}`;
    return {
      success: true,
      trackingNumber,
      providerReference: trackingNumber,
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // +2 days
    };
  }

  async cancelShipment(trackingNumber: string): Promise<boolean> {
    return true; // Always succeeds for manual
  }

  async trackShipment(trackingNumber: string): Promise<TrackingStatus> {
    return {
      success: true,
      currentStatus: 'in_transit',
      events: [
        {
          status: 'Shipment Created',
          timestamp: new Date(),
          description: 'Package assigned to internal delivery staff.'
        }
      ]
    };
  }

  async generateLabel(trackingNumber: string, format: 'PDF' | 'PNG' | 'ZPL'): Promise<string | Buffer> {
    // We would generate a very basic PDF or just return a static URL for manual packages
    return 'https://example.com/manual-label.pdf';
  }

  async getRates(pkg: PackageDetails, destinationPincode: string): Promise<ShippingRate[]> {
    return [
      {
        providerId: this.id,
        serviceName: 'Local Delivery',
        cost: 0,
        estimatedDays: 2
      }
    ];
  }

  async schedulePickup(shipmentIds: string[]): Promise<boolean> {
    return true;
  }

  async downloadManifest(date: Date): Promise<string | Buffer> {
    return 'https://example.com/manual-manifest.pdf';
  }
}
