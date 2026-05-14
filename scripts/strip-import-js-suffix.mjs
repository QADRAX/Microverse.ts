import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', 'dist', '.turbo', 'coverage'].includes(e.name)) continue;
      walk(p);
    } else if (
      e.isFile() &&
      (e.name.endsWith('.ts') || e.name.endsWith('.tsx') || e.name.endsWith('.mts')) &&
      !e.name.endsWith('.d.ts')
    ) {
      let c = fs.readFileSync(p, 'utf8');
      const orig = c;
      c = c.replace(/from\s+(['"])(\.{1,2}\/[^'"]+)\.js\1/g, 'from $1$2$1');
      c = c.replace(/(export\s+[^;]+?from\s+)(['"])(\.{1,2}\/[^'"]+)\.js\2/g, '$1$2$3$2');
      if (c !== orig) fs.writeFileSync(p, c);
    }
  }
}

walk(path.join(repoRoot, 'packages'));
if (fs.existsSync(path.join(repoRoot, 'apps'))) walk(path.join(repoRoot, 'apps'));
