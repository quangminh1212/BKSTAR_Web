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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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

async function screenshotPage(page, url, outPath, selector = null) {
  // Chờ tới sự kiện load để ổn định tài nguyên trước khi chụp
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  // Ẩn một số widget động có thể gây sai khác nhỏ
  await page.addStyleTag({
    content: `
    /* Ẩn widget động gây nhiễu */
    #ast-scroll-top, .chaty-widget, #chaty-widget, .astra-cart-drawer, .ast-related-posts { display: none !important; }
    /* Tắt animation/transition để ảnh chụp ổn định */
    *, *::before, *::after { animation: none !important; transition: none !important; }
    /* Dừng marquee/ticker */
    .marquee-content, .fd-elementor-news-ticker { animation: none !important; transform: none !important; }
  `,
  });
  // Đợi ổn định layout: fonts + images + lazy-load
  try {
    await page.evaluate(async () => {
      const timeout = (ms) => new Promise((r) => setTimeout(r, ms));
      const imgs = Array.from(document.images).filter((img) => img.currentSrc || img.src);
      const waitImgs = (async () => {
        await Promise.all(
          imgs.map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((res) => {
                  img.addEventListener('load', res, { once: true });
                  img.addEventListener('error', res, { once: true });
                })
          )
        );
      })();
      await Promise.race([waitImgs, timeout(1500)]);
      if (document.fonts && document.fonts.status !== 'loaded') {
        try {
          await Promise.race([document.fonts.ready, timeout(1200)]);
        } catch (e) {}
      }
    });
  } catch {}
  // Kích hoạt lazy-load bằng cách cuộn hết trang và quay lại đầu
  try {
    const totalHeight = await page.evaluate(
      () => document.body.scrollHeight || document.documentElement.scrollHeight
    );
    let pos = 0;
    while (pos < totalHeight) {
      await page.evaluate((y) => window.scrollTo(0, y), pos);
      await sleep(120);
      pos += 700;
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(250);
  } catch {}
  // Chụp theo viewport hoặc theo element
  if (selector) {
    try {
      await page.waitForSelector(selector, { timeout: 8000, state: 'visible' });
      const el = await page.$(selector);
      if (el) {
        await el.screenshot({ path: outPath });
        return;
      }
    } catch {}
  }
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

    // Nếu là trang /tai-nguyen/, chụp theo section để xác định phần lệch
    if (route === '/tai-nguyen/') {
      const sections = [
        { key: 'header-contest', sel: '.header-contest' },
        { key: 'ticker', sel: '.elementor-widget-elementor-news-ticker, .marquee-container' },
        { key: 'post-grid', sel: '.elementor-widget-posts, .eael-post-grid' },
        { key: 'footer', sel: 'footer' },
      ];
      for (const s of sections) {
        const lOut = path.join(OUT_DIR, 'live', `${name}-${s.key}.png`);
        const lcOut = path.join(OUT_DIR, 'local', `${name}-${s.key}.png`);
        const dOut = path.join(OUT_DIR, 'diff', `${name}-${s.key}.png`);
        try {
          await screenshotPage(page, liveUrl, lOut, s.sel);
          await screenshotPage(page, localUrl, lcOut, s.sel);
          const mm = compareImages(lOut, lcOut, dOut);
          console.log(`So sánh ${name}/${s.key}: pixel khác = ${mm}`);
          summary.push({ route: `${route}#${s.key}`, mismatch: mm });
        } catch (e) {
          console.warn(`Bỏ qua section ${s.key}:`, e.message);
          summary.push({ route: `${route}#${s.key}`, error: e.message });
        }
      }
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
