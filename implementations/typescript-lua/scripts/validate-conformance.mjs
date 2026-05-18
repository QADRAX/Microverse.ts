import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const implRoot = path.resolve(__dirname, '..');
const metaRoot = path.resolve(implRoot, '../..');
const specSchemaPath = path.join(
  implRoot,
  'packages',
  'surface-spec',
  'schemas',
  'surface-spec.schema.json',
);
const vectorsDir = path.join(metaRoot, 'conformance', 'vectors');
const goldenDir = path.join(vectorsDir, 'golden');

async function loadJson(filePath) {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function collectJsonFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsonFiles(full)));
    } else if (entry.name.endsWith('.json') && !entry.name.startsWith('.')) {
      files.push(full);
    }
  }
  return files;
}

function stableStringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function main() {
  const schema = await loadJson(specSchemaPath);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  const vectorFiles = await collectJsonFiles(vectorsDir);
  let failed = false;

  for (const file of vectorFiles.sort()) {
    const doc = await loadJson(file);
    const rel = path.relative(metaRoot, file);
    if (!validate(doc)) {
      console.error(`FAIL schema: ${rel}`);
      console.error(validate.errors);
      failed = true;
    } else {
      console.log(`OK schema: ${rel}`);
    }
  }

  const goldenFiles = await collectJsonFiles(goldenDir).catch(() => []);
  const snapshotPath = path.join(goldenDir, '.export-snapshots.json');
  let snapshots = {};
  try {
    snapshots = await loadJson(snapshotPath);
  } catch {
    if (goldenFiles.length > 0) {
      console.error('Missing golden/.export-snapshots.json — run pnpm run conformance:export');
      failed = true;
    }
  }

  for (const file of goldenFiles.filter((f) => !f.endsWith('.export-snapshots.json'))) {
    const rel = path.relative(goldenDir, file);
    const doc = await loadJson(file);
    const expected = snapshots[rel];
    if (expected === undefined) {
      console.error(`FAIL snapshot: no entry for golden/${rel} in .export-snapshots.json`);
      failed = true;
      continue;
    }
    const actual = stableStringify(doc);
    const expectedStr = stableStringify(expected);
    if (actual !== expectedStr) {
      console.error(`FAIL snapshot: golden/${rel} differs from .export-snapshots.json`);
      failed = true;
    } else {
      console.log(`OK snapshot: golden/${rel}`);
    }
  }

  if (failed) {
    process.exit(1);
  }
  console.log('Conformance validation passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
