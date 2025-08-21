import fs from 'node:fs';
import path from 'node:path';

const SNAP_DIR = path.resolve('public', 'snapshot');

function listHtmlFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.toLowerCase().endsWith('.html'))
    .map((d) => path.join(dir, d.name));
}

function ensureSrcAttributes(html) {
  // Nếu thẻ img có data-lazy-src hoặc data-src mà thiếu src thì thêm src
  html = html.replace(/<img([^>]*?)>/gi, (m, attrs) => {
    const hasSrc = /\ssrc=(["']).+?\1/i.test(attrs);
    const lazy = /\sdata-lazy-src=(["'])(.+?)\1/i.exec(attrs);
    const dataSrc = /\sdata-src=(["'])(.+?)\1/i.exec(attrs);
    const dataSrcset = /\sdata-srcset=(["'])(.+?)\1/i.exec(attrs);
    let newAttrs = attrs;

    if (!hasSrc) {
      const val = (lazy && lazy[2]) || (dataSrc && dataSrc[2]);
      if (val) newAttrs += ` src="${val}"`;
    }
    // Nếu có data-srcset mà chưa có srcset, thêm srcset (ưu tiên data-srcset)
    const hasSrcset = /\ssrcset=(["']).+?\1/i.test(attrs);
    if (!hasSrcset && dataSrcset) {
      newAttrs += ` srcset="${dataSrcset[2]}"`;
    }
    return `<img${newAttrs}>`;
  });
  return html;
}

function main() {
  if (!fs.existsSync(SNAP_DIR)) {
    console.error('Snapshot dir not found:', SNAP_DIR);
    process.exit(1);
  }
  const files = listHtmlFiles(SNAP_DIR);
  let changed = 0;
  for (const f of files) {
    const html = fs.readFileSync(f, 'utf8');
    const fixed = ensureSrcAttributes(html);
    if (fixed !== html) {
      fs.writeFileSync(f, fixed, 'utf8');
      changed += 1;
      console.log('Fixed lazy images in', path.basename(f));
    }
  }
  console.log('Lazy image fix done. Files changed:', changed);
}

main();
