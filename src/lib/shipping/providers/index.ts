import { ManualProvider } from './ManualProvider';
import { MockSTCourierProvider } from './MockSTCourierProvider';
import { ShippingService } from '../ShippingService';

export const shippingService = new ShippingService(
  [
    new ManualProvider(),
    new MockSTCourierProvider()
  ],
  'st_courier' // Default provider
);
