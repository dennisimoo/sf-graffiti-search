# SF Graffiti Semantic Search

AI-powered semantic search for San Francisco graffiti photos. Search by text content, colors, style, location, or visual description.

## Features

- **AI Image Analysis**: Gemini 3 Flash analyzes graffiti photos via Replicate
- **Rich Text Search**: Find images by text, colors, style, location, or any visual detail
- **Local-First**: No database needed - runs entirely on JSON files
- **Fast Processing**: Parallel batch processing (10 images/sec) respects API rate limits
- **Next.js 15**: Modern React with server components

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Create a `.env` file:

```bash
REPLICATE_API_TOKEN=your_token_here
```

Get your token at [replicate.com](https://replicate.com)

### 3. Process Your Graffiti Photos

Place your CSV file with graffiti data in the root as `graffiti-photos.csv`, then:

```bash
# Process first 50 images (takes ~5 seconds with 10/sec batching)
npm run process-csv 50

# Start the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start searching!

## How It Works

### Data Processing

1. **CSV Parsing**: Reads `graffiti-photos.csv` with columns:
   - `cdn_url`: Image URL
   - `full_address`: Location
   - `comment`: City notes
   - `locationonbuilding`: Surface details

2. **AI Analysis**: Gemini 3 Flash analyzes each image and generates:
   - **Title**: Short, descriptive title capturing key visual elements
   - **Description**: Searchable details including readable text/words, colors, style, surface type, and notable features

3. **Local Storage**: Saves to `data/processed-images.json` as searchable JSON

### Searching

Search by:
- **Text content**: "says freedom", "GROWTH"
- **Colors**: "blue and yellow", "red spray paint"
- **Style**: "wildstyle", "throw-up", "mural"
- **Location**: "Mission Street", "brick wall"
- **Combinations**: "colorful piece on fence"

## Processing More Images

The script automatically:
- Skips already-processed images
- Processes in batches of 10 (maxes out 600/min rate limit)
- Saves progress after each batch
- Can be stopped and resumed anytime

```bash
# Process 100 more images (~10 seconds)
npm run process-csv 100

# Process 500 images (~50 seconds)
npm run process-csv 500

# Process all 87,790 images (~2.4 hours)
npm run process-csv 87790
```

## Deployment

### Docker

```bash
# Build image
docker build -t graffiti-search .

# Run container
docker run -p 3000:3000 graffiti-search
```

### Production Tips

1. Process all images locally first
2. Commit the `data/` folder with processed results
3. Deploy to any Node.js host (Vercel, Railway, Fly.io, etc.)
4. No external database needed - everything runs from JSON

## Project Structure

```
├── app/                    # Next.js pages
├── components/             # React components
├── lib/
│   ├── local/
│   │   ├── process-csv.ts      # Image processing script
│   │   └── search.ts           # Search logic
│   └── db/                 # (unused - legacy from original template)
├── data/
│   └── processed-images.json   # Processed graffiti data
├── graffiti-photos.csv     # Your source data
└── .env                    # API tokens
```

## Configuration

### AI Analysis Prompt

Edit `lib/local/process-csv.ts` to customize how Gemini analyzes images:

```typescript
prompt: "Describe this graffiti in 3-4 concise sentences..."
```

### Image CDN

Update `next.config.mjs` to allow your image CDN:

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'your-cdn-domain.com',
    },
  ],
}
```

## Cost Estimates

Replicate Gemini 3 Flash pricing (approximate):
- ~$0.001-0.002 per image analysis
- 100 images ≈ $0.10-0.20
- 1,000 images ≈ $1-2
- 10,000 images ≈ $10-20

## Troubleshooting

**"No data found" error**
- Run `npm run process-csv 10` to process images first

**Rate limit errors**
- The script processes 10 images at a time (maxes out 600/min limit)
- If you hit limits, the script will retry automatically
- Wait 1 minute if you need to restart

**Disk space issues**
- The CSV is 115MB, processed JSON can be 50-100MB+
- Make sure you have 500MB+ free space

**Images not loading**
- Add your CDN hostname to `next.config.mjs`
- Check that `cdn_url` column in CSV is valid

## Credits

Based on [Vercel's Semantic Image Search](https://github.com/vercel-labs/semantic-image-search) template.

Modified to work with:
- Replicate API instead of OpenAI
- Local JSON storage instead of Postgres
- CSV import instead of manual upload
- Gemini 3 Flash for image analysis

## License

MIT
