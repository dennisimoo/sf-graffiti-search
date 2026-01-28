"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { DBImage } from "@/lib/db/schema";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface GraffitiLocation {
  image: DBImage;
  lat: number;
  lng: number;
}

interface GraffitiMapProps {
  images: DBImage[];
  onMarkerClick: (image: DBImage) => void;
}

// Component to fit map bounds to markers
function FitBounds({ locations }: { locations: GraffitiLocation[] }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map((loc) => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);

  return null;
}

export function GraffitiMap({ images, onMarkerClick }: GraffitiMapProps) {
  const [locations, setLocations] = useState<GraffitiLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLocations = async () => {
      setIsLoading(true);

      // Filter images that have coordinates and map them to locations
      const geocoded: GraffitiLocation[] = images
        .filter(image => image.latitude && image.longitude)
        .map(image => ({
          image,
          lat: image.latitude!,
          lng: image.longitude!,
        }));

      setLocations(geocoded);
      setIsLoading(false);
    };

    loadLocations();
  }, [images]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <div className="text-center max-w-md">
          <p className="text-gray-600 mb-4">
            No locations with coordinates found.
          </p>
          <p className="text-sm text-gray-500">
            Run <code className="bg-gray-100 px-2 py-1 rounded">npm run geocode</code> to add coordinates to existing images.
          </p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={[37.7749, -122.4194]} // San Francisco
      zoom={12}
      className="h-full w-full"
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FitBounds locations={locations} />
      {locations.map((loc, idx) => (
        <Marker
          key={`marker-${idx}`}
          position={[loc.lat, loc.lng]}
          eventHandlers={{
            click: () => onMarkerClick(loc.image),
          }}
        >
          <Popup>
            <div className="text-sm">
              <strong>{loc.image.title}</strong>
              <p className="text-xs mt-1 line-clamp-2">{loc.image.description}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
