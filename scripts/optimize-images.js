import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const POSTS_DIR = path.resolve('images', 'posts');
const HERO_DIR = path.resolve('images');

async function ensureWebp(inputPath, maxWidth) {
  const ext = path.extname(inputPath).toLowerCase();
  const base = inputPath.slice(0, -ext.length);
  const webpPath = `${base}.webp`;

  try {
    const img = sharp(inputPath);
    const meta = await img.metadata();
    const targetWidth = Math.min(meta.width ?? maxWidth, maxWidth);

    await img
      .resize({ width: targetWidth, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(webpPath);

    return { inputPath, webpPath, width: targetWidth };
  } catch (e) {
    console.error('optimize failed:', inputPath, e.message);
    return null;
  }
}

async function run() {
  const heroCandidates = fs
    .readdirSync(HERO_DIR)
    .filter((f) => /^slide\d+\.(jpe?g|png)$/i.test(f))
    .map((f) => path.join(HERO_DIR, f));

  const postCandidates = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .map((f) => path.join(POSTS_DIR, f));

  const tasks = [];
  heroCandidates.forEach((p) => tasks.push(ensureWebp(p, 1600)));
  postCandidates.forEach((p) => tasks.push(ensureWebp(p, 1200)));

  const results = await Promise.all(tasks);
  const ok = results.filter(Boolean);
  console.log('Optimized ->', ok.length, 'files');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

