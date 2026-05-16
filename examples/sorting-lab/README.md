# Sorting Lab

Browser demo with **one** `MicroverseLua` Wasm sandbox and **two** mounted script instances (`A` and `B`). Each instance runs a Lua `SortingAlgorithm` component; Play/Step invokes `onTick` and sorts via `array`, `viz`, and `sort` bridges (per-slot host state). TypeScript never sorts.

## Run

```bash
pnpm install
pnpm --filter @microverse.ts/sorting-lab dev
```

The example depends on **wasmoon** directly so Vite can pre-bundle its CommonJS build for the browser (`optimizeDeps.include`). If you see `does not provide an export named 'LuaFactory'`, delete `examples/sorting-lab/node_modules/.vite` and restart `dev`.

## Test (Node + Wasm)

```bash
pnpm --filter @microverse.ts/sorting-lab test
```

## Lua stubs

```bash
pnpm --filter @microverse.ts/sorting-lab run generate:lua-defs
```

Open `lua/*.lua` with LuaLS using this package’s `.luarc.json` (not a repo-root config) and `generated/`. Other examples under `examples/` should ship their own `.luarc.json` beside their `generated/` stubs.

## Layout

| Path | Role |
|------|------|
| `src/engine/sortingSurface.ts` | Bridges (`array`, `viz`, `sort`) and `SortingAlgorithm` profile |
| `src/engine/sortingScriptCatalog.ts` | Algorithm catalog (single shared profile) |
| `lua/*.lua` | One script per algorithm |
| `src/main.ts` | UI wiring |
