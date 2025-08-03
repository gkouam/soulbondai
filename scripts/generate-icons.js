const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate a simple gradient background with a heart shape
async function generateIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#gradient)" rx="${size * 0.15}" />
      <path d="M ${size/2} ${size * 0.25}
               C ${size * 0.35} ${size * 0.15}, ${size * 0.15} ${size * 0.2}, ${size * 0.15} ${size * 0.35}
               C ${size * 0.15} ${size * 0.5}, ${size * 0.3} ${size * 0.65}, ${size/2} ${size * 0.8}
               C ${size * 0.7} ${size * 0.65}, ${size * 0.85} ${size * 0.5}, ${size * 0.85} ${size * 0.35}
               C ${size * 0.85} ${size * 0.2}, ${size * 0.65} ${size * 0.15}, ${size/2} ${size * 0.25} Z"
            fill="white" />
    </svg>
  `;

  const buffer = Buffer.from(svg);
  
  await sharp(buffer)
    .png()
    .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
    
  console.log(`Generated icon-${size}x${size}.png`);
}

// Generate maskable icon (with safe area padding)
async function generateMaskableIcon(size) {
  const padding = size * 0.1; // 10% padding for safe area
  const innerSize = size - (padding * 2);
  
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#gradient)" />
      <g transform="translate(${padding}, ${padding})">
        <path d="M ${innerSize/2} ${innerSize * 0.25}
                 C ${innerSize * 0.35} ${innerSize * 0.15}, ${innerSize * 0.15} ${innerSize * 0.2}, ${innerSize * 0.15} ${innerSize * 0.35}
                 C ${innerSize * 0.15} ${innerSize * 0.5}, ${innerSize * 0.3} ${innerSize * 0.65}, ${innerSize/2} ${innerSize * 0.8}
                 C ${innerSize * 0.7} ${innerSize * 0.65}, ${innerSize * 0.85} ${innerSize * 0.5}, ${innerSize * 0.85} ${innerSize * 0.35}
                 C ${innerSize * 0.85} ${innerSize * 0.2}, ${innerSize * 0.65} ${innerSize * 0.15}, ${innerSize/2} ${innerSize * 0.25} Z"
              fill="white" />
      </g>
    </svg>
  `;

  const buffer = Buffer.from(svg);
  
  await sharp(buffer)
    .png()
    .toFile(path.join(iconsDir, `maskable-icon-${size}x${size}.png`));
    
  console.log(`Generated maskable-icon-${size}x${size}.png`);
}

// Main function
async function generateAllIcons() {
  console.log('Generating PWA icons...');
  
  // Generate regular icons
  for (const size of sizes) {
    await generateIcon(size);
  }
  
  // Generate maskable icons for key sizes
  await generateMaskableIcon(192);
  await generateMaskableIcon(512);
  
  // Generate apple-touch-icon
  await generateIcon(180);
  fs.renameSync(
    path.join(iconsDir, 'icon-180x180.png'),
    path.join(iconsDir, 'apple-touch-icon.png')
  );
  console.log('Generated apple-touch-icon.png');
  
  // Generate favicon-32x32
  await generateIcon(32);
  fs.renameSync(
    path.join(iconsDir, 'icon-32x32.png'),
    path.join(iconsDir, 'favicon-32x32.png')
  );
  console.log('Generated favicon-32x32.png');
  
  // Generate favicon-16x16
  await generateIcon(16);
  fs.renameSync(
    path.join(iconsDir, 'icon-16x16.png'),
    path.join(iconsDir, 'favicon-16x16.png')
  );
  console.log('Generated favicon-16x16.png');
  
  console.log('All icons generated successfully!');
}

// Run the script
generateAllIcons().catch(console.error);