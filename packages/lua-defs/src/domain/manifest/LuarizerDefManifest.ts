/**
 * JSON manifiesto para generar definiciones LuaCATS (`.d.lua`).
 * Mantén este contrato alineado con lo que inyectas en Lua (tablas bridge, globales del host).
 *
 * @see https://luals.github.io/wiki/annotations/
 */
export type LuaPrimitiveType = 'string' | 'number' | 'boolean' | 'nil' | 'unknown' | 'any' | 'table';

export type LuaTypeRef = string;

export type ManifestParam = {
  readonly name: string;
  readonly luaType: LuaTypeRef;
  readonly description?: string | undefined;
};

export type ManifestMethod = {
  readonly name: string;
  readonly description?: string | undefined;
  readonly params?: readonly ManifestParam[] | undefined;
  /** LuaCATS return, e.g. `boolean` or `string|nil` */
  readonly returns?: LuaTypeRef | undefined;
};

export type ManifestClassField = {
  readonly name: string;
  readonly luaType: LuaTypeRef;
  readonly description?: string | undefined;
};

export type ManifestClass = {
  readonly name: string;
  readonly description?: string | undefined;
  /** Campos de la tabla bridge (además de métodos). Opcional. */
  readonly fields?: readonly ManifestClassField[] | undefined;
  readonly methods?: readonly ManifestMethod[] | undefined;
};

export type ManifestGlobalField = {
  readonly name: string;
  readonly luaType: LuaTypeRef;
  readonly description?: string | undefined;
};

export type ManifestGlobal = {
  readonly name: string;
  readonly description?: string | undefined;
  readonly fields: readonly ManifestGlobalField[];
};

/** LuaCATS `---@alias Name definition` (e.g. bridge param types referenced in `luaType`). */
export type ManifestAlias = {
  readonly name: string;
  /** Right-hand side of `@alias`, e.g. `string` or `{ id: string }`. */
  readonly definition: string;
};

export type LuarizerDefManifest = {
  readonly schemaVersion: 1;
  /** Ruta de salida relativa a `cwd` (o absoluta). */
  readonly output: string;
  readonly headerNote?: string | undefined;
  readonly aliases?: readonly ManifestAlias[] | undefined;
  readonly classes?: readonly ManifestClass[] | undefined;
  readonly globals?: readonly ManifestGlobal[] | undefined;
};
