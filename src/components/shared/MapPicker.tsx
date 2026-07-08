'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

// Fix for default Leaflet marker icons in Next.js
import L from 'leaflet';
let DefaultIcon: any;
if (typeof window !== 'undefined') {
  DefaultIcon = L.divIcon({
    html: '<div style="transform: translate(-50%, -100%); width: 32px; height: 32px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg></div>',
    className: '',
    iconSize: [0, 0],
  });
}

interface MapPickerProps {
  searchQuery?: string;
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

function LocationMarker({ onLocationSelect, searchQuery }: MapPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const API_KEY = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY || '';

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      fetchAddress(e.latlng.lat, e.latlng.lng);
    },
  });

  // Forward Geocoding (Typing to find location)
  useEffect(() => {
    if (!searchQuery || !API_KEY) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://us1.locationiq.com/v1/search.php?key=${API_KEY}&q=${encodeURIComponent(searchQuery)}&format=json&accept-language=en&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          const newPos = L.latLng(lat, lng);
          map.flyTo(newPos, 16);
          setPosition(newPos);
          // We intentionally do NOT call onLocationSelect here to prevent an infinite loop!
        }
      } catch (error) {
        console.error('Error forward geocoding:', error);
      }
    }, 1500); // 1.5s debounce to respect API limits

    return () => clearTimeout(timer);
  }, [searchQuery, map, API_KEY]);

  // Reverse Geocoding (Clicking map to find address)
  const fetchAddress = async (lat: number, lng: number) => {
    if (!API_KEY) return;
    try {
      const res = await fetch(`https://us1.locationiq.com/v1/reverse.php?key=${API_KEY}&lat=${lat}&lon=${lng}&format=json&accept-language=en`);
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        let street = addr.road || addr.pedestrian || addr.path || addr.footway || '';
        const area = addr.suburb || addr.neighbourhood || addr.residential || addr.village || addr.hamlet || '';
        const city = addr.city || addr.town || addr.city_district || addr.county || addr.state_district || '';
        const district = addr.state_district || addr.state || '';
        const pincode = addr.postcode || '';

        // Smart Fallback: If no street name, scan display_name for any part not already used
        if (!street && data.display_name) {
          const usedValues = [area, city, district, pincode, addr.state, addr.country, addr.country_code].filter(Boolean).map((v: string) => v.toLowerCase());
          const parts = data.display_name.split(',').map((p: string) => p.trim());
          for (const part of parts) {
            if (part && !usedValues.includes(part.toLowerCase())) {
              street = part;
              break;
            }
          }
        }

        onLocationSelect({
          lat,
          lng,
          address: { street, area, city, district, pincode },
        });
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  return position === null ? null : (
    <Marker position={position} icon={DefaultIcon} />
  );
}

export default function MapPicker({ onLocationSelect, searchQuery }: MapPickerProps) {
  // Default to Chennai, Tamil Nadu
  const defaultCenter: L.LatLngTuple = [13.0827, 80.2707];
  const [mapRef, setMapRef] = useState<L.Map | null>(null);

  const locateUser = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (mapRef) {
          mapRef.flyTo([lat, lng], 16);
          // Force drop the pin by simulating a click on the map at the GPS coordinates!
          mapRef.fire('click', { latlng: L.latLng(lat, lng) });
        }
      },
      (error) => {
        alert("Unable to retrieve your location. Please check your permissions.");
      }
    );
  };

  return (
    <div className="w-full h-[300px] rounded-xl overflow-hidden border border-white/10 relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        scrollWheelZoom={true} 
        style={{ width: '100%', height: '100%' }}
        ref={setMapRef}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onLocationSelect={onLocationSelect} searchQuery={searchQuery} />
      </MapContainer>
      
      {/* Instructions */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
        <div className="bg-black/80 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full border border-luxe-accent/20 shadow-xl whitespace-nowrap">
          Tap anywhere to drop a pin
        </div>
      </div>

      {/* Locate Me Button */}
      <div className="absolute bottom-4 right-4 z-[400]">
        <button
          type="button"
          onClick={locateUser}
          className="bg-black text-white p-3 rounded-full shadow-lg border border-luxe-accent/20 hover:bg-luxe-accent/20 hover:text-luxe-accent hover:scale-105 transition-all flex items-center justify-center"
          title="Use my current location"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
}
