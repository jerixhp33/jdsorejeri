const sharp = require('sharp');

const iconSvg = `
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" rx="64" fill="#0A0A0A" />
  <circle cx="128" cy="128" r="90" fill="#FFFFFF" />
  <text x="110" y="145" font-family="Arial, sans-serif" font-size="70" font-weight="900" fill="#0A0A0A" text-anchor="middle" letter-spacing="-5">J</text>
  <text x="145" y="145" font-family="Arial, sans-serif" font-size="70" font-weight="300" fill="#0A0A0A" text-anchor="middle" letter-spacing="-5">D</text>
</svg>
`;

// Monochrome mask for Android badge. White graphic on transparent background.
const badgeSvg = `
<svg width="96" height="96" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <text x="110" y="155" font-family="Arial, sans-serif" font-size="100" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="-5">J</text>
  <text x="160" y="155" font-family="Arial, sans-serif" font-size="100" font-weight="300" fill="#FFFFFF" text-anchor="middle" letter-spacing="-5">D</text>
</svg>
`;

async function generate() {
  await sharp(Buffer.from(iconSvg))
    .resize(192, 192)
    .png()
    .toFile('./public/icon-192x192.png');

  await sharp(Buffer.from(iconSvg))
    .resize(512, 512)
    .png()
    .toFile('./public/icon-512x512.png');

  await sharp(Buffer.from(badgeSvg))
    .resize(96, 96)
    .png()
    .toFile('./public/badge-96x96.png');
    
  console.log('Icons generated successfully.');
}

generate();
