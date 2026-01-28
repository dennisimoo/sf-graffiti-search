import { getImages } from "@/lib/local/search";
import Link from "next/link";
import { MapView } from "@/components/map-view";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = (await searchParams).q;
  const { images, error } = await getImages(query);

  const locationsCount = images.filter(img => img.latitude && img.longitude).length;

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="p-8 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
            >
              ← Back to Grid
            </Link>
            <h1 className="font-semibold text-2xl">SF Graffiti Map</h1>
          </div>
          <div className="text-sm text-gray-600">
            {locationsCount > 0 ? (
              <span>{locationsCount} location{locationsCount !== 1 ? 's' : ''} mapped</span>
            ) : (
              <span>No locations yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        {error ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-red-600">{error.message}</p>
          </div>
        ) : (
          <MapView images={images} />
        )}
      </div>
    </div>
  );
}
