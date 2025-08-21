import fs from 'node:fs';
import path from 'node:path';

const SNAP_DIR = path.resolve('public', 'snapshot');
const CSS_NAME = '_preview-override.css';

const CSS_CONTENT = `/* Preview-only typography override: do NOT use in CI */
html, body, body * {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif !important;
}

body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`;

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

function main() {
  if (!fs.existsSync(SNAP_DIR)) {
    console.error('Snapshot dir not found:', SNAP_DIR);
    process.exit(1);
  }

  // Write/overwrite CSS file
  ensureDir(SNAP_DIR);
  fs.writeFileSync(path.join(SNAP_DIR, CSS_NAME), CSS_CONTENT, 'utf8');

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
