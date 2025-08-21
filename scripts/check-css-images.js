import fs from 'node:fs';
import path from 'node:path';

const SNAP_DIR = path.resolve('public', 'snapshot');

function listCssFiles() {
  const out = [];
  const stack = [SNAP_DIR];
  while (stack.length) {
    const dir = stack.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && e.name.toLowerCase().endsWith('.css')) out.push(p);
    }
  }
  return out;
}

function extractUrls(css) {
  const urls = new Set();
  const re = /url\(([^)]+)\)/gi;
  let m;
  while ((m = re.exec(css))) {
    let u = m[1].trim().replace(/^["']|["']$/g, '');
    if (!u || u.startsWith('data:')) continue;
    urls.add(u);
  }
  return Array.from(urls);
}

async function headOk(url) {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    return res.ok;
  } catch {
    return false;
  }
}

function toLocal(url) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return `http://localhost:5173${url}`;
  return `http://localhost:5173/snapshot/${url}`;
}

async function main() {
  if (!fs.existsSync(SNAP_DIR)) {
    console.error('Snapshot dir not found:', SNAP_DIR);
    process.exit(1);
  }
  const files = listCssFiles();
  const bad = [];
  for (const f of files) {
    const css = fs.readFileSync(f, 'utf8');
    const urls = extractUrls(css);
    for (const u of urls) {
      const target = toLocal(u);
      const ok = await headOk(target);
      if (!ok) bad.push({ file: path.relative(SNAP_DIR, f), url: u, local: target });
    }
  }
  if (bad.length === 0) {
    console.log('All CSS images reachable.');
  } else {
    console.log('Unreachable CSS images:');
    for (const r of bad.slice(0, 50)) console.log('-', r.file, '->', r.local);
    if (bad.length > 50) console.log(`... and ${bad.length - 50} more`);
    process.exitCode = 2;
  }
}

main();
