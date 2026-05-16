import { createLuaMicroverse } from './luaMicroverse';

/**
 * Plug-and-play **Lua microverse** entry point.
 *
 * A Wasmoon-backed VM is always created for you — pass only `host`, `surface`, and optional timeouts /
 * shared Lua preludes. Define bridges with {@link defineHostSurfaceFor} (`bridge` → `method` → `build`).
 *
 * @example
 * ```ts
 * const microverse = MicroverseLua.create({
 *   host: myHost,
 *   surface: mySurface,
 *   defaultTimeoutMs: 30_000,
 * });
 * microverse.registerScriptDefinition({ scriptId: 'ai', source: lua });
 * await microverse.mountScriptInstance({ instanceId: 'ai', scriptId: 'ai', capabilities: surface.pickCapabilities('demo:tick') });
 * ```
 */
export const MicroverseLua = {
  /** Creates a {@link LuaMicroverse} with a built-in Wasm Lua runtime. */
  create: createLuaMicroverse,
} as const;
