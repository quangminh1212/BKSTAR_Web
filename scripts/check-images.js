import fs from 'node:fs';
import path from 'node:path';

const SNAP_DIR = path.resolve('public', 'snapshot');
const BASE = `http://localhost:${process.env.LOCAL_PORT || '5173'}/snapshot/`;

function listHtml() {
  return fs
    .readdirSync(SNAP_DIR, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.toLowerCase().endsWith('.html'))
    .map((d) => path.join(SNAP_DIR, d.name));
}

function extractImgUrls(html) {
  const urls = new Set();
  // src attributes
  const srcRe = /<img[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = srcRe.exec(html))) {
    const u = m[1].trim();
    if (!u || u.startsWith('data:')) continue;
    urls.add(u);
  }
  // srcset (lấy URL đầu tiên)
  const srcsetRe = /<img[^>]*\ssrcset=["']([^"']+)["'][^>]*>/gi;
  while ((m = srcsetRe.exec(html))) {
    const srcset = m[1].trim();
    const first = srcset.split(',')[0]?.trim().split(' ')[0];
    if (first && !first.startsWith('data:')) urls.add(first);
  }
  // data-lazy-src, data-src
  const lazyRe = /<img[^>]*\sdata-(?:lazy-)?src=["']([^"']+)["'][^>]*>/gi;
  while ((m = lazyRe.exec(html))) {
    const u = m[1].trim();
    if (u) urls.add(u);
  }
  return Array.from(urls);
}

function absolute(url, basePath) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) {
    // absolute site path -> try live host directly
    return url; // will be fetched as absolute path on localhost root? skip later
  }
  return new URL(url, basePath).href;
}

async function headOk(url) {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  if (!fs.existsSync(SNAP_DIR)) {
    console.error('Snapshot dir not found', SNAP_DIR);
    process.exit(1);
  }
  const files = listHtml();
  const report = [];
  for (const f of files) {
    const html = fs.readFileSync(f, 'utf8');
    const rel = path.basename(f);
    const base = new URL(rel, BASE).href;
    const urls = extractImgUrls(html, rel);
    const localUrls = urls
      .map((u) => absolute(u, base))
      .filter((u) => u.startsWith('http://') || u.startsWith('https://'))
      .map((u) => (u.startsWith('/') ? `http://localhost:5173${u}` : u));

    let bad = 0;
    for (const u of localUrls) {
      const ok = await headOk(u);
      if (!ok) {
        report.push({ page: rel, url: u });
        bad += 1;
      }
    }
    if (bad) console.log(`Page ${rel}: ${bad} broken images`);
  }
  if (report.length === 0) {
    console.log('All images seem reachable (HTTP OK).');
  } else {
    console.log('Broken images:');
    for (const r of report.slice(0, 50)) console.log('-', r.page, '->', r.url);
    if (report.length > 50) console.log(`... and ${report.length - 50} more`);
    process.exitCode = 2;
  }
}

main();
