import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

// Config
const VIEWPORT = { width: 1440, height: 900 };
const PAGES = [
  '/',
  '/ve-bkstar/',
  '/dich-vu/',
  '/tai-nguyen/',
  '/thanh-tich-va-su-kien/',
  '/bao-chi/',
  '/tuyen-dung/',
  '/faq/',
];

const LIVE_BASE = 'https://bkstar.com.vn';
const LOCAL_BASE = 'http://localhost:5173/snapshot/';
const SNAPSHOT_DIR = path.resolve('public', 'snapshot');
const OUT_DIR = path.resolve('visual-diff');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function buildCanonicalMap(dir) {
  const map = new Map();
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isFile()) continue;
    if (!e.name.endsWith('.html')) continue;
    const fullPath = path.join(dir, e.name);
    const html = fs.readFileSync(fullPath, 'utf8');
    const m = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
    if (m) {
      try {
        const u = new URL(m[1]);
        let p = u.pathname;
        if (!p.endsWith('/')) p += '/';
        map.set(p, e.name);
      } catch {}
    }
  }
  // Trang chủ
  if (!map.has('/')) map.set('/', 'index-snapshot.html');
  return map;
}

async function screenshotPage(page, url, outPath) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  // Ẩn một số widget động có thể gây sai khác nhỏ
  await page.addStyleTag({
    content: `
    #ast-scroll-top, .chaty-widget, #chaty-widget, .astra-cart-drawer, .ast-related-posts { display: none !important; }
  `,
  });
  // Đợi ổn định
  await page.waitForTimeout(1000);
  // Chụp theo viewport để đảm bảo cùng kích thước
  await page.screenshot({ path: outPath, fullPage: false });
}

function compareImages(imgAPath, imgBPath, diffPath) {
  const imgA = PNG.sync.read(fs.readFileSync(imgAPath));
  const imgB = PNG.sync.read(fs.readFileSync(imgBPath));
  const { width, height } = imgA;
  if (width !== imgB.width || height !== imgB.height) {
    throw new Error(`Kích thước ảnh khác nhau: ${imgAPath} vs ${imgBPath}`);
  }
  const diff = new PNG({ width, height });
  const mismatch = pixelmatch(imgA.data, imgB.data, diff.data, width, height, {
    threshold: 0.1,
    includeAA: true,
  });
  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  return mismatch;
}

function sanitize(p) {
  return p.replace(/\//g, '_').replace(/^_+|_+$/g, '') || 'home';
}

async function main() {
  ensureDir(OUT_DIR);
  ensureDir(path.join(OUT_DIR, 'live'));
  ensureDir(path.join(OUT_DIR, 'local'));
  ensureDir(path.join(OUT_DIR, 'diff'));

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();

  // Xây map canonical -> file local
  const canonicalMap = buildCanonicalMap(SNAPSHOT_DIR);

  const summary = [];
  for (const route of PAGES) {
    const name = sanitize(route);
    const liveUrl = new URL(route, LIVE_BASE).href;
    // Tìm file local theo canonical
    const localFile = canonicalMap.get(route) || (route === '/' ? 'index-snapshot.html' : null);
    if (!localFile) {
      console.warn(`Không tìm thấy file local cho route ${route}, bỏ qua.`);
      summary.push({ route, skipped: true, reason: 'missing-local-file' });
      continue;
    }
    const localUrl = new URL(localFile, LOCAL_BASE).href;

    const liveOut = path.join(OUT_DIR, 'live', `${name}.png`);
    const localOut = path.join(OUT_DIR, 'local', `${name}.png`);
    const diffOut = path.join(OUT_DIR, 'diff', `${name}.png`);

    console.log(`Chụp: live=${liveUrl} | local=${localUrl}`);
    await screenshotPage(page, liveUrl, liveOut);
    await screenshotPage(page, localUrl, localOut);

    try {
      const mismatch = compareImages(liveOut, localOut, diffOut);
      console.log(`So sánh ${name}: pixel khác = ${mismatch}`);
      summary.push({ route, mismatch });
    } catch (e) {
      console.warn(`Lỗi so sánh ${name}:`, e.message);
      summary.push({ route, error: e.message });
    }
  }

  await browser.close();

  const reportPath = path.join(OUT_DIR, 'report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify({ timestamp: new Date().toISOString(), summary }, null, 2)
  );
  console.log('Đã tạo báo cáo:', reportPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
