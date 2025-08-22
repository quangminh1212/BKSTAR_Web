import fs from 'node:fs';
import path from 'node:path';

const SNAP_DIR = path.resolve('public', 'snapshot');
const CSS_NAME = '_preview-override.css';
const JS_NAME = '_preview-override.js';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function listHtmlFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.toLowerCase().endsWith('.html'))
    .map((d) => path.join(dir, d.name));
}

function injectAssets(html, preloadHrefs = [], external = false) {
  let out = html;
  if (!out.includes(CSS_NAME)) {
    const preloadTags = preloadHrefs
      .map((href) =>
        external
          ? `    <link rel="preload" as="font" type="font/woff2" href="${href}" crossorigin>`
          : `    <link rel="preload" as="font" type="font/woff2" href="${href}">`
      )
      .join('\n');
    const preconnect = external
      ? `    <link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n`
      : '';
    const linkTag = `\n    <!-- preview-only font preload/override -->\n${preconnect}${preloadTags ? preloadTags + '\n' : ''}    <link rel="stylesheet" href="${CSS_NAME}">\n`;
    const headIdx = out.toLowerCase().lastIndexOf('</head>');
    out = headIdx >= 0 ? out.slice(0, headIdx) + linkTag + out.slice(headIdx) : linkTag + out;
  }
  if (!out.includes(JS_NAME)) {
    const scriptTag = `\n    <script defer src="${JS_NAME}"></script>\n`;
    const bodyIdx = out.toLowerCase().lastIndexOf('</body>');
    out = bodyIdx >= 0 ? out.slice(0, bodyIdx) + scriptTag + out.slice(bodyIdx) : out + scriptTag;
  }
  return out;
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
  const allowStyles = (process.env.PRELOAD_STYLES || 'normal,italic')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const allowWeights = (process.env.PRELOAD_WEIGHTS || '300,400,500,600,700,800')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n));
  let mm;
  while ((mm = faceRe.exec(css)) !== null) {
    const style = mm[1] || 'normal';
    const weight = parseInt(mm[2], 10) || 400;
    if (!allowStyles.includes(style) || !allowWeights.includes(weight)) continue;
    entries.push({ style, weight, url: mm[3] });
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
  const theme = buildThemeCss();
  return {
    css: `/* Preview-only (self-host) */\n${faces.join('\n')}\n${body}\n${theme}\n`,
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
      const faceRe =
        /@font-face\s*{[^}]*?font-style:\s*(normal|italic);[^}]*?font-weight:\s*(\d+)[^}]*?src:[^}]*?url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)[^}]*?}/gms;
      const allowStyles = (process.env.PRELOAD_STYLES || 'normal,italic')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const allowWeights = (process.env.PRELOAD_WEIGHTS || '300,400,500,600,700,800')
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n));
      let m;
      const s = new Set();
      while ((m = faceRe.exec(css)) !== null) {
        const style = m[1] || 'normal';
        const weight = parseInt(m[2], 10) || 400;
        if (!allowStyles.includes(style) || !allowWeights.includes(weight)) continue;
        s.add(m[3]);
      }
      preloads = Array.from(s);
    }
  } catch {
    // ignore preload build failure; fallback still works via @import
  }
  const theme = buildThemeCss();
  const css = `/* Preview-only typography override: do NOT use in CI */\n@import url('${api}');\n\nhtml, body, body * {\n  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,\n    Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif !important;\n}\n\nbody {\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\n${theme}\n`;
  return { css, preloads, external: true };
}

function buildThemeCss() {
  return `/* Global light/dark theme and soft UI refinements */
:root{--bg:#f8fafc;--text:#0b1220;--muted:#465569;--card:#ffffff;--border:#e5e7eb;--link:#0b5ed7;--link-hover:#094db3;--elev:0 8px 24px rgba(0,0,0,.06)}
html[data-theme="dark"]{--bg:#0b1220;--text:#e5e7eb;--muted:#94a3b8;--card:#0f172a;--border:#1f2937;--link:#60a5fa;--link-hover:#93c5fd}
html,body{background:var(--bg)!important;color:var(--text)!important}
a{color:var(--link)!important}
a:hover{color:var(--link-hover)!important}
hr,.divider{border-color:var(--border)!important}
/* soften common blocks when opted-in to avoid layout side-effects */
.theme-soft :where(section,article,.card,.widget,.elementor-widget,.elementor-container,.elementor-section,.site-main>*){
  background-color:var(--card);border-color:var(--border);border-radius:12px}
/* standard content width */
.theme-soft :where(.elementor-section .elementor-container,.site-main,.container){
  max-width:1200px;margin-left:auto;margin-right:auto;padding-left:16px;padding-right:16px}
/* images and typography safety */
.theme-soft img{max-width:100%;height:auto;display:block}
.theme-soft :where(h1,h2,h3){color:var(--text)}
.theme-soft :where(p,li){color:var(--muted)}
/* spacing normalize */
.theme-soft main{line-height:1.65}
/* dark scrollbars */
html[data-theme="dark"] ::-webkit-scrollbar{width:12px;height:12px}
html[data-theme="dark"] ::-webkit-scrollbar-thumb{background:#334155;border-radius:10px}
/* toggle button */
#__dm_toggle{position:fixed;z-index:99999;top:16px;right:16px;width:40px;height:40px;border-radius:999px;background:var(--card);color:var(--text);border:1px solid var(--border);box-shadow:var(--elev);cursor:pointer;display:flex;align-items:center;justify-content:center}
#__dm_toggle:focus{outline:2px solid var(--link);outline-offset:2px}
/* if placed inside header, anchor it within header top-right */
header, .elementor-location-header, .site-header{position:relative}
header #__dm_toggle, .elementor-location-header #__dm_toggle, .site-header #__dm_toggle{position:absolute;top:10px;right:16px}
`;
}

async function main() {
  if (!fs.existsSync(SNAP_DIR)) {
    console.error('Snapshot dir not found:', SNAP_DIR);
    process.exit(1);
  }

  // Write/overwrite CSS + JS files (override + dark mode toggle)
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
  // Write JS toggle script
  const js = `(()=>{const KEY='theme';function pref(){try{const s=localStorage.getItem(KEY);if(s==='light'||s==='dark')return s;}catch(e){}return 'light'}
function apply(t){document.documentElement.setAttribute('data-theme',t)}
function setBtn(t){const b=document.getElementById('__dm_toggle');if(!b)return;b.setAttribute('aria-pressed',String(t==='dark'));b.textContent=t==='dark'?'☀️':'🌙'}
function toggle(){const cur=document.documentElement.getAttribute('data-theme')||pref();const nxt=cur==='dark'?'light':'dark';apply(nxt);setBtn(nxt);try{localStorage.setItem(KEY,nxt)}catch(e){}}
function init(){const t=(()=>{try{return localStorage.getItem(KEY)||pref()}catch(e){return pref()}})();apply(t);document.body&&document.body.classList.add('theme-soft');const btn=document.createElement('button');btn.id='__dm_toggle';btn.type='button';btn.title='Toggle theme';btn.setAttribute('aria-label','Toggle theme');btn.setAttribute('aria-pressed',String(t==='dark'));btn.textContent=t==='dark'?'☀️':'🌙';btn.addEventListener('click',toggle);document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='j'){toggle()}});const header=document.querySelector('header, .elementor-location-header, .site-header');(header||document.body||document.documentElement).appendChild(btn)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();})();`;
  fs.writeFileSync(path.join(SNAP_DIR, JS_NAME), js, 'utf8');

  const files = listHtmlFiles(SNAP_DIR);
  let changed = 0;
  for (const f of files) {
    const html = fs.readFileSync(f, 'utf8');
    const out = injectAssets(html, result.preloads || [], result.external);
    if (out !== html) {
      fs.writeFileSync(f, out, 'utf8');
      changed += 1;
      console.log('Injected preview override into', path.basename(f));
    }
  }
  console.log('Preview override injection done. Files changed:', changed);
}

main();
