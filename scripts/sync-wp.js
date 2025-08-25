#!/usr/bin/env node
/*
  Đồng bộ nội dung từ https://bkstar.com.vn/ (WP REST API) về local dạng tĩnh
  - Tải tất cả bài viết thuộc các chuyên mục: news(27+26), competitions(12), blog(1), achievements(4)
  - Lưu HTML bài viết vào public/posts/<category>/<slug>.html
  - Tải ảnh cover + ảnh trong nội dung về public/images/posts/<slug>/
  - Sinh manifest public/posts.json để trang chủ render cards trỏ tới trang local
*/

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WP_BASE = 'https://bkstar.com.vn/wp-json/wp/v2';
const OUT_DIR = path.resolve(__dirname, '../public');
const POSTS_DIR = path.join(OUT_DIR, 'posts');
const IMAGES_DIR = path.join(OUT_DIR, 'images', 'posts');

const FORCE = process.argv.includes('--force') || process.env.SYNC_FORCE === '1';

const CATEGORIES = {
  news: [27, 26],
  competitions: [12],
  blog: [1],
  achievements: [4],
};

// Bản đồ ánh xạ link bài viết live -> link local
const LIVE_TO_LOCAL = new Map();

function log(msg) {
  process.stdout.write(msg + '\n');
}

async function wpFetchJson(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error('WP fetch failed: ' + url + ' => ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchAllPostsByCategory(catId) {
  const perPage = 100; // WP max
  let page = 1;
  const all = [];
  for (;;) {
    const url =
      `${WP_BASE}/posts?per_page=${perPage}&page=${page}&categories=${catId}` +
      `&_fields=link,slug,date,title,excerpt,content,jetpack_featured_media_url`;
    const batch = await wpFetchJson(url);
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < perPage) break;
    page++;
  }
  return all;
}

function stripHtml(html) {
  const text = (html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text;
}

function ensureExtFromUrl(url) {
  const u = new URL(url);
  const ext = path.extname(u.pathname) || '.jpg';
  return ext.split('?')[0] || '.jpg';
}

async function downloadTo(url, filepath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  await fs.writeFile(filepath, buf);
}

function sanitizeLiveUrl(href) {
  try {
    const u = new URL(href, 'https://bkstar.com.vn');
    if (u.hostname && !/bkstar\.com\.vn$/i.test(u.hostname)) return null;
    // remove trailing slash
    u.hash = '';
    let s = u.toString();
    s = s.replace(/#.*$/, '').replace(/\/$/, '');
    return s;
  } catch {
    return null;
  }
}

function replaceImgSrcs(html, replacer) {
  return (html || '').replace(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi, (m, src) => {
    const local = replacer(src);
    return m.replace(src, local || src);
  });
}

function postTemplate({ title, date, content, relCss = '/src/styles.css' }) {
  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} – BKSTAR</title>
    <link rel="stylesheet" href="${relCss}" />
  </head>
  <body>
    <header style="padding:16px 0;border-bottom:1px solid #e5e7eb">
      <div class="container"><a href="/" class="nav-link" style="text-decoration:none;color:#046bd2">← Trang chủ</a></div>
    </header>
    <main class="container" style="padding:40px 0">
      <article class="post">
        <h1 style="margin-bottom:8px">${escapeHtml(title)}</h1>
        <time style="color:#64748b">${formatDate(date)}</time>
        <div class="entry-content" style="margin-top:24px">${content}</div>
      </article>
    </main>
  </body>
</html>`;
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}

async function processCategory(catKey, catIds) {
  log(`\n=== Category: ${catKey} (${catIds.join(',')}) ===`);
  const posts = [];
  for (const catId of catIds) {
    const batch = await fetchAllPostsByCategory(catId);
    posts.push(...batch);
  }
  // Dedupe by slug
  const map = new Map();
  for (const p of posts) {
    map.set(p.slug, p);
  }
  const unique = Array.from(map.values());
  log(`Fetched ${unique.length} posts`);

  const manifestItems = [];

  for (const p of unique) {
    const slug = p.slug;
    const title = stripHtml(p.title?.rendered || '');
    const excerpt = stripHtml(p.excerpt?.rendered || '')
      .replace(/\s+\[.*?\]$/, '')
      .trim();
    const date = p.date;

    const postFolder = path.join(IMAGES_DIR, slug);
    await fs.mkdir(postFolder, { recursive: true });

    // cover image
    let localCover = '';
    if (p.jetpack_featured_media_url) {
      try {
        const ext = ensureExtFromUrl(p.jetpack_featured_media_url);
        localCover = path.join('images', 'posts', slug, `cover${ext}`);
        await downloadTo(p.jetpack_featured_media_url, path.join(OUT_DIR, localCover));
      } catch (e) {
        log(`[warn] cover failed ${slug}: ${e.message}`);
        localCover = '';
      }
    }

    // content & inline images
    let content = p.content?.rendered || '';
    const imgUrls = new Set();
    content.replace(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi, (_, src) => {
      try {
        const u = new URL(src, 'https://bkstar.com.vn');
        if (/\/wp-content\//.test(u.pathname)) imgUrls.add(u.href);
      } catch {
        // Ignore invalid URLs
      }
      return _;
    });

    const localMap = new Map();
    for (const url of imgUrls) {
      try {
        const ext = ensureExtFromUrl(url);
        const filename = path.basename(new URL(url).pathname).split('.')[0];
        const localRel = path.join('images', 'posts', slug, `${filename}${ext}`);
        await downloadTo(url, path.join(OUT_DIR, localRel));
        localMap.set(url, '/' + localRel.replace(/\\/g, '/'));
      } catch (e) {
        log(`[warn] inline img failed ${slug}: ${e.message}`);
      }
    }

    content = replaceImgSrcs(content, (src) => localMap.get(src) || src);

    // write post html
    const postHtmlRel = path.join('posts', catKey, `${slug}.html`).replace(/\\/g, '/');
    const postHtmlAbs = path.join(OUT_DIR, postHtmlRel);
    await fs.mkdir(path.dirname(postHtmlAbs), { recursive: true });
    await fs.writeFile(postHtmlAbs, postTemplate({ title, date, content }), 'utf8');

    // Lưu ánh xạ từ link live -> link local (dùng để thay thế trong excerpt/content nếu có)
    const liveLink = sanitizeLiveUrl(p.link);
    if (liveLink) {
      LIVE_TO_LOCAL.set(liveLink, '/' + postHtmlRel);
    }

    manifestItems.push({
      title,
      date,
      excerpt,
      url: '/' + postHtmlRel,
      image: localCover ? '/' + localCover.replace(/\\/g, '/') : '',
      localImage: localCover ? '/' + localCover.replace(/\\/g, '/') : '',
      slug,
    });
  }

  // sort by date desc
  manifestItems.sort((a, b) => new Date(b.date) - new Date(a.date));
  return manifestItems;
}

async function main() {
  log('Sync WP -> local...');
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(POSTS_DIR, { recursive: true });
  await fs.mkdir(IMAGES_DIR, { recursive: true });

  const result = {};
  for (const [key, ids] of Object.entries(CATEGORIES)) {
    result[key] = await processCategory(key, ids);
  }

  const manifestPath = path.join(OUT_DIR, 'posts.json');
  await fs.writeFile(manifestPath, JSON.stringify(result, null, 2), 'utf8');

  // Duyệt tất cả file HTML đã tạo để thay thế mọi anchor/link sang local nếu trỏ về bkstar.com.vn
  for (const [catKey] of Object.entries(CATEGORIES)) {
    const dir = path.join(POSTS_DIR, catKey);
    try {
      const files = await fs.readdir(dir);
      for (const f of files) {
        if (!f.endsWith('.html')) continue;
        const abs = path.join(dir, f);
        let html = await fs.readFile(abs, 'utf8');
        // Thay thế <a href="https://bkstar.com.vn/..."> -> href="/posts/..."
        html = html.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi, (m, href) => {
          const live = sanitizeLiveUrl(href);
          const local = live ? LIVE_TO_LOCAL.get(live) : null;
          if (local) return m.replace(href, local);
          return m;
        });
        await fs.writeFile(abs, html, 'utf8');
      }
    } catch {}
  }

  log(`\nWrote manifest: ${manifestPath}`);
  log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
