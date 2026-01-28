import fs from "fs";
import path from "path";

interface ProcessedImage {
  id: string;
  url: string;
  address: string;
  location: string;
  originalComment: string;
  aiTitle: string;
  aiAnalysis: string;
  metadata: string;
  latitude?: number;
  longitude?: number;
}

async function geocodeAddress(address: string): Promise<{ latitude?: number; longitude?: number }> {
  try {
    // Add San Francisco, CA to the address for better results
    const fullAddress = `${address}, San Francisco, CA`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddress)}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SF-Graffiti-Search/1.0',
      },
    });

    if (!response.ok) {
      return {};
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }

    return {};
  } catch (error) {
    console.error(`Geocoding failed for ${address}:`, error instanceof Error ? error.message : error);
    return {};
  }
}

async function geocodeExistingImages() {
  const dataPath = path.join(process.cwd(), "data", "processed-images.json");

  if (!fs.existsSync(dataPath)) {
    console.error("No processed images found at:", dataPath);
    console.log("Run: npm run process-csv first");
    return;
  }

  console.log("Loading processed images...");
  const images: ProcessedImage[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  // Find images without coordinates
  const imagesToGeocode = images.filter(img => !img.latitude || !img.longitude);
  const alreadyGeocoded = images.length - imagesToGeocode.length;

  console.log(`Total images: ${images.length}`);
  console.log(`Already geocoded: ${alreadyGeocoded}`);
  console.log(`To geocode: ${imagesToGeocode.length}`);

  if (imagesToGeocode.length === 0) {
    console.log("\n✅ All images already have coordinates!");
    return;
  }

  console.log("\nStarting geocoding... (1 request/second)\n");

  let geocoded = 0;
  let failed = 0;

  for (let i = 0; i < imagesToGeocode.length; i++) {
    const img = imagesToGeocode[i];
    console.log(`[${i + 1}/${imagesToGeocode.length}] Geocoding: ${img.address}`);

    const coords = await geocodeAddress(img.address);

    if (coords.latitude && coords.longitude) {
      img.latitude = coords.latitude;
      img.longitude = coords.longitude;
      geocoded++;
      console.log(`  ✓ Found: ${coords.latitude}, ${coords.longitude}`);
    } else {
      failed++;
      console.log(`  ✗ Failed to geocode`);
    }

    // Save progress every 50 images
    if ((i + 1) % 50 === 0) {
      fs.writeFileSync(dataPath, JSON.stringify(images, null, 2));
      console.log(`\n💾 Progress saved: ${geocoded} geocoded, ${failed} failed\n`);
    }

    // Wait 1 second between requests (Nominatim rate limit)
    if (i < imagesToGeocode.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Final save
  fs.writeFileSync(dataPath, JSON.stringify(images, null, 2));

  console.log(`\n✅ Geocoding complete!`);
  console.log(`   Geocoded: ${geocoded}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total with coords: ${alreadyGeocoded + geocoded}/${images.length}`);
}

geocodeExistingImages().catch(console.error);
