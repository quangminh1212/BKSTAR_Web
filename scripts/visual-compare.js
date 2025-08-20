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

// Mask theo route để bỏ qua vùng động đặc thù
const ROUTE_MASKS = {
  '/': [
    '.elementor-swiper',
    '.elementor-widget-image-carousel',
    '.image-carousel',
    '.elementor-widget-slides',
    '.elementor-widget-posts',
    '.elementor-posts-container',
    '.wp-block-latest-posts',
    '.eael-post-grid',
    '.elementor-widget-counter',
    '.elementor-widget-marquee',
    '.marquee-container',
    '.elementor-background-slideshow',
    '.elementor-motion-effects-container',
    '.elementor-motion-effects-layer',
    '.elementor-widget-video',
    '.elementor-video',
    '.nf-form-cont',
    '.nf-form-wrap',
    '.nf-form-layout',
    '.nf-form-content',
    '.nf-response-msg',
    '.nf-error-msg',
    '.nf-form-errors',
    '.nf-debug-msg',
    '.nf-loading-spinner',
    '.nf-form-hp',
  ],
  '/bao-chi/': [
    '.elementor-widget-posts',
    '.elementor-posts-container',
    '.wp-block-latest-posts',
    '.eael-post-grid',
    '.eael-post-grid-container',
    '.elementor-post',
    '.elementor-posts',
    '.elementor-loop-container',
    '.elementor-swiper',
    '.elementor-widget-image-carousel',
    '.elementor-widget-portfolio',
    '.elementor-widget-video',
    '.news-ticker-wrap',
    '#fd-ticker-ad9ea0a',
    '.marquee-container',
    '#marquee-content',
  ],
  '/faq/': [
    '.elementor-accordion',
    '.elementor-widget-accordion',
    '.elementor-accordion-item',
    '.elementor-accordion-title',
    '.elementor-accordion-content',
    '.elementor-toggle',
    '.elementor-widget-toggle',
    '.e-n-accordion',
    '.elementor-widget-n-accordion',
    '.eael-adv-accordion',
    '.elementor-widget-eael-adv-accordion',
    '.eael-accordion-list',
    '.eael-accordion-content',
    '.eael-accordion-header',
  ],
  '/thanh-tich-va-su-kien/': [
    '.elementor-widget-posts',
    '.eael-post-grid',
    '.elementor-swiper',
    '.elementor-widget-image-carousel',
    '.elementor-widget-counter',
    '.elementor-widget-video',
  ],
  '/ve-bkstar/': [
    '.elementor-widget-counter',
    '.elementor-widget-video',
    '.elementor-widget-image-carousel',
    '.elementor-swiper',
    '.swiper',
    '.elementor-background-slideshow',
    '.elementor-motion-effects-container',
    '.elementor-motion-effects-layer',
    '.news-ticker-wrap',
    '#fd-ticker-ad9ea0a',
    '.marquee-container',
    '#marquee-content',
    '.image-carousel',
  ],
  '/tuyen-dung/': [
    '.elementor-widget-posts',
    '.elementor-posts-container',
    '.wp-block-latest-posts',
    '.eael-post-grid',
    '.elementor-swiper',
    '.elementor-widget-image-carousel',
    '.elementor-widget-video',
  ],
  '/tai-nguyen/': [
    '.header-contest',
    '.header-contest-list',
    '.elementor-widget-elementor-news-ticker',
    '.marquee-container',
    '.elementor-widget-posts',
    '.eael-post-grid',
    '.elementor-posts-container',
    '.elementor-post',
  ],
  '/dich-vu/': [
    '.nf-form-cont',
    '.nf-form-wrap',
    '.nf-form-layout',
    '.nf-form-content',
    '.ninja-forms-field',
    '.nf-field-element',
    '.nf-form-title',
    '.nf-form-fields-required',
    '.nf-response-msg',
    '.nf-error-msg',
    '.nf-form-errors',
    '.nf-debug-msg',
    '.nf-loading-spinner',
    '.nf-form-hp',
    '.news-ticker-wrap',
    '.marquee-container',
    '.elementor-widget-elementor-news-ticker',
    '.elementor-background-slideshow',
    '.elementor-motion-effects-container',
    '.elementor-motion-effects-layer',
    '.elementor-animated-headline',
    '.elementor-widget-animated-headline',
  ],
};

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

async function screenshotPage(page, url, outPath, opts = {}) {
  let selector = null;
  let maskSelectors = [];
  let clampSelectors = [];
  let clipHeight = null;
  if (typeof opts === 'string') {
    selector = opts;
  } else if (opts && typeof opts === 'object') {
    selector = opts.selector || null;
    maskSelectors = Array.isArray(opts.maskSelectors) ? opts.maskSelectors : [];
    clampSelectors = Array.isArray(opts.clampSelectors) ? opts.clampSelectors : [];
    clipHeight = typeof opts.clipHeight === 'number' ? opts.clipHeight : null;
  }
  // Chờ tới sự kiện load để ổn định tài nguyên trước khi chụp
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  // Ẩn một số widget động có thể gây sai khác nhỏ
  const maskCss = maskSelectors.length
    ? `\n/* Mask vùng động */\n${maskSelectors.map((s) => `${s} { visibility: hidden !important; }`).join('\n')}`
    : '';
  const clampCss = clampSelectors.length
    ? `\n/* Giới hạn chiều cao vùng động để ổn định kích thước */\n${clampSelectors
        .map(
          (s) =>
            `${s} { max-height: ${VIEWPORT.height}px !important; overflow: hidden !important; }`
        )
        .join('\n')}`
    : '';
  await page.addStyleTag({
    content: `
    /* Ẩn widget động gây nhiễu */
    #ast-scroll-top, .chaty-widget, #chaty-widget, .astra-cart-drawer, .ast-related-posts { display: none !important; }
    /* Tắt animation/transition để ảnh chụp ổn định */
    *, *::before, *::after { animation: none !important; transition: none !important; }
    /* Dừng marquee/ticker */
    .marquee-content, .fd-elementor-news-ticker { animation: none !important; transform: none !important; }
    ${maskCss}
    ${clampCss}
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
        await el.scrollIntoViewIfNeeded();
        const box = await el.boundingBox();
        if (box) {
          const clip = {
            x: clipHeight != null ? 0 : Math.max(0, Math.floor(box.x)),
            y: Math.max(0, Math.floor(box.y)),
            width:
              clipHeight != null ? VIEWPORT.width : Math.ceil(Math.min(box.width, VIEWPORT.width)),
            height: Math.ceil(
              clipHeight != null
                ? Math.min(VIEWPORT.height, Math.max(1, clipHeight))
                : Math.min(VIEWPORT.height, box.height)
            ),
          };
          await page.screenshot({ path: outPath, clip });
          return;
        } else {
          // Tránh el.screenshot vì kích thước ảnh có thể khác nhau
          if (clipHeight != null) {
            const clip = {
              x: 0,
              y: 0,
              width: VIEWPORT.width,
              height: Math.min(VIEWPORT.height, Math.max(1, clipHeight)),
            };
            await page.screenshot({ path: outPath, clip });
            return;
          }
          await page.screenshot({ path: outPath, fullPage: false });
          return;
        }
      }
    } catch {}
  }
  // Fallback: nếu có clipHeight nhưng không tìm thấy selector, vẫn chụp khung cố định
  if (clipHeight != null) {
    const clip = {
      x: 0,
      y: 0,
      width: VIEWPORT.width,
      height: Math.min(VIEWPORT.height, Math.max(1, clipHeight)),
    };
    await page.screenshot({ path: outPath, clip });
    return;
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

async function captureSections(page, route, liveUrl, localUrl, name, sections, summary) {
  for (const s of sections) {
    const lOut = path.join(OUT_DIR, 'live', `${name}-${s.key}.png`);
    const lcOut = path.join(OUT_DIR, 'local', `${name}-${s.key}.png`);
    const dOut = path.join(OUT_DIR, 'diff', `${name}-${s.key}.png`);
    try {
      const sectionMasks = Array.isArray(s.mask) ? s.mask : [];
      const clipH = typeof s.clipHeight === 'number' ? s.clipHeight : 600;
      await screenshotPage(page, liveUrl, lOut, {
        selector: s.sel,
        clampSelectors: [s.sel],
        maskSelectors: sectionMasks,
        clipHeight: clipH,
      });
      await screenshotPage(page, localUrl, lcOut, {
        selector: s.sel,
        clampSelectors: [s.sel],
        maskSelectors: sectionMasks,
        clipHeight: clipH,
      });
      const mm = compareImages(lOut, lcOut, dOut);
      console.log(`So sánh ${name}/${s.key}: pixel khác = ${mm}`);
      summary.push({ route: `${route}#${s.key}`, mismatch: mm });
    } catch (e) {
      console.warn(`Bỏ qua section ${s.key}:`, e.message);
      summary.push({ route: `${route}#${s.key}`, error: e.message });
    }
  }
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
    // Mask theo route để bỏ qua vùng động đặc thù + mask chung
    const routeMasks = ROUTE_MASKS[route] || [];
    const globalMask = [
      '.elementor-widget-posts',
      '.elementor-posts-container',
      '.wp-block-latest-posts',
      '.eael-post-grid',
      '.eael-post-grid-container',
      '.elementor-swiper',
      '.swiper',
      '.swiper-container',
      '.swiper-wrapper',
      '.elementor-background-video-container',
      '.elementor-widget-elementor-news-ticker',
      '.marquee-container',
      '.elementor-widget-counter',
      '.elementor-animated-headline',
      '.elementor-widget-countdown',
      '.elementor-countdown',
      '.elementor-widget-video',
      '.elementor-widget-portfolio',
      '.eael-post-carousel',
      '.eael-gallery',
      '.eael-instafeed',
    ];
    const maskSelectors = Array.from(new Set([...globalMask, ...routeMasks]));
    const clampSelectors = ['.elementor-widget-posts', '.eael-post-grid'];

    await screenshotPage(page, liveUrl, liveOut, { maskSelectors, clampSelectors });
    await screenshotPage(page, localUrl, localOut, { maskSelectors, clampSelectors });

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
        {
          key: 'post-grid',
          sel: '.elementor-widget-posts, .eael-post-grid',
          mask: [
            '.elementor-post__thumbnail',
            '.elementor-post__title',
            '.elementor-post__excerpt',
            '.elementor-post__meta-data',
            '.elementor-post__read-more',
          ],
          clipHeight: 600,
        },
        { key: 'footer', sel: 'footer', clipHeight: 400 },
      ];
      await captureSections(page, route, liveUrl, localUrl, name, sections, summary);
    }

    // Section compare cho các trang khác để khoanh vùng hero/khối động
    if (
      route === '/' ||
      route === '/ve-bkstar/' ||
      route === '/dich-vu/' ||
      route === '/tuyen-dung/' ||
      route === '/thanh-tich-va-su-kien/'
    ) {
      const sec = [];
      if (route === '/') {
        sec.push(
          { key: 'hero', sel: 'header, .elementor-location-header', clipHeight: 600 },
          { key: 'top-ticker', sel: '.news-ticker-wrap, .marquee-container', clipHeight: 300 },
          {
            key: 'grid-1',
            sel: '.eael-post-grid, .elementor-widget-posts',
            clipHeight: 600,
            mask: [
              '.elementor-post__thumbnail',
              '.elementor-post__title',
              '.elementor-post__excerpt',
              '.elementor-post__meta-data',
              '.elementor-post__read-more',
            ],
          }
        );
      }
      if (route === '/ve-bkstar/') {
        sec.push(
          {
            key: 'hero',
            sel: '.elementor-background-slideshow, .elementor-motion-effects-container, .elementor-animated-headline',
            clipHeight: 600,
          },
          {
            key: 'grid',
            sel: '.elementor-widget-posts, .eael-post-grid',
            clipHeight: 600,
            mask: ['.elementor-post__thumbnail', '.elementor-post__title'],
          }
        );
      }
      if (route === '/dich-vu/') {
        sec.push(
          { key: 'hero', sel: 'header, .elementor-location-header', clipHeight: 600 },
          {
            key: 'form',
            sel: '.nf-form-cont',
            clipHeight: 600,
            mask: ['.nf-response-msg', '.nf-error-msg', '.nf-form-errors', '.nf-loading-spinner'],
          }
        );
      }
      if (route === '/tuyen-dung/') {
        sec.push(
          { key: 'hero', sel: 'header, .elementor-location-header', clipHeight: 600 },
          {
            key: 'grid',
            sel: '.elementor-widget-posts, .eael-post-grid',
            clipHeight: 600,
            mask: ['.elementor-post__thumbnail', '.elementor-post__title'],
          }
        );
      }
      if (route === '/thanh-tich-va-su-kien/') {
        sec.push(
          { key: 'hero', sel: 'header, .elementor-location-header', clipHeight: 600 },
          {
            key: 'grid',
            sel: '.elementor-widget-posts, .eael-post-grid',
            clipHeight: 600,
            mask: ['.elementor-post__thumbnail', '.elementor-post__title'],
          }
        );
      }
      if (sec.length) {
        await captureSections(page, route, liveUrl, localUrl, name, sec, summary);
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
