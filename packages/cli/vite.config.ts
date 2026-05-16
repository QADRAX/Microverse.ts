import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const root = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
];

export default defineConfig({
  root,
  plugins: [
    dts({
      tsconfigPath: resolve(root, 'tsconfig.json'),
      exclude: ['**/*.test.ts'],
    }),
  ],
  build: {
    ssr: true,
    target: 'node20',
    lib: {
      entry: resolve(root, 'src/cli.ts'),
      formats: ['es'],
      fileName: () => 'cli.js',
    },
    rollupOptions: {
      external: [...external, /^node:/, 'tsx', /^tsx\//],
    },
    outDir: resolve(root, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
  },
});
