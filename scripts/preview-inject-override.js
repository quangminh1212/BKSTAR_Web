import fs from 'node:fs';
import path from 'node:path';

const SNAP_DIR = path.resolve('public', 'snapshot');
const CSS_NAME = '_preview-override.css';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function listHtmlFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.toLowerCase().endsWith('.html'))
    .map((d) => path.join(dir, d.name));
}

function injectLink(html, preloadHrefs = [], external = false) {
  if (html.includes(CSS_NAME)) return html;
  const preloadTags = preloadHrefs
    .map((href) =>
      external
        ? `    <link rel="preload" as="font" type="font/woff2" href="${href}" crossorigin>`
        : `    <link rel="preload" as="font" type="font/woff2" href="${href}">`
    )
    .join('\n');
  const linkTag = `\n    <!-- preview-only font preload/override -->\n${preloadTags ? preloadTags + '\n' : ''}    <link rel="stylesheet" href="${CSS_NAME}">\n`;
  const idx = html.toLowerCase().lastIndexOf('</head>');
  if (idx >= 0) {
    return html.slice(0, idx) + linkTag + html.slice(idx);
  }
  // Fallback: append at beginning
  return linkTag + html;
}

async function buildCssSelfHost() {
  // Fetch Google CSS and download woff2 files, then emit local @font-face rules (weights 300–800, normal+italic)
  const api =
    'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap';
  const res = await fetch(api, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error('Failed to fetch Google Fonts CSS');
  const css = await res.text();
  // Parse @font-face to capture style+weight+url
  const faceRe =
    /@font-face\s*{[^}]*?font-style:\s*(normal|italic);[^}]*?font-weight:\s*(\d+)[^}]*?src:[^}]*?url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)[^}]*?}/gms;
  const entries = [];
  let mm;
  while ((mm = faceRe.exec(css)) !== null) {
    entries.push({ style: mm[1] || 'normal', weight: parseInt(mm[2], 10) || 400, url: mm[3] });
  }
  const fontDir = path.join(SNAP_DIR, 'fonts', 'inter');
  ensureDir(fontDir);
  const seen = new Set();
  const faces = [];
  const preloads = [];
  for (const { style, weight, url } of entries) {
    if (seen.has(url)) continue;
    seen.add(url);
    const base = path.basename(url.split('?')[0]);
    const out = path.join(fontDir, base);
    if (!fs.existsSync(out)) {
      const r = await fetch(url);
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(out, buf);
    }
    const localRel = `fonts/inter/${base}`;
    preloads.push(localRel);
    faces.push(
      `@font-face{font-family:'Inter';font-style:${style};font-weight:${weight};font-display:swap;src:url('${localRel}') format('woff2');}`
    );
  }
  const body = `html, body, body * {font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif !important;}
body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}`;
  return {
    css: `/* Preview-only (self-host) */\n${faces.join('\n')}\n${body}\n`,
    preloads,
    external: false,
  };
}

async function buildCssCdn() {
  // Use ital,wght to match self-host coverage
  const api =
    'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap';
  let preloads = [];
  try {
    const res = await fetch(api, { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const css = await res.text();
      const urlRe = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g;
      let m;
      const s = new Set();
      while ((m = urlRe.exec(css)) !== null) s.add(m[1]);
      preloads = Array.from(s);
    }
  } catch {
    // ignore preload build failure; fallback still works via @import
  }
  const css = `/* Preview-only typography override: do NOT use in CI */\n@import url('${api}');\n\nhtml, body, body * {\n  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,\n    Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif !important;\n}\n\nbody {\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n`;
  return { css, preloads, external: true };
}

async function main() {
  if (!fs.existsSync(SNAP_DIR)) {
    console.error('Snapshot dir not found:', SNAP_DIR);
    process.exit(1);
  }

  // Write/overwrite CSS file
  ensureDir(SNAP_DIR);
  const selfHost = process.env.SELF_HOST_INTER === '1';
  let result;
  try {
    result = selfHost ? await buildCssSelfHost() : await buildCssCdn();
  } catch (e) {
    console.warn('Self-host fetch failed, fallback to CDN import:', e.message);
    result = await buildCssCdn();
  }
  fs.writeFileSync(path.join(SNAP_DIR, CSS_NAME), result.css, 'utf8');

  const files = listHtmlFiles(SNAP_DIR);
  let changed = 0;
  for (const f of files) {
    const html = fs.readFileSync(f, 'utf8');
    const out = injectLink(html, result.preloads || [], result.external);
    if (out !== html) {
      fs.writeFileSync(f, out, 'utf8');
      changed += 1;
      console.log('Injected preview override into', path.basename(f));
    }
  }
  console.log('Preview override injection done. Files changed:', changed);
}

main();
