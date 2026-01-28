"use client";

import { DBImage } from "@/lib/db/schema";
import { MatchBadge } from "./match-badge";
import { Card } from "./ui/card";
import { highlightText } from "@/lib/utils";

export function ImageCard({
  image,
  similarity,
  onClick,
  isSelected,
  query,
}: {
  image: DBImage;
  similarity?: number;
  onClick?: () => void;
  isSelected?: boolean;
  query?: string;
}) {
  return (
    <Card
      key={image.id}
      className={`h-[250px] md:h-[450px] relative group rounded-lg overflow-hidden cursor-pointer transition-all ${
        isSelected ? "ring-4 ring-blue-500" : ""
      }`}
      onClick={onClick}
    >
      <img
        src={image.path}
        alt={image.title}
        loading="lazy"
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-zinc-900/70 group-hover:opacity-100 opacity-0 transition-opacity flex flex-col items-center justify-center p-6 text-white text-center">
        <h3
          className="text-xl font-semibold"
          dangerouslySetInnerHTML={{ __html: highlightText(image.title, query) }}
        />
        <p
          className="hidden md:block text-sm mt-2 overflow-y-hidden"
          dangerouslySetInnerHTML={{ __html: highlightText(image.description, query) }}
        />
      </div>
      {similarity ? (
        <div className="py-2 z-10 absolute bottom-2 left-2">
          <MatchBadge
            type={similarity === 1 ? "direct" : "semantic"}
            similarity={similarity}
          />
        </div>
      ) : null}
    </Card>
  );
}
