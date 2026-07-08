'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

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

export default function MapPicker({ onLocationSelect, searchQuery }: MapPickerProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const defaultCenter = { lat: 13.0827, lng: 80.2707 }; // Chennai
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [position, setPosition] = useState<google.maps.LatLngLiteral | null>(null);
  
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
    geocoderRef.current = new window.google.maps.Geocoder();
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
    geocoderRef.current = null;
  }, []);

  // Forward Geocoding (Typing)
  useEffect(() => {
    if (!searchQuery || !map || !geocoderRef.current) return;
    const timer = setTimeout(() => {
      geocoderRef.current?.geocode({ address: searchQuery }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          map.panTo({ lat, lng });
          map.setZoom(16);
          setPosition({ lat, lng });
        }
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [searchQuery, map]);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !geocoderRef.current) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setPosition({ lat, lng });
    
    geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        // Parse Google Maps Address Components
        const components = results[0].address_components;
        let street = '', area = '', city = '', district = '', pincode = '';
        
        for (const comp of components) {
          const types = comp.types;
          if (types.includes('route') || types.includes('street_address') || types.includes('premise')) street = comp.long_name;
          if (types.includes('sublocality') || types.includes('neighborhood')) area = comp.long_name;
          if (types.includes('locality')) city = comp.long_name;
          if (types.includes('administrative_area_level_3') || types.includes('administrative_area_level_2')) {
            if (!district) district = comp.long_name;
          }
          if (types.includes('postal_code')) pincode = comp.long_name;
        }

        // Fallback: If street is missing but area is present, Google is highly accurate, but we leave street blank so user can fill.
        onLocationSelect({
          lat,
          lng,
          address: { street, area, city, district, pincode }
        });
      }
    });
  };

  const locateUser = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (map) {
          map.panTo({ lat, lng });
          map.setZoom(16);
          // Simulate click to reverse geocode
          handleMapClick({ latLng: new window.google.maps.LatLng(lat, lng) } as any);
        }
      },
      (error) => {
        alert("Unable to retrieve your location. Please check your permissions.");
      }
    );
  };

  if (!isLoaded) return <div className="w-full h-[300px] flex items-center justify-center bg-zinc-900 rounded-xl border border-white/10 text-white/50 text-sm">Loading Google Maps...</div>;

  return (
    <div className="w-full h-[300px] rounded-xl overflow-hidden border border-white/10 relative z-0">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "administrative.locality",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi.park",
              elementType: "geometry",
              stylers: [{ color: "#263c3f" }],
            },
            {
              featureType: "poi.park",
              elementType: "labels.text.fill",
              stylers: [{ color: "#6b9a76" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#38414e" }],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#212a37" }],
            },
            {
              featureType: "road",
              elementType: "labels.text.fill",
              stylers: [{ color: "#9ca5b3" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#746855" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [{ color: "#1f2835" }],
            },
            {
              featureType: "road.highway",
              elementType: "labels.text.fill",
              stylers: [{ color: "#f3d19c" }],
            },
            {
              featureType: "transit",
              elementType: "geometry",
              stylers: [{ color: "#2f3948" }],
            },
            {
              featureType: "transit.station",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#515c6d" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.stroke",
              stylers: [{ color: "#17263c" }],
            },
          ],
        }}
      >
        {position && <Marker position={position} />}
      </GoogleMap>
      
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
