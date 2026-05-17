import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname);
const nodeEmpty = resolve(root, 'src/shims/node-empty.ts');
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  root,
  server: { open: true },
  optimizeDeps: {
    include: ['wasmoon'],
    needsInterop: ['wasmoon'],
  },
  resolve: {
    alias: {
      path: nodeEmpty,
      fs: nodeEmpty,
      child_process: nodeEmpty,
      crypto: nodeEmpty,
      url: nodeEmpty,
      module: nodeEmpty,
    },
  },
  assetsInclude: ['**/*.wasm'],
  build: {
    target: 'esnext',
    commonjsOptions: {
      include: [/wasmoon/, /node_modules/],
    },
  },
});
