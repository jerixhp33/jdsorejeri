import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CouponStore {
  appliedCoupon: any | null;
  setAppliedCoupon: (coupon: any | null) => void;
}

export const useCouponStore = create<CouponStore>()(
  persist(
    (set) => ({
      appliedCoupon: null,
      setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),
    }),
    {
      name: 'coupon-storage',
    }
  )
);
