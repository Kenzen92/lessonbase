#!/usr/bin/env node
// Validates every package in package-lock.json was published at least DAYS ago.
// Protects against fast-follow supply-chain attacks on transitive dependencies.
// Run: npm run check:ages

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const DAYS = 7;
const CONCURRENCY = 8;
const REGISTRY = 'https://registry.npmjs.org';
const cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);

const lock = JSON.parse(readFileSync(resolve(__dir, '../package-lock.json'), 'utf8'));

// Collect unique name@version pairs from lockfile
const pkgMap = new Map();
for (const [key, meta] of Object.entries(lock.packages ?? {})) {
  if (!key || !meta.version || meta.link) continue;
  const parts = key.split('node_modules/');
  const name = parts.at(-1);
  if (!pkgMap.has(name)) pkgMap.set(name, meta.version);
}

const packages = [...pkgMap.entries()];
console.log(`Checking ${packages.length} packages against ${DAYS}-day freshness rule...`);

function registryUrl(name) {
  if (name.startsWith('@')) {
    const slash = name.indexOf('/');
    return `${REGISTRY}/${name.slice(0, slash)}%2F${name.slice(slash + 1)}`;
  }
  return `${REGISTRY}/${encodeURIComponent(name)}`;
}

async function getPublishTime(name, version) {
  try {
    const res = await fetch(registryUrl(name), {
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const ts = data?.time?.[version];
    return ts ? new Date(ts) : null;
  } catch {
    return null;
  }
}

const violations = [];
let checked = 0;

for (let i = 0; i < packages.length; i += CONCURRENCY) {
  const batch = packages.slice(i, i + CONCURRENCY);
  const results = await Promise.all(
    batch.map(async ([name, version]) => {
      const published = await getPublishTime(name, version);
      checked++;
      process.stdout.write(`\r  ${checked}/${packages.length}`);
      if (published && published > cutoff) return { name, version, published };
      return null;
    })
  );
  violations.push(...results.filter(Boolean));
}

process.stdout.write('\n');

if (violations.length > 0) {
  console.error('\n\x1b[31mBLOCKED: packages published less than 7 days ago:\x1b[0m');
  for (const { name, version, published } of violations) {
    const age = ((Date.now() - published) / 86_400_000).toFixed(1);
    console.error(`  \x1b[33m${name}@${version}\x1b[0m  (${age} days old, ${published.toISOString()})`);
  }
  process.exit(1);
}

console.log(`\x1b[32m✓ All ${packages.length} packages are at least ${DAYS} days old.\x1b[0m`);
