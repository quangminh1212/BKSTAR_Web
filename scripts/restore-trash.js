#!/usr/bin/env node
/*
  Restore files from public/.trash back to public/
  - Default: restore from the latest timestamp folder
  - Options:
    --ts=<timestamp-folder-name>  Restore from a specific timestamp under public/.trash
    --overwrite                   Overwrite if destination exists (default: skip existing)
*/

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('.');
const PUB = path.join(ROOT, 'public');
const TRASH = path.join(PUB, '.trash');

function log(...args) {
  console.log('[restore:trash]', ...args);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { ts: null, overwrite: false };
  for (const a of args) {
    if (a.startsWith('--ts=')) out.ts = a.slice(5);
    if (a === '--overwrite') out.overwrite = true;
    if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

async function listDirs(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true }).catch(() => []);
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function getLatestTs(dir) {
  const names = await listDirs(dir);
  if (names.length === 0) return null;
  // Names are ISO-ish timestamps made safe by replacing [:.] with -;
  // last modified time is more reliable for ordering
  const stats = await Promise.all(
    names.map(async (n) => ({ name: n, mtime: (await fsp.stat(path.join(dir, n))).mtimeMs }))
  );
  stats.sort((a, b) => b.mtime - a.mtime);
  return stats[0].name;
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function* walk(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) yield* walk(p);
    else yield p;
  }
}

async function restoreFrom(tsName, overwrite) {
  const srcRoot = path.join(TRASH, tsName);
  if (!fs.existsSync(srcRoot)) {
    throw new Error(`Trash timestamp not found: ${tsName}`);
  }
  let restored = 0;
  for await (const srcFile of walk(srcRoot)) {
    const rel = path.relative(srcRoot, srcFile);
    const dest = path.join(PUB, rel);
    await ensureDir(path.dirname(dest));
    if (fs.existsSync(dest) && !overwrite) {
      log('skip exists', rel);
      continue;
    }
    await fsp.rename(srcFile, dest).catch(async () => {
      // cross-device fallback: copy then remove
      await fsp.copyFile(srcFile, dest);
      await fsp.rm(srcFile, { force: true });
    });
    restored++;
  }
  // Try removing empty ts folder
  try {
    await fsp.rm(srcRoot, { recursive: true, force: true });
  } catch {
    // ignore errors when removing trash timestamp folder
  }
  log(`restored ${restored} files from ${tsName}${overwrite ? ' (overwritten)' : ''}`);
}

async function main() {
  const args = parseArgs();
  if (args.help) {
    console.log('Usage: node scripts/restore-trash.js [--ts=<timestamp>] [--overwrite]');
    process.exit(0);
  }
  if (!fs.existsSync(TRASH)) {
    log('no public/.trash found');
    return;
  }
  const ts = args.ts || (await getLatestTs(TRASH));
  if (!ts) {
    log('no trash timestamp folders to restore');
    return;
  }
  await restoreFrom(ts, args.overwrite);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

