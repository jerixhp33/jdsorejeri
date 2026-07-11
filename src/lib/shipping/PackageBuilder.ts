import type { Order } from '@/types';
import type { PackageDetails, PackageDimensions } from './types';

/**
 * Standard Volumetric Divisor used by most Indian couriers (e.g. ST Courier, Delhivery)
 * Formula: (L * W * H in cm) / 5000 = Volumetric Weight in KG
 */
const VOLUMETRIC_DIVISOR = 5000;

export class PackageBuilder {
  /**
   * Calculates the shipping metrics for an entire order based on its items.
   * If an item is missing dimensions/weight, it falls back to sensible defaults.
   */
  static calculateOrderPackage(order: Order): PackageDetails {
    let totalDeadWeight = 0; // kg
    let totalVolume = 0; // cm³
    let packageCount = 0;

    // We assume 1 master box for now, unless the volume exceeds a certain threshold.
    // For JD Store (posters, jewelry), 1 box is usually sufficient.
    packageCount = 1; 

    // Find the max dimensions across all products to define the master box size
    let maxLength = 0;
    let maxWidth = 0;
    let maxHeight = 0;

    order.items?.forEach((item) => {
      const product = item.product;
      const qty = item.quantity;
      
      // Default fallback dimensions if product data is missing
      const weightGrams = (product as any)?.weight_grams || 200; 
      const l = (product as any)?.length_cm || 20;
      const w = (product as any)?.width_cm || 15;
      const h = (product as any)?.height_cm || 5;

      totalDeadWeight += (weightGrams / 1000) * qty;
      
      // Very basic volumetric aggregation for a master box:
      // Real 3D bin packing is complex, so we approximate by adding the heights 
      // of stacked items, while keeping the max footprint (L x W).
      maxLength = Math.max(maxLength, l);
      maxWidth = Math.max(maxWidth, w);
      maxHeight += (h * qty); 
    });

    // Add a buffer for the actual cardboard shipping box (+2cm each side, +100g weight)
    maxLength += 2;
    maxWidth += 2;
    maxHeight += 2;
    totalDeadWeight += 0.1;

    const dimensions: PackageDimensions = {
      length: maxLength,
      width: maxWidth,
      height: maxHeight
    };

    // Calculate Volumetric Weight
    const volumetricWeight = (maxLength * maxWidth * maxHeight) / VOLUMETRIC_DIVISOR;

    // Courier bills on whichever is higher
    const chargeableWeight = Math.max(totalDeadWeight, volumetricWeight);

    return {
      deadWeight: Number(totalDeadWeight.toFixed(2)),
      volumetricWeight: Number(volumetricWeight.toFixed(2)),
      chargeableWeight: Number(chargeableWeight.toFixed(2)),
      dimensions,
      packageCount
    };
  }
}
