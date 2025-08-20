import scrape from 'website-scraper';
import path from 'node:path';
import fs from 'node:fs';

const TARGET_URL = 'https://bkstar.com.vn/';
const OUT_DIR = path.resolve('public', 'snapshot');

// Danh sách trang cần snapshot (whitelist)
const WHITELIST_PATHS = [
  '/',
  '/ve-bkstar/',
  '/why-bkstar/',
  '/dich-vu/',
  '/tai-nguyen/',
  '/thanh-tich-va-su-kien/',
  '/bao-chi/',
  '/tuyen-dung/',
  '/faq/',
];
const URLS = WHITELIST_PATHS.map((p) => new URL(p, TARGET_URL).href);

async function snapshot() {
  if (fs.existsSync(OUT_DIR)) {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
  }

  await scrape({
    urls: URLS,
    directory: OUT_DIR,
    request: {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36',
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      },
    },
    subdirectories: [
      { directory: 'assets', extensions: ['.css', '.js'] },
      { directory: 'images', extensions: ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.ico'] },
      { directory: 'fonts', extensions: ['.woff', '.woff2', '.ttf', '.eot'] },
    ],
    sources: [
      { selector: 'img', attr: 'src' },
      { selector: 'link[rel="stylesheet"]', attr: 'href' },
      { selector: 'script', attr: 'src' },
      { selector: 'link[rel="icon"]', attr: 'href' },
      { selector: 'link[rel="apple-touch-icon"]', attr: 'href' },
      { selector: 'a', attr: 'href' },
    ],
    recursive: true,
    maxDepth: 3,
    prettifyUrls: true,
    urlFilter: (url) => {
      // Chỉ giữ tài nguyên cùng domain và CDN phổ biến (wordpress, wp-content, s.w.org)
      try {
        const u = new URL(url, TARGET_URL);
        const host = u.hostname;
        if (host.endsWith('bkstar.com.vn')) return true;
        if (host.endsWith('s.w.org')) return true;
        if (host.includes('wp-content') || host.includes('wp-includes')) return true;
        return false;
      } catch {
        return false;
      }
    },
  });

  // Đổi tên file index tải về thành index-snapshot.html để khỏi đè
  const indexPath = path.join(OUT_DIR, 'index.html');
  const snapshotPath = path.join(OUT_DIR, 'index-snapshot.html');
  if (fs.existsSync(indexPath)) {
    fs.renameSync(indexPath, snapshotPath);
  }

  console.log('Snapshot xong:', snapshotPath);
}

snapshot().catch((e) => {
  console.error(e);
  process.exit(1);
});
