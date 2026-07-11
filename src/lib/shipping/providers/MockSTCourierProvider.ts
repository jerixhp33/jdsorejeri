import type { Order } from '@/types';
import type { ShippingProvider, PackageDetails, ShipmentResult, TrackingStatus, ShippingRate } from '../types';

export class MockSTCourierProvider implements ShippingProvider {
  id = 'st_courier';
  name = 'ST Courier';

  // Helper to simulate network latency
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async createShipment(order: Order, pkg: PackageDetails): Promise<ShipmentResult> {
    await this.delay(600); // Mock network request

    const trackingNumber = `STC${Math.floor(Math.random() * 1000000000)}`;
    
    return {
      success: true,
      trackingNumber,
      trackingUrl: `https://stcourier.com/track/shipment?awb=${trackingNumber}`,
      providerReference: `REF-${trackingNumber}`,
      estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // +4 days
      shippingCost: Math.ceil(pkg.chargeableWeight * 40) // Mock cost: Rs 40 per KG
    };
  }

  async cancelShipment(trackingNumber: string): Promise<boolean> {
    await this.delay(300);
    return true;
  }

  async trackShipment(trackingNumber: string): Promise<TrackingStatus> {
    await this.delay(400);
    
    // Generate a mock timeline based on the tracking number to keep it consistent
    return {
      success: true,
      currentStatus: 'in_transit',
      events: [
        {
          status: 'Shipment Created',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          location: 'Origin Hub'
        },
        {
          status: 'Picked Up',
          timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000),
          location: 'Origin Hub'
        },
        {
          status: 'In Transit',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          location: 'Transit Hub (Coimbatore)',
          description: 'Package has reached transit hub and is being forwarded.'
        }
      ]
    };
  }

  async generateLabel(trackingNumber: string, format: 'PDF' | 'PNG' | 'ZPL'): Promise<string | Buffer> {
    await this.delay(500);
    // Return a mock URL that would point to a generated PDF
    return `https://mock.stcourier.com/labels/${trackingNumber}.${format.toLowerCase()}`;
  }

  async getRates(pkg: PackageDetails, destinationPincode: string): Promise<ShippingRate[]> {
    await this.delay(300);
    return [
      {
        providerId: this.id,
        serviceName: 'Surface (Standard)',
        cost: Math.ceil(pkg.chargeableWeight * 40),
        estimatedDays: 5
      },
      {
        providerId: this.id,
        serviceName: 'Air (Express)',
        cost: Math.ceil(pkg.chargeableWeight * 90),
        estimatedDays: 2
      }
    ];
  }

  async schedulePickup(shipmentIds: string[]): Promise<boolean> {
    await this.delay(600);
    return true;
  }

  async downloadManifest(date: Date): Promise<string | Buffer> {
    await this.delay(800);
    return 'https://mock.stcourier.com/manifests/daily.pdf';
  }
}
