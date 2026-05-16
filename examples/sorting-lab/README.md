# Sorting Lab

Browser sandbox that compares two sorting algorithms implemented as Lua scripts on the Microverse Wasm runtime. Both panels advance on the same tick via the `Tick` hook; bridges mutate per-slot arrays and update bar visualizations.

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

Open `lua/*.lua` with LuaLS using `.luarc.json` and `generated/`.

## Layout

| Path | Role |
|------|------|
| `src/engine/sortingSurface.ts` | Bridges (`array`, `viz`, `sort`) and `SortingAlgorithm` profile |
| `src/engine/sortingScriptCatalog.ts` | Algorithm catalog (single shared profile) |
| `lua/*.lua` | One script per algorithm |
| `src/main.ts` | UI wiring |
