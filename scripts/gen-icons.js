import sharp from 'sharp';
import path from 'node:path';

const SRC_SVG = path.resolve('images', 'logo.svg');
const OUT_192 = path.resolve('images', 'logo-192.png');
const OUT_512 = path.resolve('images', 'logo-512.png');

async function run() {
  try {
    await sharp(SRC_SVG).png({ quality: 90 }).resize(192, 192, { fit: 'contain' }).toFile(OUT_192);
    await sharp(SRC_SVG).png({ quality: 90 }).resize(512, 512, { fit: 'contain' }).toFile(OUT_512);
    console.log('Generated icons:', OUT_192, OUT_512);
  } catch (e) {
    console.error('Failed to generate icons:', e.message);
    process.exit(1);
  }
}

run();

