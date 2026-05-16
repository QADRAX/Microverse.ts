import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

/**
 * Vite 8 library build + declaration emit for @microverse.ts/* packages.
 * @param {string} metaUrl `import.meta.url` from the package's `vite.config.ts`
 */
export function microverseLibraryViteConfig(metaUrl) {
  const root = dirname(fileURLToPath(metaUrl));
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const external = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
  ];

  return defineConfig({
    root,
    plugins: [
      dts({
        tsconfigPath: resolve(root, 'tsconfig.json'),
        exclude: ['**/*.test.ts', '**/vitest.config.ts'],
      }),
    ],
    build: {
      lib: {
        entry: resolve(root, 'src/index.ts'),
        formats: ['es'],
        fileName: () => 'index.js',
      },
      rollupOptions: {
        external: [...external, /^node:/],
      },
      outDir: resolve(root, 'dist'),
      emptyOutDir: true,
      sourcemap: true,
      minify: false,
    },
  });
}
