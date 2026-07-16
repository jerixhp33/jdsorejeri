import { MapPin, Phone, User } from 'lucide-react';

interface Address {
  full_name: string;
  phone: string;
  alternate_phone?: string | null;
  house_no: string;
  street: string;
  area: string;
  landmark?: string | null;
  city: string;
  district: string;
  pincode: string;
}

interface Props {
  address: Address;
  title?: string;
  className?: string;
}

export function AddressCard({ address, title = 'Delivery Address', className = '' }: Props) {
  if (!address) return null;

  return (
    <div className={`p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-4 ${className}`}>
      <h3 className="text-white font-medium flex items-center gap-2">
        <MapPin className="w-4 h-4 text-luxe-accent" />
        {title}
      </h3>
      
      <div className="space-y-3 text-sm text-zinc-400">
        <div className="flex items-start gap-3">
          <User className="w-4 h-4 mt-0.5 text-zinc-500 shrink-0" />
          <span className="text-zinc-200">{address.full_name}</span>
        </div>

        <div className="flex items-start gap-3">
          <Phone className="w-4 h-4 mt-0.5 text-zinc-500 shrink-0" />
          <div>
            <div>{address.phone}</div>
            {address.alternate_phone && (
              <div className="text-zinc-500">{address.alternate_phone} (Alt)</div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 mt-0.5 text-zinc-500 shrink-0 opacity-0" />
          <div className="space-y-1">
            <p>{address.house_no}, {address.street}</p>
            <p>{address.area}</p>
            {address.landmark && <p>Landmark: {address.landmark}</p>}
            <p>{address.city}, {address.district} - <span className="text-zinc-300">{address.pincode}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
