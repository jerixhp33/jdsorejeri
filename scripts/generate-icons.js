const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'src', 'app', 'icon.svg');
const publicDir = path.join(__dirname, '..', 'public');

// Ensure public dir exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Background color for the icons
const BACKGROUND_COLOR = '#0a0a0a';

async function generateIcons() {
  try {
    const svgBuffer = fs.readFileSync(svgPath);

    // Generate 192x192 with padding (logo takes up 70% of the canvas)
    await sharp({
      create: {
        width: 192,
        height: 192,
        channels: 4,
        background: BACKGROUND_COLOR
      }
    })
    .composite([
      {
        input: await sharp(svgBuffer).resize(134, 134, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile(path.join(publicDir, 'icon-192x192.png'));

    console.log('Generated icon-192x192.png');

    // Generate 512x512 with padding (logo takes up 70% of the canvas)
    await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: BACKGROUND_COLOR
      }
    })
    .composite([
      {
        input: await sharp(svgBuffer).resize(358, 358, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile(path.join(publicDir, 'icon-512x512.png'));

    console.log('Generated icon-512x512.png');

    // Generate apple-touch-icon (180x180)
    await sharp({
      create: {
        width: 180,
        height: 180,
        channels: 4,
        background: BACKGROUND_COLOR
      }
    })
    .composite([
      {
        input: await sharp(svgBuffer).resize(126, 126, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

    console.log('Generated apple-touch-icon.png');

  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
