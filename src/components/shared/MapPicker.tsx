'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// ── Custom Red Pin Icon (pure SVG, no external images needed) ──
const PIN_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#ef4444" stroke="#b91c1c" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="white" stroke="white" stroke-width="0.5"/></svg>';

let pinIcon: any;
if (typeof window !== 'undefined') {
  pinIcon = L.divIcon({
    html: `<div style="position:relative;left:-18px;top:-36px;">${PIN_SVG}</div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [0, 0],
  });
}

// ── LocationIQ API Helper ──
const API_KEY = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY || '';

async function reverseGeocode(lat: number, lng: number) {
  if (!API_KEY) return null;
  try {
    const url = `https://us1.locationiq.com/v1/reverse.php?key=${API_KEY}&lat=${lat}&lon=${lng}&format=json&accept-language=en&zoom=18&addressdetails=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function forwardGeocode(query: string) {
  if (!API_KEY || !query || query.length < 3) return null;
  try {
    const url = `https://us1.locationiq.com/v1/search.php?key=${API_KEY}&q=${encodeURIComponent(query)}&format=json&accept-language=en&countrycodes=in&limit=1&addressdetails=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) return data[0];
    return null;
  } catch {
    return null;
  }
}

// ── Parse LocationIQ response into our address format ──
function parseAddress(data: any): { street: string; area: string; city: string; district: string; pincode: string } {
  const addr = data?.address || {};

  // Street: Try official road first, then nearby POI names
  let street = addr.road || addr.pedestrian || addr.path || addr.footway || addr.cycleway || '';

  // Area: Suburb > Neighbourhood > Village > Hamlet
  const area = addr.suburb || addr.neighbourhood || addr.residential || addr.village || addr.hamlet || '';

  // City: Prioritize city/town, then fall back
  const city = addr.city || addr.town || addr.city_district || '';

  // District
  const district = addr.state_district || addr.county || '';

  // Pincode
  const pincode = addr.postcode || '';

  // ── Smart Street Fallback ──
  // If no road tag exists, extract the first unique part from display_name
  if (!street && data?.display_name) {
    const knownValues = new Set(
      [area, city, district, pincode, addr.state, addr.country, addr.country_code, addr.ISO3166]
        .filter(Boolean)
        .map((v: string) => v.toLowerCase().trim())
    );
    const parts = data.display_name.split(',').map((p: string) => p.trim());
    for (const part of parts) {
      if (part && !knownValues.has(part.toLowerCase())) {
        street = part;
        break;
      }
    }
  }

  return { street, area, city, district, pincode };
}

// ── Props ──
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

// ── Inner component that handles map clicks & marker ──
function MapInteraction({ onLocationSelect, searchQuery }: MapPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const lastSearchRef = useRef('');
  const map = useMap();

  // Handle map clicks → drop pin + reverse geocode
  useMapEvents({
    click(e) {
      const latlng = e.latlng;
      setPosition(latlng);
      reverseGeocode(latlng.lat, latlng.lng).then((data) => {
        if (!data) return;
        const address = parseAddress(data);
        onLocationSelect({ lat: latlng.lat, lng: latlng.lng, address });
      });
    },
  });

  // Forward geocode when user types an address (debounced)
  useEffect(() => {
    if (!searchQuery || searchQuery === lastSearchRef.current || searchQuery.length < 4) return;

    const timer = setTimeout(async () => {
      lastSearchRef.current = searchQuery;
      const result = await forwardGeocode(searchQuery);
      if (result) {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          const newPos = L.latLng(lat, lon);
          setPosition(newPos);
          map.flyTo(newPos, 16, { duration: 1.5 });
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchQuery, map]);

  if (!position) return null;
  return <Marker position={position} icon={pinIcon} />;
}

// ── Main MapPicker Component ──
export default function MapPicker({ onLocationSelect, searchQuery }: MapPickerProps) {
  const defaultCenter: L.LatLngTuple = [13.0827, 80.2707]; // Chennai
  const mapRef = useRef<L.Map | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const map = mapRef.current;

        if (map) {
          map.flyTo([lat, lng], 17, { duration: 1.5 });

          // Wait for flyTo animation, then drop pin via reverse geocode
          setTimeout(async () => {
            const data = await reverseGeocode(lat, lng);
            if (data) {
              const address = parseAddress(data);
              onLocationSelect({ lat, lng, address });

              // Drop the pin by firing a synthetic click
              map.fire('click', { latlng: L.latLng(lat, lng) });
            }
            setGpsLoading(false);
          }, 500);
        } else {
          setGpsLoading(false);
        }
      },
      () => {
        alert('Unable to retrieve your location. Please enable location access in your browser settings.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onLocationSelect]);

  return (
    <div className="w-full h-[350px] rounded-xl overflow-hidden border border-white/10 relative z-0 shadow-lg">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapInteraction onLocationSelect={onLocationSelect} searchQuery={searchQuery} />
      </MapContainer>

      {/* Instruction Pill */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
        <div className="bg-black/80 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full border border-white/10 shadow-xl flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Tap anywhere to drop a pin
        </div>
      </div>

      {/* GPS Locate Me Button */}
      <div className="absolute bottom-4 right-4 z-[400]">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={gpsLoading}
          className="bg-black/90 text-white p-3 rounded-full shadow-lg border border-white/10 hover:bg-luxe-accent/20 hover:text-luxe-accent hover:scale-110 transition-all flex items-center justify-center disabled:opacity-50"
          title="Detect my current location"
        >
          {gpsLoading ? (
            <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
