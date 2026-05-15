import { createLuaMicroverse } from './luaMicroverse.js';

/**
 * Plug-and-play **Lua microverse** entry point.
 *
 * A Wasmoon-backed VM is always created for you — pass only `host`, `surface`, and optional timeouts /
 * shared Lua preludes. For declarative bridges and IDE stubs, use {@link defineHostSurface}, {@link fn},
 * and {@link cap} from this package (re-exported from `@microverse/host-surface`).
 *
 * @example
 * ```ts
 * const microverse = MicroverseLua.create({
 *   host: myHost,
 *   surface: mySurface,
 *   defaultTimeout: fixedTimeout(30_000),
 * });
 * await microverse.registerScript({ scriptId: 'ai', script: lua, capabilities: surface.pickCapabilities('demo:tick') });
 * ```
 */
export const MicroverseLua = {
  /** Creates a {@link LuaMicroverse} with a built-in Wasm Lua runtime. */
  create: createLuaMicroverse,
} as const;
