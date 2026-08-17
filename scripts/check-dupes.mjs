// Run with: node scripts/check-dupes.mjs
// Checks gear-database.ts for duplicate IDs and exits with code 1 if any found.
// Use as a pre-commit check or run before pushing.

import { readFileSync } from 'fs';

const content = readFileSync('src/data/gear-database.ts', 'utf-8');
const idRegex = /^\s+id:\s*"([^"]+)"/gm;
const ids = [];
let match;

while ((match = idRegex.exec(content)) !== null) {
  ids.push(match[1]);
}

const seen = new Map();
const dupes = [];

for (const id of ids) {
  if (seen.has(id)) {
    dupes.push(id);
  } else {
    seen.set(id, true);
  }
}

console.log(`Total items: ${ids.length}`);
console.log(`Unique items: ${seen.size}`);

if (dupes.length > 0) {
  console.error(`\n❌ DUPLICATE IDs FOUND (${dupes.length}):`);
  for (const d of dupes) {
    console.error(`  - ${d}`);
  }
  process.exit(1);
} else {
  console.log('✅ No duplicates found.');
  process.exit(0);
}
