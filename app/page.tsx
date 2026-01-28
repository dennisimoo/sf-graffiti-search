import { CardGridSkeleton } from "@/components/card-grid-skeleton";
import { SearchBox } from "@/components/search-box";
import { SuspendedImageSearch } from "@/components/suspended-image-search";
import Link from "next/link";
import { Suspense } from "react";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = (await searchParams).q;
  return (
    <main className="p-8 space-y-4">
      <div>
        <h1 className="font-semibold text-2xl">SF Graffiti Semantic Search</h1>
      </div>
      <div className="space-y-1">
        <p>
          Search through San Francisco graffiti photos using AI-powered semantic search.
          Images are analyzed by{" "}
          <Link
            href="https://deepmind.google/models/gemini/flash/"
            className="text-blue-600 hover:underline"
            target="_blank"
          >
            Gemini 3 Flash
          </Link>{" "}
          to generate searchable descriptions.
        </p>
        <p>
          These photos were taken by city inspectors documenting graffiti violations across San Francisco.
          Big thanks to{" "}
          <Link
            href="https://walzr.com/"
            className="text-blue-600 hover:underline"
            target="_blank"
          >
            walzr
          </Link>{" "}
          for getting the images.
        </p>
      </div>
      <div className="">
        <div className="pt-2">
          <SearchBox query={query} />
        </div>
        <Suspense fallback={<CardGridSkeleton />} key={query}>
          <SuspendedImageSearch query={query} />
        </Suspense>
      </div>
    </main>
  );
}
