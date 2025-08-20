import fs from 'node:fs';
import path from 'node:path';

const SNAP_DIR = path.resolve('public', 'snapshot');
const ASSETS_DIR = path.join(SNAP_DIR, 'assets');
const FONTS_DIR = path.join(SNAP_DIR, 'fonts');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function unique(arr) {
  return Array.from(new Set(arr));
}

async function download(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(outPath, Buffer.from(buf));
}

function findCssFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...findCssFiles(fp));
    else if (e.isFile() && fp.endsWith('.css')) files.push(fp);
  }
  return files;
}

async function processCssFile(cssPath) {
  let css = fs.readFileSync(cssPath, 'utf8');
  const urlRegex = /url\(([^)]+)\)/g; // captures raw inside url()
  const fontUrls = [];
  let m;
  while ((m = urlRegex.exec(css)) !== null) {
    let raw = m[1].trim();
    if (raw.startsWith('data:')) continue; // skip embedded
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      raw = raw.slice(1, -1);
    }
    const ext = raw.split('?')[0].split('#')[0].toLowerCase();
    if (
      ext.endsWith('.woff2') ||
      ext.endsWith('.woff') ||
      ext.endsWith('.ttf') ||
      ext.endsWith('.eot')
    ) {
      // Only remote URLs
      if (/^https?:\/\//i.test(raw)) {
        fontUrls.push(raw);
      }
    }
  }
  const uniqueUrls = unique(fontUrls);
  if (!uniqueUrls.length) return { cssPath, changed: false, count: 0 };

  ensureDir(FONTS_DIR);
  let changed = false;
  for (const fu of uniqueUrls) {
    const baseName = path.basename(fu.split('?')[0].split('#')[0]);
    const outPath = path.join(FONTS_DIR, baseName);
    if (!fs.existsSync(outPath)) {
      try {
        console.log('Downloading font:', fu);
        await download(fu, outPath);
      } catch (e) {
        console.warn('Skip font (download failed):', fu, e.message);
        continue;
      }
    }
    const rel = path.relative(path.dirname(cssPath), outPath).replace(/\\/g, '/');
    // Replace all occurrences of the URL (with or without quotes) with the relative path
    const patterns = [fu, `'${fu}'`, `"${fu}"`];
    for (const p of patterns) {
      if (css.includes(p)) {
        css = css.split(p).join(rel);
        changed = true;
      }
    }
  }
  if (changed) {
    fs.writeFileSync(cssPath, css, 'utf8');
  }
  return { cssPath, changed, count: uniqueUrls.length };
}

async function main() {
  ensureDir(FONTS_DIR);
  const cssFiles = findCssFiles(ASSETS_DIR);
  let totalFonts = 0;
  let changedFiles = 0;
  for (const cssPath of cssFiles) {
    const res = await processCssFile(cssPath);
    if (res.changed) changedFiles += 1;
    totalFonts += res.count || 0;
  }
  console.log(
    `Postprocess fonts done. CSS files: ${cssFiles.length}, changed: ${changedFiles}, font URLs processed: ${totalFonts}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
