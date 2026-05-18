import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const implRoot = path.resolve(__dirname, '..');
const metaRoot = path.resolve(implRoot, '../..');
const goldenDir = path.join(metaRoot, 'conformance', 'vectors', 'golden');

type SurfaceExport = {
  readonly file: string;
  readonly surface: {
    readonly document: unknown;
    readonly toProtocolJson?: () => unknown;
  };
};

function stableStringify(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function main() {
  const sortingSurface = (await import('../examples/sorting-lab/src/engine/sortingSurface.ts'))
    .default as SurfaceExport['surface'];
  const chessSurface = (await import('../examples/chess-lab/src/engine/chessSurface.ts'))
    .default as SurfaceExport['surface'];

  const exports: SurfaceExport[] = [
    { file: 'sorting-lab.surface.json', surface: sortingSurface },
    { file: 'chess-lab.surface.json', surface: chessSurface },
  ];

  await mkdir(goldenDir, { recursive: true });

  const snapshots: Record<string, unknown> = Object.create(null) as Record<string, unknown>;

  for (const { file, surface } of exports) {
    const doc =
      surface.document ??
      (typeof surface.toProtocolJson === 'function' ? surface.toProtocolJson() : undefined);
    if (doc === undefined) {
      throw new Error(`Surface ${file} has no document or toProtocolJson()`);
    }
    const outPath = path.join(goldenDir, file);
    const content = stableStringify(doc);
    await writeFile(outPath, content, 'utf8');
    snapshots[file] = doc;
    console.log(`Wrote ${path.relative(metaRoot, outPath)}`);
  }

  await writeFile(
    path.join(goldenDir, '.export-snapshots.json'),
    stableStringify(snapshots),
    'utf8',
  );
  console.log('Updated conformance/vectors/golden/.export-snapshots.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
