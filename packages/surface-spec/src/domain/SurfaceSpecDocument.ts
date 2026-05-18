/** Protocol JSON document version (see `schemas/surface-spec.schema.json`). */
export const SURFACE_SPEC_SCHEMA_VERSION = 1 as const;

export type SurfaceSpecSchemaVersion = typeof SURFACE_SPEC_SCHEMA_VERSION;

/** Script profile label, e.g. `lua@1`. */
export type SurfaceSpecScriptProfile = string;

export type SurfaceSpecMethod = {
  readonly requires: string;
  readonly input: unknown;
  readonly output: unknown;
  readonly async?: boolean | undefined;
  readonly description?: string | undefined;
};

export type SurfaceSpecBridge = {
  readonly methods: Readonly<Record<string, SurfaceSpecMethod>>;
};

export type SurfaceSpecComponentType = {
  readonly extends?: string | undefined;
  readonly capabilities: readonly string[];
  readonly hooks: readonly string[];
  readonly bridgeNames: readonly string[];
  readonly props: unknown;
  readonly state: unknown;
};

/**
 * Language-neutral host surface contract (declarative only).
 * Handlers are never included; bridge I/O uses JSON Schema objects.
 */
export type SurfaceSpecDocument = {
  readonly schemaVersion: SurfaceSpecSchemaVersion;
  readonly scriptProfile?: SurfaceSpecScriptProfile | undefined;
  readonly capabilities: readonly string[];
  readonly bridges: Readonly<Record<string, SurfaceSpecBridge>>;
  readonly componentTypes: Readonly<Record<string, SurfaceSpecComponentType>>;
  readonly componentHooks?: Readonly<Record<string, unknown>> | undefined;
};

export type BuildSurfaceSpecDocumentOptions = {
  readonly scriptProfile?: SurfaceSpecScriptProfile | undefined;
};

/** Default script profile for the TypeScript + Lua reference implementation. */
export const MICROVERSE_SCRIPT_PROFILE_LUA_1 = 'lua@1' as const;
