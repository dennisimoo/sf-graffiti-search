"use client";

import { DBImage } from "@/lib/db/schema";
import { NoImagesFound } from "./no-images-found";
import { useSharedTransition } from "@/lib/hooks/use-shared-transition";
import { CardGridSkeleton } from "./card-grid-skeleton";
import { useState } from "react";
import dynamic from "next/dynamic";
import { ImageSearch } from "./image-search";

// Dynamically import map to avoid SSR issues
const GraffitiMap = dynamic(
  () => import("./graffiti-map").then((mod) => mod.GraffitiMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    ),
  }
);

export function ImageSearchWithMap({
  images,
  query,
}: {
  images: DBImage[];
  query?: string;
}) {
  const { isPending } = useSharedTransition();
  const [selectedImage, setSelectedImage] = useState<DBImage | null>(null);

  if (isPending) return <CardGridSkeleton />;

  if (images.length === 0) {
    return <NoImagesFound query={query ?? ""} />;
  }

  return (
    <div className="flex gap-4 w-full h-full min-h-0">
      {/* Map on the left */}
      <div className="w-1/3 h-full rounded-lg overflow-hidden border border-gray-200">
        <GraffitiMap
          images={images}
          onMarkerClick={(image) => {
            setSelectedImage(image);
            // Scroll to the image in the grid
            const element = document.getElementById(`image-${image.id}`);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }}
        />
      </div>

      {/* Image grid on the right */}
      <div className="flex-1 h-full overflow-y-auto">
        <ImageSearch images={images} query={query} selectedImageId={selectedImage?.id} />
      </div>
    </div>
  );
}
