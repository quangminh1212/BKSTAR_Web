#!/usr/bin/env node
/*
  Clean old trash directories in public/.trash
  - Default keep days: 7 (override by env TRASH_MAX_AGE_DAYS)
  - Remove folders older than cutoff by last-modified time (mtime)
*/

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const TRASH_DIR = path.resolve('public', '.trash');
const DAYS = Number(process.env.TRASH_MAX_AGE_DAYS || 7);
const NOW = Date.now();
const CUT_MS = NOW - DAYS * 24 * 60 * 60 * 1000;

function log(...args) {
  console.log('[clean:trash]', ...args);
}

async function rmrf(p) {
  await fsp.rm(p, { recursive: true, force: true });
}

async function main() {
  if (!fs.existsSync(TRASH_DIR)) {
    log('no .trash directory, skip');
    return;
  }

  const entries = await fsp.readdir(TRASH_DIR, { withFileTypes: true });
  let removed = 0;
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const p = path.join(TRASH_DIR, ent.name);
    try {
      const st = await fsp.stat(p);
      const mtimeMs = st.mtimeMs;
      if (mtimeMs < CUT_MS) {
        await rmrf(p);
        removed++;
      }
    } catch (e) {
      // if error reading stat, attempt remove
      await rmrf(p);
      removed++;
    }
  }
  log(`removed ${removed} directories older than ${DAYS} days`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

