"use client";

import { DBImage } from "@/lib/db/schema";
import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

// Dynamically import map to avoid SSR issues
const GraffitiMap = dynamic(
  () => import("./graffiti-map").then((mod) => mod.GraffitiMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    ),
  }
);

export function MapView({ images }: { images: DBImage[] }) {
  const [selectedImage, setSelectedImage] = useState<DBImage | null>(null);

  return (
    <div className="relative h-full w-full">
      {/* Map */}
      <GraffitiMap
        images={images}
        onMarkerClick={(image) => setSelectedImage(image)}
      />

      {/* Selected Image Panel */}
      {selectedImage && (
        <div className="absolute top-4 right-4 w-96 bg-white rounded-lg shadow-2xl overflow-hidden z-[1000]">
          <div className="relative h-64">
            <Image
              src={selectedImage.path}
              alt={selectedImage.title}
              fill
              className="object-cover"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2">{selectedImage.title}</h3>
            <p className="text-sm text-gray-600">{selectedImage.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
