import dotenv from "dotenv";
import fs from "fs";
import Replicate from "replicate";
import path from "path";

dotenv.config();

// Simple CSV parser
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = lines[i].split(',');
    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[header.trim()] = values[index]?.trim() || '';
    });

    records.push(record);
  }

  return records;
}

interface GraffitiPhoto {
  noid: string;
  service_request_id: string;
  cdn_url: string;
  full_address: string;
  comment: string;
  locationonbuilding: string;
  actiontaken: string;
  street: string;
  addressnumber: string;
}

interface ProcessedImage {
  id: string;
  url: string;
  address: string;
  location: string;
  originalComment: string;
  aiTitle: string;
  aiAnalysis: string;
  metadata: string; // Combined text for searching
  latitude?: number;
  longitude?: number;
}

// Initialize Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function analyzeImage(imageUrl: string): Promise<{ title: string; description: string }> {
  try {
    let fullResponse = "";

    // Use Gemini 3 Flash to analyze the graffiti image
    for await (const event of replicate.stream("google/gemini-3-flash", {
      input: {
        prompt:
          "You are creating searchable metadata for a graffiti photo database. Focus ONLY on describing the graffiti itself, not the surrounding area or environment.\n\nTITLE: [A short, descriptive 5-10 word title about the graffiti]\n\nDESCRIPTION: [Write 3-4 natural sentences describing ONLY the graffiti artwork. If there is readable text or words that are part of the graffiti, mention what it says. Describe the main colors of the graffiti, the artistic style, what surface the graffiti is painted on, and notable features of the graffiti. Ignore any signs, text, or objects that are NOT part of the graffiti itself. Only describe the actual graffiti art.]",
        images: [imageUrl],
        thinking_level: "low",
      },
    })) {
      fullResponse += event;
    }

    const response = fullResponse.trim();

    // Parse title and description
    const titleMatch = response.match(/TITLE:\s*(.+?)(?:\n|$)/i);
    const descMatch = response.match(/DESCRIPTION:\s*(.+?)$/is);

    const title = titleMatch?.[1]?.trim() || "Graffiti";
    const description = descMatch?.[1]?.trim() || response;

    return { title, description };
  } catch (error) {
    console.error(`Failed for ${imageUrl}:`, error instanceof Error ? error.message : error);
    return { title: "Analysis failed", description: "Could not analyze image" };
  }
}


async function processCSV(limit: number = 10) {
  console.log("Reading CSV file...");

  const csvContent = fs.readFileSync("graffiti-photos.csv", "utf-8");
  const records = parseCSV(csvContent) as unknown as GraffitiPhoto[];

  console.log(`Found ${records.length} total records`);
  console.log(`Processing ${limit} records...`);

  const dataDir = "data";
  const dataPath = path.join(dataDir, "processed-images.json");

  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  // Load existing processed images
  let processedImages: ProcessedImage[] = [];
  if (fs.existsSync(dataPath)) {
    processedImages = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    console.log(`Found ${processedImages.length} already processed images`);
  }

  // Get IDs of already processed images
  const processedIds = new Set(processedImages.map((img) => img.id));

  // Filter to only unprocessed records
  const unprocessedRecords = records.filter(
    (record) => record.cdn_url && !processedIds.has(record.noid),
  );

  console.log(`${unprocessedRecords.length} images remaining to process`);

  const recordsToProcess = unprocessedRecords.slice(0, limit);
  const BATCH_SIZE = 100; // Process 100 per minute
  let processedCount = 0;

  // Process image function
  const processImage = async (record: GraffitiPhoto, idx: number) => {
    try {
      console.log(`[${idx + 1}/${recordsToProcess.length}] Processing: ${record.cdn_url}`);

      const { title, description } = await analyzeImage(record.cdn_url);

      const metadata = `
        Title: ${title}
        Address: ${record.full_address || "Unknown"}
        Location on building: ${record.locationonbuilding || "Unknown"}
        Original comment: ${record.comment || "None"}
        AI Analysis: ${description}
        Action taken: ${record.actiontaken || "None"}
      `.trim();

      const processed = {
        id: record.noid,
        url: record.cdn_url,
        address: record.full_address || "Unknown",
        location: record.locationonbuilding || "Unknown",
        originalComment: record.comment || "",
        aiTitle: title,
        aiAnalysis: description,
        metadata,
      };

      processedImages.push(processed);
      processedCount++;

      // Save progress every 100 images
      if (processedCount % 100 === 0) {
        fs.writeFileSync(dataPath, JSON.stringify(processedImages, null, 2));
        console.log(`Progress saved: ${processedImages.length} images completed`);
      }

      return processed;
    } catch (error) {
      console.error(`Error processing ${record.cdn_url}:`, error);
      return null;
    }
  };

  // Process with simple rate limiting: 600 per minute
  const totalBatches = Math.ceil(recordsToProcess.length / BATCH_SIZE);

  for (let i = 0; i < recordsToProcess.length; i += BATCH_SIZE) {
    const batch = recordsToProcess.slice(i, Math.min(i + BATCH_SIZE, recordsToProcess.length));
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

    console.log(`\n[${batchNumber}/${totalBatches}] Processing ${batch.length} images...`);
    const batchStart = Date.now();

    // Send all 100 requests at once
    const batchPromises = batch.map((record, idx) => processImage(record, i + idx));
    await Promise.all(batchPromises);

    const batchTime = (Date.now() - batchStart) / 1000;
    console.log(`✅ Batch ${batchNumber} complete in ${batchTime.toFixed(1)}s! Total: ${processedImages.length}`);

    // Save progress after each batch
    fs.writeFileSync(dataPath, JSON.stringify(processedImages, null, 2));
  }

  // Final save
  fs.writeFileSync(dataPath, JSON.stringify(processedImages, null, 2));

  console.log(`\n✅ Processing complete! ${processedImages.length} total images`);
  console.log(`Data saved to: ${dataPath}`);

  return processedImages;
}

// Run the script
const limit = process.argv[2] ? parseInt(process.argv[2]) : 10;
processCSV(limit).catch(console.error);
