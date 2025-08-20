import fs from 'node:fs';
import path from 'node:path';

const SNAP_DIR = path.resolve('public', 'snapshot');

const slugMap = new Map([
  ['index_1.html', 've-bkstar.html'],
  ['index_2.html', 'why-bkstar.html'],
  ['index_3.html', 'dich-vu.html'],
  ['index_4.html', 'tai-nguyen.html'],
  ['index_5.html', 'thanh-tich-va-su-kien.html'],
  ['index_6.html', 'bao-chi.html'],
  ['index_7.html', 'tuyen-dung.html'],
  ['index_8.html', 'faq.html'],
]);

function replaceLinksInHtml(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [oldName, newName] of slugMap.entries()) {
    if (html.includes(oldName)) {
      html = html.split(oldName).join(newName);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, html);
    console.log('Updated links in', path.basename(filePath));
  }
}

function run() {
  const entries = fs.readdirSync(SNAP_DIR, { withFileTypes: true });
  for (const e of entries) {
    if (e.isFile() && e.name.endsWith('.html')) {
      replaceLinksInHtml(path.join(SNAP_DIR, e.name));
    }
  }
}

run();
