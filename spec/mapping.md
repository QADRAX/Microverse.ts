# SurfaceSpec ↔ TypeScript reference mapping

Maps protocol fields to the **`@microverse.ts/host-surface`** package in the `lua@1` TypeScript implementation.

| Protocol (`SurfaceSpec`) | TypeScript (host-surface / microverse-lua) |
|--------------------------|-------------------------------------------|
| `schemaVersion` | Constant `SURFACE_SPEC_SCHEMA_VERSION` in `buildSurfaceSpecDocument` |
| `scriptProfile` | Export option `toProtocolJson({ scriptProfile: 'lua@1' })` |
| `capabilities[]` | `collectCapabilitiesFromHostSurfaceSpec` / `HostSurface.capabilities` |
| `bridges.*.methods.*` | `HostSurfaceSpec` tree via fluent `.bridge().method()` |
| `bridges.*.methods.*.requires` | `HostSurfaceMethodEntry.capability` |
| `bridges.*.methods.*.input` / `output` | Zod schemas → JSON Schema via `zodToJsonSchema` |
| `componentTypes.*` | `.componentType()` → `ResolvedScriptProfileRegistry` |
| `componentTypes.*.extends` | `ScriptProfileDefInput.extends` |
| `componentTypes.*.bridgeNames` | `bridgeNamesForCapabilities` |
| `componentHooks.*` | `componentHooks` map passed to `defineHostSurface` |
| Handlers | **Not exported** — `handler` on `HostSurfaceMethodEntry` stays host-only |
| LuaCATS stubs | Derived artifact: `toLuaDefManifest()` → `LuaDefManifest` (profile `lua@1`) |

## Reference surfaces

| Example | Source |
|---------|--------|
| Sorting Lab | `examples/sorting-lab/src/engine/sortingSurface.ts` |
| Chess Lab | `examples/chess-lab/src/engine/chessSurface.ts` |

Golden exports: [`conformance/vectors/golden/`](../conformance/vectors/golden/).
