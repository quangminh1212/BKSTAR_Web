import fs from 'node:fs';
import path from 'node:path';

const SNAP_DIR = path.resolve('public', 'snapshot');

function listHtmlFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.toLowerCase().endsWith('.html'))
    .map((d) => path.join(dir, d.name));
}

function extractCanonicalSlug(html) {
  // Tìm <link rel="canonical" href="https://bkstar.com.vn/<slug>/">
  const m = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  if (!m) return null;
  try {
    const u = new URL(m[1]);
    let p = u.pathname;
    if (p.endsWith('/')) p = p.slice(0, -1);
    if (p === '') return 'index-snapshot';
    return p.split('/').filter(Boolean).pop();
  } catch {
    return null;
  }
}

function buildRenamePlan() {
  const files = listHtmlFiles(SNAP_DIR);
  const plan = [];
  for (const f of files) {
    const base = path.basename(f);
    if (base === 'index-snapshot.html') continue; // giữ trang chủ
    if (!/^index_\d+\.html$/i.test(base)) continue; // chỉ đổi các file index_*.html cho đơn giản
    const html = fs.readFileSync(f, 'utf8');
    const slug = extractCanonicalSlug(html);
    if (!slug) continue;
    const target = path.join(SNAP_DIR, `${slug}.html`);
    if (fs.existsSync(target)) {
      // Nếu đã có file cùng slug (bản bài viết riêng), bỏ qua để tránh ghi đè
      continue;
    }
    plan.push({ from: f, to: target, slug, base });
  }
  return plan;
}

function updateReferences(files, renames) {
  // Tạo map: oldBaseName -> newBaseName
  const map = new Map();
  for (const r of renames) map.set(path.basename(r.from), path.basename(r.to));
  let changedCount = 0;
  for (const f of files) {
    let html = fs.readFileSync(f, 'utf8');
    let changed = false;
    for (const [oldName, newName] of map.entries()) {
      if (html.includes(oldName)) {
        html = html.split(oldName).join(newName);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(f, html, 'utf8');
      changedCount += 1;
    }
  }
  return changedCount;
}

function main() {
  if (!fs.existsSync(SNAP_DIR)) {
    console.error('Snapshot dir not found:', SNAP_DIR);
    process.exit(1);
  }
  const renames = buildRenamePlan();
  if (!renames.length) {
    console.log('Không có file cần đổi tên.');
    return;
  }
  const allHtml = listHtmlFiles(SNAP_DIR);
  // Cập nhật tham chiếu trước khi rename để tránh bỏ lỡ
  const changed = updateReferences(allHtml, renames);
  for (const r of renames) {
    fs.renameSync(r.from, r.to);
    console.log('Đổi tên:', path.basename(r.base), '→', path.basename(r.to));
  }
  console.log(`Đã cập nhật ${changed} file HTML với tham chiếu mới.`);
}

main();
