import type { ManifestAlias, ManifestParam } from '../../domain/manifest/LuaDefManifest';

/** Precomputed LuaCATS type strings from Zod (profile `lua@1`). */
export type Lua1TypeOverlay = {
  readonly bridgeMethods?: Readonly<
    Record<
      string,
      Readonly<
        Record<
          string,
          {
            readonly params?: readonly ManifestParam[] | undefined;
            readonly returns?: string | undefined;
            readonly async?: boolean | undefined;
            readonly description?: string | undefined;
          }
        >
      >
    >
  > | undefined;
  readonly componentTypes?: Readonly<
    Record<
      string,
      {
        readonly propsLuaType: string;
        readonly stateLuaType: string;
        readonly hooks?: readonly string[] | undefined;
      }
    >
  > | undefined;
  readonly hookPayloadFields?: Readonly<
    Record<string, readonly { readonly name: string; readonly luaType: string }[]>
  > | undefined;
  readonly aliases?: readonly ManifestAlias[] | undefined;
};

export type SurfaceSpecToLuaDefManifestOptions = {
  readonly output: string;
  readonly headerNote?: string | undefined;
  readonly luaTypeAliases?: Readonly<Record<string, string>> | undefined;
  readonly luaTypeOverlay?: Lua1TypeOverlay | undefined;
};
