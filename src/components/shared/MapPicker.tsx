'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon not showing up correctly in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address: {
      street?: string;
      area?: string;
      city?: string;
      district?: string;
      pincode?: string;
    };
  }) => void;
}

function LocationMarker({ onLocationSelect }: MapPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      fetchAddress(e.latlng.lat, e.latlng.lng);
    },
  });

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.address) {
        onLocationSelect({
          lat,
          lng,
          address: {
            street: data.address.road || data.address.street,
            area: data.address.suburb || data.address.neighbourhood || data.address.village,
            city: data.address.city || data.address.town,
            district: data.address.state_district || data.address.county,
            pincode: data.address.postcode,
          }
        });
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  return position === null ? null : (
    <Marker position={position} />
  );
}

export default function MapPicker({ onLocationSelect }: MapPickerProps) {
  // Default to Chennai, Tamil Nadu
  const defaultCenter: L.LatLngTuple = [13.0827, 80.2707];

  return (
    <div className="w-full h-[300px] rounded-xl overflow-hidden border border-white/10 relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={10} 
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onLocationSelect={onLocationSelect} />
      </MapContainer>
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
        <div className="bg-black/80 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full border border-white/20 shadow-xl whitespace-nowrap">
          Tap anywhere to drop a pin
        </div>
      </div>
    </div>
  );
}
