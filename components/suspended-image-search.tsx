// Use local search instead of database
import { getImages } from "@/lib/local/search";
import { ErrorComponent } from "./error";
import { ImageSearch } from "./image-search";

export const SuspendedImageSearch = async ({ query }: { query?: string }) => {
  const { images, error, total } = await getImages(query, 0, 100);

  if (error) {
    return <ErrorComponent error={error} />;
  }

  return (
    <>
      <div className="text-sm text-gray-600 mb-4">
        {(total || images.length).toLocaleString()} {query ? 'results' : 'graffiti photos'}
      </div>
      <ImageSearch images={images} query={query} />
    </>
  );
};
