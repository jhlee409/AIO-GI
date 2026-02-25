const fs = require('fs');
const path = require('path');

// Read the font file
const fontPath = path.join(__dirname, '../public/fonts/NotoSansKR-Regular.ttf');
const fontBuffer = fs.readFileSync(fontPath);

// Convert to base64
const fontBase64 = fontBuffer.toString('base64');

// Create the JS file content
const jsContent = `// Auto-generated font file - NotoSansKR-Regular
const font = '${fontBase64}';
export default font;
`;

// Write to output file
const outputPath = path.join(__dirname, '../lib/fonts/NotoSansKR-Regular-normal.js');

// Create directory if it doesn't exist
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, jsContent);

console.log('Font converted successfully!');
console.log(`Output: ${outputPath}`);
console.log(`Size: ${(fontBase64.length / 1024).toFixed(2)} KB`);
