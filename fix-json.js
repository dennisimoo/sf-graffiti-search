const fs = require('fs');

console.log('Reading corrupted JSON file...');
const content = fs.readFileSync('data/processed-images.json', 'utf-8');

// Try to find the last complete entry by looking for the last occurrence of "},"
let lastValidPos = content.lastIndexOf('  },\n  {');

if (lastValidPos === -1) {
  lastValidPos = content.lastIndexOf('}');
}

// Find the closing brace after that
const closingPos = content.indexOf('}', lastValidPos + 1);

if (closingPos !== -1) {
  // Extract valid JSON up to this point
  const validContent = content.substring(0, closingPos + 1) + '\n]';

  // Try to parse it
  try {
    const data = JSON.parse(validContent);
    console.log(`✅ Recovered ${data.length} valid entries`);

    // Backup corrupted file
    fs.writeFileSync('data/processed-images.json.backup', content);
    console.log('💾 Backed up corrupted file to processed-images.json.backup');

    // Write fixed file
    fs.writeFileSync('data/processed-images.json', JSON.stringify(data));
    console.log('✅ Fixed JSON file saved');

  } catch (e) {
    console.error('❌ Could not parse recovered JSON:', e.message);
  }
} else {
  console.error('❌ Could not find valid JSON structure');
}
