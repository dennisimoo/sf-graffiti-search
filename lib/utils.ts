import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ImageStreamStatus = {
  regular: boolean;
  semantic: boolean;
};

export function highlightText(text: string, query?: string): string {
  if (!query || query.length < 2) return text;

  const lowerQuery = query.toLowerCase().trim();
  const isExactPhrase = lowerQuery.startsWith('"') && lowerQuery.endsWith('"');
  const searchTerm = isExactPhrase ? lowerQuery.slice(1, -1) : lowerQuery;

  // Escape special regex characters
  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Create regex with word boundaries for whole word matching
  const regex = new RegExp(`\\b(${escapedTerm})\\b`, 'gi');

  return text.replace(regex, '<mark class="bg-yellow-200 text-black px-0.5 rounded">$1</mark>');
}
