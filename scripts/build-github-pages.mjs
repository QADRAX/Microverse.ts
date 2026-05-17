/**
 * Builds every Vite app under examples/ with a GitHub Pages base path,
 * merges dist outputs into .github-pages/, and writes a landing index.html.
 *
 * Env:
 *   GITHUB_REPOSITORY — "owner/repo" (defaults to QADRAX/Microverse.ts)
 */
import { execSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const examplesDir = join(repoRoot, 'examples');
const outDir = join(repoRoot, '.github-pages');

const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? 'QADRAX/Microverse.ts').split('/');
const siteBase = `/${repo}/`;
const siteOrigin = `https://${owner.toLowerCase()}.github.io`;

function slugToTitle(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function discoverExamples() {
  const entries = await readdir(examplesDir, { withFileTypes: true });
  const examples = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = join(examplesDir, entry.name);
    let pkg;
    try {
      pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
    } catch {
      continue;
    }
    if (!pkg.scripts?.build?.includes('vite')) continue;

    examples.push({
      slug: entry.name,
      title: slugToTitle(entry.name),
      description: pkg.description ?? '',
      dir,
    });
  }

  examples.sort((a, b) => a.slug.localeCompare(b.slug));
  return examples;
}

function run(cmd, cwd, env = {}) {
  execSync(cmd, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
}

function renderIndex(examples) {
  const cards = examples
    .map(
      (ex) => `      <li class="card">
        <a href="${siteBase}${ex.slug}/">
          <h2>${ex.title}</h2>
          <p>${ex.description}</p>
          <span class="path">${ex.slug}/</span>
        </a>
      </li>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Microverse.ts — Live examples</title>
    <link rel="icon" href="data:," />
    <style>
      :root {
        color-scheme: light dark;
        --bg: #0f1419;
        --surface: #1a2332;
        --text: #e7ecf3;
        --muted: #9aa8bc;
        --accent: #6cb6ff;
        --border: #2d3a4d;
      }
      @media (prefers-color-scheme: light) {
        :root {
          --bg: #f4f7fb;
          --surface: #fff;
          --text: #15202b;
          --muted: #5c6b7a;
          --accent: #0969da;
          --border: #d8dee6;
        }
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        background: var(--bg);
        color: var(--text);
        line-height: 1.5;
      }
      main {
        max-width: 52rem;
        margin: 0 auto;
        padding: 2.5rem 1.25rem 3rem;
      }
      h1 { margin: 0 0 0.35rem; font-size: 1.75rem; }
      .lead { color: var(--muted); margin: 0 0 2rem; }
      .lead a { color: var(--accent); }
      ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 1rem; }
      .card a {
        display: block;
        padding: 1.1rem 1.25rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        color: inherit;
        text-decoration: none;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .card a:hover {
        border-color: var(--accent);
        box-shadow: 0 0 0 1px var(--accent);
      }
      .card h2 { margin: 0 0 0.35rem; font-size: 1.15rem; color: var(--accent); }
      .card p { margin: 0 0 0.5rem; color: var(--muted); font-size: 0.95rem; }
      .path { font-family: ui-monospace, Consolas, monospace; font-size: 0.85rem; opacity: 0.85; }
    </style>
  </head>
  <body>
    <main>
      <h1>Microverse.ts examples</h1>
      <p class="lead">
        Browser demos built with <a href="https://github.com/${owner}/${repo}">Microverse Lua</a>
        (Wasmoon + host bridges). Source lives under <code>examples/</code> in the repo.
      </p>
      <ul>
${cards}
      </ul>
    </main>
  </body>
</html>
`;
}

async function main() {
  const examples = await discoverExamples();
  if (examples.length === 0) {
    console.error('No Vite examples found under examples/');
    process.exit(1);
  }

  console.log(`Building ${examples.length} example(s) for ${siteOrigin}${siteBase}`);

  run('pnpm --filter @microverse.ts/microverse-lua... run build', repoRoot);

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  for (const ex of examples) {
    const base = `${siteBase}${ex.slug}/`;
    console.log(`\n→ ${ex.slug} (base: ${base})`);
    run('pnpm run build', ex.dir, { VITE_BASE: base });
    await cp(join(ex.dir, 'dist'), join(outDir, ex.slug), { recursive: true });
  }

  await writeFile(join(outDir, 'index.html'), renderIndex(examples), 'utf8');

  const manifest = {
    builtAt: new Date().toISOString(),
    repository: `${owner}/${repo}`,
    siteUrl: `${siteOrigin}${siteBase}`,
    examples: examples.map((ex) => ({
      slug: ex.slug,
      title: ex.title,
      url: `${siteOrigin}${siteBase}${ex.slug}/`,
    })),
  };
  await writeFile(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`\nDone → ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
