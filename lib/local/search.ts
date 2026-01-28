"use server";

import fs from "fs";
import path from "path";

import { DBImage } from "@/lib/db/schema";

export interface LocalImage {
  id: string;
  url: string;
  address: string;
  location: string;
  originalComment: string;
  aiTitle: string;
  aiAnalysis: string;
  metadata: string;
  similarity?: number;
  latitude?: number;
  longitude?: number;
}

// In-memory cache - loaded on server startup
let cachedImages: LocalImage[] | null = null;

// Load cache on server startup
function loadCache() {
  try {
    const dataPath = path.join(process.cwd(), "data", "processed-images.json");
    if (fs.existsSync(dataPath)) {
      console.log("Loading images into memory cache on startup...");
      const start = Date.now();
      cachedImages = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
      console.log(`Cached ${cachedImages!.length} images in ${Date.now() - start}ms`);
    }
  } catch (error) {
    console.error("Failed to load cache on startup:", error);
  }
}

// Warm up cache immediately when module loads
loadCache();

// Convert LocalImage to DBImage format
function toDBImage(img: LocalImage): DBImage {
  return {
    id: parseInt(img.id) || 0,
    path: img.url,
    title: img.aiTitle || img.address,
    description: img.aiAnalysis || img.originalComment,
    similarity: img.similarity,
    latitude: img.latitude,
    longitude: img.longitude,
    address: img.address,
    location: img.location,
    originalComment: img.originalComment,
  };
}

export async function getImages(
  query?: string,
): Promise<{ images: DBImage[]; error?: Error }> {
  try {
    // Use pre-loaded cache
    if (!cachedImages) {
      return {
        images: [],
        error: new Error(
          "No data found. Please run: npm run process-csv",
        ),
      };
    }

    const images = cachedImages;

    // If no query, return all images
    if (!query || query.length < 2) {
      return { images: images.map(toDBImage) };
    }

    // Search by text match across AI-generated fields and address only
    const lowerQuery = query.toLowerCase();
    const matches = images.filter(
      (img) =>
        img.aiTitle?.toLowerCase().includes(lowerQuery) ||
        img.aiAnalysis.toLowerCase().includes(lowerQuery) ||
        img.address.toLowerCase().includes(lowerQuery),
    );

    // Mark direct matches with similarity 1
    const matchesWithSimilarity = matches.map(img => ({
      ...img,
      similarity: 1,
    }));

    return { images: matchesWithSimilarity.map(toDBImage) };
  } catch (e) {
    console.error("Search error:", e);
    return {
      images: [],
      error:
        e instanceof Error ? e : new Error("An error occurred while searching"),
    };
  }
}
