"use client";
import { ImageCard } from "./image-card";
import { DBImage } from "@/lib/db/schema";
import { NoImagesFound } from "./no-images-found";
import { useSharedTransition } from "@/lib/hooks/use-shared-transition";
import { CardGridSkeleton } from "./card-grid-skeleton";
import { useState, useEffect, useRef } from "react";

export const ImageSearch = ({
  images,
  query,
  selectedImageId,
}: {
  images: DBImage[];
  query?: string;
  selectedImageId?: number;
}) => {
  const { isPending } = useSharedTransition();

  if (isPending) return <CardGridSkeleton />;

  if (images.length === 0) {
    return <NoImagesFound query={query ?? ""} />;
  }

  return <ImageGrid images={images} selectedImageId={selectedImageId} />;
};

const ImageGrid = ({ images, selectedImageId }: { images: DBImage[]; selectedImageId?: number }) => {
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState(20);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (fullscreenIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFullscreenIndex(null);
      } else if (e.key === "ArrowLeft" && fullscreenIndex > 0) {
        setFullscreenIndex(fullscreenIndex - 1);
      } else if (e.key === "ArrowRight" && fullscreenIndex < images.length - 1) {
        setFullscreenIndex(fullscreenIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenIndex, images.length]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < images.length) {
          setDisplayCount((prev) => Math.min(prev + 20, images.length));
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [displayCount, images.length]);

  // Reset display count when images change
  useEffect(() => {
    setDisplayCount(20);
  }, [images]);

  const displayedImages = images.slice(0, displayCount);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 relative">
        {displayedImages.map((image, index) => (
          <div key={"image_" + image.id} id={`image-${image.id}`}>
            <ImageCard
              image={image}
              similarity={image.similarity}
              onClick={() => setFullscreenIndex(index)}
              isSelected={selectedImageId === image.id}
            />
          </div>
        ))}
      </div>

      {/* Load more trigger */}
      {displayCount < images.length && (
        <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading more...</p>
        </div>
      )}

      {/* Fullscreen Modal */}
      {fullscreenIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-8 gap-4"
          onClick={() => setFullscreenIndex(null)}
        >
          <div className="relative flex-shrink-0">
            <img
              src={displayedImages[fullscreenIndex].path}
              alt={displayedImages[fullscreenIndex].title}
              className="max-w-full max-h-[70vh] object-contain"
            />

            {/* Navigation Arrows */}
            {fullscreenIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreenIndex(fullscreenIndex - 1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full backdrop-blur-sm transition-colors pointer-events-auto"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {fullscreenIndex < displayedImages.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreenIndex(fullscreenIndex + 1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full backdrop-blur-sm transition-colors pointer-events-auto"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Text below image */}
          <div className="text-center text-white max-w-2xl space-y-1 pointer-events-none">
            <h3 className="text-xl font-semibold">{displayedImages[fullscreenIndex].title}</h3>
            <p className="text-sm text-gray-300">{displayedImages[fullscreenIndex].description}</p>
            {displayedImages[fullscreenIndex].address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayedImages[fullscreenIndex].address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:underline pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {displayedImages[fullscreenIndex].address}
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
};
