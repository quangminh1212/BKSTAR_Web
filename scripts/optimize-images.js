import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const POSTS_DIR = path.resolve('public', 'images', 'posts');
const HERO_DIR = path.resolve('public', 'images');

function listFilesRecursive(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const ent of entries) {
      const p = path.join(current, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else out.push(p);
    }
  }
  return out;
}

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

  const postCandidates = listFilesRecursive(POSTS_DIR).filter((p) => /\.(jpe?g|png)$/i.test(p));

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
