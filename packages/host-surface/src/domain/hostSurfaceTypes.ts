import type { LuaDefManifest } from '@microverse.ts/lua-defs';
import type { DeclarativeBridgeDeclaration } from '@microverse.ts/runtime-bridge';
import type { CapabilityId } from '@microverse.ts/runtime-capabilities';

import type {
  ResolvedScriptProfile,
  ResolvedScriptProfileRegistry,
} from './scriptProfileSpec';
import type { SurfaceCapabilityString } from './surfaceCapabilityString';
import type { WithMicroverseScriptContext } from './scriptContextSymbol';

export type {
  AnyHostSurfaceMethod,
  HostComponentHooksSpec,
  HostFnContext,
  HostSurfaceMethodEntry,
  HostSurfaceSpec,
  HostSurfaceSpecForHost,
} from './hostSurfaceSpecTypes';

import type { HostComponentHooksSpec, HostSurfaceSpec } from './hostSurfaceSpecTypes';

/**
 * Bridge + manifest API shared by every {@link HostSurface} (with or without workflow hooks).
 *
 * @typeParam TCapabilities - Union of capability ids declared on the surface spec (see {@link InferSurfaceCapabilities}).
 */
export type HostSurfaceCore<TCapabilities extends CapabilityId = CapabilityId> = {
  /** Internal bridge/method tree (for profile filtering and manifest). */
  readonly getHostSurfaceSpec: () => HostSurfaceSpec;
  /**
   * Declarative bridge declarations compatible with {@link buildDeclarativeBridgeTable}.
   */
  readonly toBridgeDeclarations: () => ReadonlyArray<
    DeclarativeBridgeDeclaration<WithMicroverseScriptContext, string>
  >;
  /** Resolved script profiles declared via `.componentType()`. */
  readonly componentTypes: ResolvedScriptProfileRegistry;
  /** Lookup a script profile by name (throws if unknown). */
  readonly getComponentType: (name: string) => ResolvedScriptProfile;
  /**
   * Builds a `LuaDefManifest` for `@microverse.ts/lua-defs` (`buildLuaCatsDocument`, `generateDefs`, CLI).
   *
   * @param opts.output - Default `.d.lua` output path recorded in the manifest.
   * @param opts.headerNote - Optional banner comment in the generated file.
     * @param opts.luaTypeAliases - Optional overrides / extra `---@alias` entries; by default aliases come from {@link luaType} on Zod schemas used in the surface.
   */
  readonly toLuaDefManifest: (opts: {
    readonly output: string;
    readonly headerNote?: string | undefined;
    /**
     * Optional extra `---@alias` entries, or overrides for inferred aliases (same key replaces inferred).
     */
    readonly luaTypeAliases?: Readonly<Record<string, string>> | undefined;
  }) => LuaDefManifest;
  /** Every capability id referenced by a method on this surface (deduplicated). */
  readonly capabilities: readonly TCapabilities[];
  /**
   * Subset allowlist for a script session. Only capabilities declared on this surface are accepted.
   */
  pickCapabilities<const T extends readonly SurfaceCapabilityString<TCapabilities>[]>(
    ...capabilities: T
  ): ReadonlyArray<Extract<T[number], TCapabilities>>;
};

/**
 * Compiled host surface: bridge factories for `mergeEnv` plus manifest builder for `.d.lua` generation.
 *
 * @typeParam THooks - When you pass `componentHooks` to {@link defineHostSurface}, the returned surface includes
 * `componentHooks` so callers can type domain events from the surface object alone.
 * @typeParam TCapabilities - Capability ids declared on the surface (for script allowlists).
 */
export type HostSurface<
  THooks extends HostComponentHooksSpec | undefined = undefined,
  TCapabilities extends CapabilityId = CapabilityId,
> = [undefined] extends [THooks]
  ? HostSurfaceCore<TCapabilities>
  : HostSurfaceCore<TCapabilities> & { readonly componentHooks: THooks };

/** Options passed to {@link HostSurfaceCore.toLuaDefManifest}. */
export type LuaDefManifestGeneratorOpts = Parameters<HostSurfaceCore['toLuaDefManifest']>[0];
