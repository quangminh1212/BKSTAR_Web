import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

// Config
let VIEWPORT = { width: 1440, height: 900 };
let CONFIG_ROUTES = [
  '/',
  '/ve-bkstar/',
  '/dich-vu/',
  '/tai-nguyen/',
  '/thanh-tich-va-su-kien/',
  '/bao-chi/',
  '/tuyen-dung/',
  '/faq/',
];
try {
  const cfgPath = path.resolve('scripts', 'visual-config.json');
  if (fs.existsSync(cfgPath)) {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    if (cfg.viewport) VIEWPORT = cfg.viewport;
    if (Array.isArray(cfg.routes)) CONFIG_ROUTES = cfg.routes;
    globalThis.__VISUAL_CFG__ = cfg; // lưu để dùng ở dưới
  }
} catch {}

const LIVE_BASE =
  process.env.LIVE_BASE || globalThis.__VISUAL_CFG__?.liveBase || 'https://bkstar.com.vn';
const LOCAL_PORT = process.env.LOCAL_PORT || '5173';
const LOCAL_BASE = `http://localhost:${LOCAL_PORT}/snapshot/`;
const SNAPSHOT_DIR = path.resolve('public', 'snapshot');
const OUT_DIR = path.resolve('visual-diff');

// Mask theo route để bỏ qua vùng động đặc thù (có thể override qua visual-config.json)
let ROUTE_MASKS = {
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
    '.elementor-post__thumbnail',
    '.elementor-post__title',
    '.elementor-post__excerpt',
    '.elementor-post__meta-data',
    '.elementor-post__read-more',
    '.elementor-page-title',
    '.elementor-heading-title',
    '.elementor-archive-title',
    '.page-title',
    '.page-header',
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
    '.elementor-widget-slides',
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
    '.elementor-background-slideshow',
    '.elementor-motion-effects-container',
    '.elementor-motion-effects-layer',
    '.marquee-container',
    '.elementor-widget-elementor-news-ticker',
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
    '.elementor-post__thumbnail',
    '.elementor-post__title',
    '.elementor-post__excerpt',
    '.elementor-post__meta-data',
    '.elementor-post__read-more',
    'footer .elementor-widget-posts',
    'footer .eael-post-grid',
    'footer .elementor-posts-container',
    'footer .elementor-post',
    'footer .elementor-widget-video',
    'footer .nf-form-cont',
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
    '.elementor-widget-slides',
    '.elementor-background-slideshow',
    '.elementor-motion-effects-container',
    '.elementor-motion-effects-layer',
    '.elementor-animated-headline',
    '.elementor-widget-animated-headline',
    '.elementor-post__thumbnail',
    '.elementor-post__title',
    '.elementor-post__excerpt',
    '.elementor-post__meta-data',
    '.elementor-post__read-more',
  ],
};

// Ngưỡng cho phép (pixel khác) theo route/section để đánh giá PASS/FAIL
let ROUTE_THRESHOLDS = {
  '/': 50000,
  '/ve-bkstar/': 350000,
  '/dich-vu/': 600000,
  '/tai-nguyen/': 700000,
  '/thanh-tich-va-su-kien/': 50000,
  '/bao-chi/': 400000,
  '/tuyen-dung/': 500000,
  '/tuyen-dung-3/': 700000,
  '/faq/': 400000,
};
let SECTION_THRESHOLDS = {
  '/dich-vu/#form': 2000000,
  '/tai-nguyen/#header-contest': 200000,
  '/tai-nguyen/#ticker': 200000,
  '/tai-nguyen/#post-grid': 200000,
  '/tai-nguyen/#footer': 50000,
  '/thanh-tich-va-su-kien/#grid': 120000,
};
try {
  const cfgPath = path.resolve('scripts', 'visual-config.json');
  if (fs.existsSync(cfgPath)) {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    if (cfg.thresholds) ROUTE_THRESHOLDS = cfg.thresholds;
    if (cfg.sectionThresholds) SECTION_THRESHOLDS = cfg.sectionThresholds;
    if (cfg.routeMasks) ROUTE_MASKS = cfg.routeMasks;
  }
} catch {}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function resetDir(dir) {
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      fs.rmSync(path.join(dir, f), { recursive: true, force: true });
    }
  } else {
    fs.mkdirSync(dir, { recursive: true });
  }
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
  async function gotoWithRetry(targetUrl, attempts = 3) {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
      try {
        await page.goto(targetUrl, { waitUntil: 'load', timeout: 90000 });
        return;
      } catch (e) {
        lastErr = e;
        await sleep(800 + i * 800);
      }
    }
    throw lastErr;
  }
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
  await gotoWithRetry(url, 3);
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
    /* Ổn định scrollbar để tránh lệch bề rộng do thanh cuộn */
    html { scrollbar-gutter: stable both-edges; }
    body { overflow-y: scroll !important; }
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
        } catch {}
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
          // Nếu có clipHeight: đưa phần tử lên đỉnh viewport và chụp vùng cố định từ y=0
          if (clipHeight != null) {
            await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, Math.floor(box.y)));
            await sleep(120);
            const clip = {
              x: 0,
              y: 0,
              width: VIEWPORT.width,
              height: Math.min(VIEWPORT.height, Math.max(1, clipHeight)),
            };
            await page.screenshot({ path: outPath, clip });
            return;
          }
          const clip = {
            x: Math.max(0, Math.floor(box.x)),
            y: Math.max(0, Math.floor(box.y)),
            width: Math.ceil(Math.min(box.width, VIEWPORT.width)),
            height: Math.ceil(Math.min(VIEWPORT.height, box.height)),
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
    const fileBase = `${name}-${s.key}`;
    const lOut = path.join(OUT_DIR, 'live', `${fileBase}.png`);
    const lcOut = path.join(OUT_DIR, 'local', `${fileBase}.png`);
    const dOut = path.join(OUT_DIR, 'diff', `${fileBase}.png`);
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
      const key = `${route}#${s.key}`;
      const threshold = SECTION_THRESHOLDS[key] ?? ROUTE_THRESHOLDS[route] ?? 300000;
      const status = mm <= threshold ? 'PASS' : 'FAIL';
      console.log(`So sánh ${name}/${s.key}: pixel khác = ${mm}`);
      summary.push({
        route: key,
        name,
        sectionKey: s.key,
        fileBase,
        mismatch: mm,
        threshold,
        status,
      });
    } catch (e) {
      console.warn(`Bỏ qua section ${s.key}:`, e.message);
      summary.push({
        route: `${route}#${s.key}`,
        name,
        sectionKey: s.key,
        error: e.message,
        status: 'ERROR',
      });
    }
  }
}

async function main() {
  ensureDir(OUT_DIR);
  resetDir(path.join(OUT_DIR, 'live'));
  resetDir(path.join(OUT_DIR, 'local'));
  resetDir(path.join(OUT_DIR, 'diff'));

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  // Xây map canonical -> file local
  const canonicalMap = buildCanonicalMap(SNAPSHOT_DIR);
  const ROUTES = process.env.PAGES_ONLY === '1' ? CONFIG_ROUTES : Array.from(canonicalMap.keys());

  const summary = [];
  for (const route of ROUTES) {
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
    const cfgGlobalMask = globalThis.__VISUAL_CFG__?.globalMask;
    const globalMask = cfgGlobalMask ?? [
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
      '.elementor-widget-slides',
      '.elementor-widget-marquee',
      '.elementor-countdown',
      '.elementor-widget-video',
      '.elementor-widget-portfolio',
      '.eael-post-carousel',
      '.eael-gallery',
      '.eael-instafeed',
      // Cookie/captcha/admin bars
      '#cookie-notice',
      '.cookie-notice',
      '#cn-notice',
      '.grecaptcha-badge',
      '#wpadminbar',
      '.elementor-sticky--effects',
      // Các vùng chia sẻ/bình luận/điều hướng bài viết gây nhiễu
      '.elementor-share-buttons',
      '.elementor-widget-share-buttons',
      '.elementor-social-icons',
      '.share',
      '.post-share',
      '.comments-area',
      '.comment-respond',
      '.elementor-post-navigation',
      '.related-posts',
      '.elementor-related-posts',
      '.entry-content',
      '.elementor-widget-theme-post-content',
      '.elementor-post-info',
      '.entry-meta',
      '.post-meta',
      // Header/Footer wrappers (nhiều thành phần động)
      'header',
      '.elementor-location-header',
      '.site-header',
      'footer',
      '.elementor-location-footer',
      '.site-footer',
    ];
    const maskSelectors = Array.from(new Set([...globalMask, ...routeMasks]));
    const clampSelectors = globalThis.__VISUAL_CFG__?.clampSelectors ?? [
      '.elementor-widget-posts',
      '.eael-post-grid',
      '.entry-content',
      '.elementor-widget-theme-post-content',
    ];

    await screenshotPage(page, liveUrl, liveOut, { maskSelectors, clampSelectors });
    await screenshotPage(page, localUrl, localOut, { maskSelectors, clampSelectors });

    try {
      const mismatch = compareImages(liveOut, localOut, diffOut);
      const threshold = ROUTE_THRESHOLDS[route] ?? 300000;
      const status = mismatch <= threshold ? 'PASS' : 'FAIL';
      console.log(`So sánh ${name}: pixel khác = ${mismatch}`);
      summary.push({ route, name, fileBase: name, mismatch, threshold, status });
    } catch (e) {
      console.warn(`Lỗi so sánh ${name}:`, e.message);
      summary.push({ route, name, fileBase: name, error: e.message, status: 'ERROR' });
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
            '.elementor-widget-posts',
            '.eael-post-grid',
            '.elementor-posts-container',
            '.elementor-post__thumbnail',
            '.elementor-post__title',
            '.elementor-post__excerpt',
            '.elementor-post__meta-data',
            '.elementor-post__read-more',
          ],
          clipHeight: 600,
        },
        {
          key: 'footer',
          sel: 'footer',
          clipHeight: 400,
          mask: ['footer', '.elementor-location-footer', '.site-footer'],
        },
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
          {
            key: 'top-ticker',
            sel: '.news-ticker-wrap, .marquee-container',
            clipHeight: 300,
            mask: [
              '.news-ticker-wrap',
              '.marquee-container',
              '.elementor-widget-elementor-news-ticker',
            ],
          },
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
            mask: [
              '.nf-form-cont',
              '.nf-response-msg',
              '.nf-error-msg',
              '.nf-form-errors',
              '.nf-loading-spinner',
            ],
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
            mask: [
              '.elementor-widget-posts',
              '.eael-post-grid',
              '.elementor-posts-container',
              '.elementor-post',
              '.elementor-post__thumbnail',
              '.elementor-post__title',
              '.elementor-post__excerpt',
              '.elementor-post__meta-data',
              '.elementor-post__read-more',
            ],
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
  // Tạo báo cáo HTML tổng hợp
  const totals = computeTotals(summary);
  const html = generateHtmlReport(summary, totals);
  const htmlPath = path.join(OUT_DIR, 'report.html');
  fs.writeFileSync(htmlPath, html);
  console.log('Đã tạo báo cáo:', reportPath);
  console.log('Đã tạo báo cáo HTML:', htmlPath);
  if (process.env.STRICT === '1' && (totals.FAIL > 0 || totals.ERROR > 0)) {
    console.error(`STRICT mode: Có ${totals.FAIL} FAIL và ${totals.ERROR} ERROR.`);
    process.exitCode = 2;
  }
}

function computeTotals(summary) {
  const totals = { PASS: 0, FAIL: 0, ERROR: 0, SKIPPED: 0 };
  for (const s of summary) {
    const st = s.status || (s.error ? 'ERROR' : s.skipped ? 'SKIPPED' : '');
    if (st && totals[st] !== undefined) totals[st] += 1;
  }
  return totals;
}

function generateHtmlReport(summary, totals) {
  const rows = summary.map((s) => {
    const file = s.fileBase ? s.fileBase + '.png' : '';
    const linkCell = s.fileBase
      ? `<a href="live/${file}">live</a> | <a href="local/${file}">local</a> | <a href="diff/${file}">diff</a>`
      : '';
    const mismatch = s.mismatch ?? '';
    const threshold = s.threshold ?? '';
    const status = s.status ?? (s.error ? 'ERROR' : s.skipped ? 'SKIPPED' : '');
    const cls = status ? ` class="${status}"` : '';
    return `<tr${cls}><td>${s.route}</td><td>${mismatch}</td><td>${threshold}</td><td>${status}</td><td>${linkCell}</td></tr>`;
  });
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>Visual diff report</title>
<style>
body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:16px}
 table{border-collapse:collapse;width:100%}
 th,td{border:1px solid #ddd;padding:6px 8px;font-size:14px}
 th{background:#f5f5f5;text-align:left}
 tr:nth-child(even){background:#fafafa}
 .PASS{color:#0a0;font-weight:600}
 .FAIL{color:#a00;font-weight:600}
 .ERROR{color:#a60;font-weight:600}
 .SKIPPED{color:#666}
 .summary{margin:8px 0 16px; font-size:14px}
 .summary b{margin-right:12px}
</style>
</head>
<body>
<h1>Visual diff report</h1>
<div class="summary">
  <b class="PASS">PASS: ${totals.PASS}</b>
  <b class="FAIL">FAIL: ${totals.FAIL}</b>
  <b class="ERROR">ERROR: ${totals.ERROR}</b>
  <b class="SKIPPED">SKIPPED: ${totals.SKIPPED}</b>
</div>
<table>
<thead><tr><th>Route/Section</th><th>Mismatch(px)</th><th>Threshold</th><th>Status</th><th>Images</th></tr></thead>
<tbody>
${rows.join('\n')}
</tbody>
</table>
</body>
</html>`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
