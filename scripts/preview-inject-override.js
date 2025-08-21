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

function injectLink(html) {
  if (html.includes(CSS_NAME)) return html;
  const linkTag = `\n    <!-- preview-only font override -->\n    <link rel="stylesheet" href="${CSS_NAME}">\n`;
  const idx = html.toLowerCase().lastIndexOf('</head>');
  if (idx >= 0) {
    return html.slice(0, idx) + linkTag + html.slice(idx);
  }
  // Fallback: append at beginning
  return linkTag + html;
}

async function buildCssSelfHost() {
  // Fetch Google CSS and download woff2 files, then emit local @font-face rules
  const api = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  const res = await fetch(api, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error('Failed to fetch Google Fonts CSS');
  const css = await res.text();
  const urlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g;
  const urls = new Set();
  let m;
  while ((m = urlRegex.exec(css)) !== null) urls.add(m[1]);
  const fontDir = path.join(SNAP_DIR, 'fonts', 'inter');
  ensureDir(fontDir);
  const faces = [];
  for (const u of urls) {
    const base = path.basename(u.split('?')[0]);
    const out = path.join(fontDir, base);
    if (!fs.existsSync(out)) {
      const r = await fetch(u);
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(out, buf);
    }
    // Infer weight from filename pattern (wght)
    const weight = /bold|700/.test(base)
      ? 700
      : /600/.test(base)
        ? 600
        : /500/.test(base)
          ? 500
          : 400;
    const localRel = `fonts/inter/${base}`;
    faces.push(
      `@font-face{font-family:'Inter';font-style:normal;font-weight:${weight};font-display:swap;src:url('${localRel}') format('woff2');}`
    );
  }
  const body = `html, body, body * {font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif !important;}
body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}`;
  return `/* Preview-only (self-host) */\n${faces.join('\n')}\n${body}\n`;
}

function buildCssCdn() {
  return `/* Preview-only typography override: do NOT use in CI */\n@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');\n\nhtml, body, body * {\n  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,\n    Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif !important;\n}\n\nbody {\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n`;
}

async function main() {
  if (!fs.existsSync(SNAP_DIR)) {
    console.error('Snapshot dir not found:', SNAP_DIR);
    process.exit(1);
  }

  // Write/overwrite CSS file
  ensureDir(SNAP_DIR);
  const selfHost = process.env.SELF_HOST_INTER === '1';
  let css;
  try {
    css = selfHost ? await buildCssSelfHost() : buildCssCdn();
  } catch (e) {
    console.warn('Self-host fetch failed, fallback to CDN import:', e.message);
    css = buildCssCdn();
  }
  fs.writeFileSync(path.join(SNAP_DIR, CSS_NAME), css, 'utf8');

  const files = listHtmlFiles(SNAP_DIR);
  let changed = 0;
  for (const f of files) {
    const html = fs.readFileSync(f, 'utf8');
    const out = injectLink(html);
    if (out !== html) {
      fs.writeFileSync(f, out, 'utf8');
      changed += 1;
      console.log('Injected preview override into', path.basename(f));
    }
  }
  console.log('Preview override injection done. Files changed:', changed);
}

main();
