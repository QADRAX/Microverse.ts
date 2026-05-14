import type {
  LuarizerDefManifest,
  ManifestClass,
  ManifestMethod,
  ManifestParam,
} from '@luarizer/lua-defs';
import { buildDeclarativeBridgeTable, type DeclarativeBridgeDeclaration } from '@luarizer/runtime-bridge';
import type { CapabilityId } from '@luarizer/runtime-capabilities';
import { createCapabilityId } from '@luarizer/runtime-capabilities';
import { validateWithZodSchema } from '@luarizer/runtime-zod';
import { z } from 'zod';

import {
  LUARIZER_CAPABILITY_REGISTRY,
  type WithLuarizerCapabilityRegistry,
} from '../domain/capabilityRegistrySymbol.js';
import { zodToLuaTypeRef } from './zodToLuaTypeRef.js';

export type HostFnContext<THost> = {
  readonly host: THost;
  readonly slotKey: string;
};

/** Typed entry for use with {@link fn}; stored in the surface as {@link AnyHostSurfaceMethod}. */
export type HostSurfaceMethodEntry<THost, TIn, TOut> = {
  readonly capability: CapabilityId;
  readonly input: z.ZodType<TIn>;
  readonly output: z.ZodType<TOut>;
  readonly handler: (ctx: HostFnContext<THost>, input: TIn) => TOut;
  readonly description?: string | undefined;
  readonly lua?: {
    readonly paramTypes?: Partial<Record<string, string>> | undefined;
    readonly returns?: string | undefined;
  };
};

export type AnyHostSurfaceMethod = {
  readonly capability: CapabilityId;
  readonly input: z.ZodTypeAny;
  readonly output: z.ZodTypeAny;
  readonly handler: (ctx: HostFnContext<unknown>, input: unknown) => unknown;
  readonly description?: string | undefined;
  readonly lua?: {
    readonly paramTypes?: Partial<Record<string, string>> | undefined;
    readonly returns?: string | undefined;
  };
};

export type HostSurfaceSpec = Readonly<Record<string, Readonly<Record<string, AnyHostSurfaceMethod>>>>;

export type HostSurface = {
  readonly toBridgeDeclarations: () => ReadonlyArray<
    DeclarativeBridgeDeclaration<WithLuarizerCapabilityRegistry, string>
  >;
  readonly toLuarizerDefManifest: (opts: {
    readonly output: string;
    readonly headerNote?: string | undefined;
  }) => LuarizerDefManifest;
};

export function cap(id: `${string}:${string}`): CapabilityId {
  return createCapabilityId(id);
}

export function fn<THost, TIn, TOut>(def: HostSurfaceMethodEntry<THost, TIn, TOut>): AnyHostSurfaceMethod {
  return def as unknown as AnyHostSurfaceMethod;
}

export function defineHostSurface<const TSpec extends HostSurfaceSpec>(spec: TSpec): HostSurface {
  return {
    toBridgeDeclarations: () => toBridgeDeclarationsFromSpec(spec),
    toLuarizerDefManifest: (opts) => manifestFromSpec(spec, opts),
  };
}

function toBridgeDeclarationsFromSpec<TSpec extends HostSurfaceSpec>(
  spec: TSpec,
): ReadonlyArray<DeclarativeBridgeDeclaration<WithLuarizerCapabilityRegistry, string>> {
  const out: DeclarativeBridgeDeclaration<WithLuarizerCapabilityRegistry, string>[] = [];
  for (const bridgeName of Object.keys(spec)) {
    const methods = spec[bridgeName]!;
    out.push({
      name: bridgeName,
      perEntity: true,
      createApi: (host, slotKey) => {
        const api: Record<string, (payload: unknown) => unknown> = {};
        for (const methodName of Object.keys(methods)) {
          const entry = methods[methodName]!;
          api[methodName] = (payload: unknown) => {
            const registry = host[LUARIZER_CAPABILITY_REGISTRY];
            if (!registry.isAllowed(entry.capability)) {
              throw new Error(`capability denied: ${String(entry.capability)}`);
            }
            const parsedIn = validateWithZodSchema(entry.input as z.ZodType<unknown>, payload);
            if (parsedIn._tag === 'err') {
              throw new Error(parsedIn.error);
            }
            const result = entry.handler({ host, slotKey: String(slotKey) }, parsedIn.value);
            const parsedOut = validateWithZodSchema(entry.output as z.ZodType<unknown>, result);
            if (parsedOut._tag === 'err') {
              throw new Error(parsedOut.error);
            }
            return parsedOut.value;
          };
        }
        return Object.freeze(api);
      },
    });
  }
  return out;
}

function manifestFromSpec<TSpec extends HostSurfaceSpec>(
  spec: TSpec,
  opts: { readonly output: string; readonly headerNote?: string | undefined },
): LuarizerDefManifest {
  const classes: ManifestClass[] = [];
  for (const bridgeName of Object.keys(spec)) {
    const methods = spec[bridgeName]!;
    const manifestMethods: ManifestMethod[] = [];
    for (const methodName of Object.keys(methods)) {
      const entry = methods[methodName]!;
      manifestMethods.push({
        name: methodName,
        description: entry.description,
        params: zodInputToManifestParams(entry.input, entry.lua?.paramTypes),
        returns: entry.lua?.returns ?? zodToLuaTypeRef(entry.output),
      });
    }
    classes.push({
      name: bridgeName,
      methods: manifestMethods,
    });
  }
  return {
    schemaVersion: 1,
    output: opts.output,
    headerNote: opts.headerNote,
    classes,
  };
}

function zodInputToManifestParams(
  input: z.ZodTypeAny,
  luaParamTypes: Partial<Record<string, string>> | undefined,
): ManifestParam[] | undefined {
  const base = unwrapInputSchema(input);
  if (base instanceof z.ZodObject) {
    const shape = base.shape as Record<string, z.ZodTypeAny>;
    return Object.keys(shape).map((name) => ({
      name,
      luaType: luaParamTypes?.[name] ?? zodToLuaTypeRef(shape[name]!),
    }));
  }
  return [{ name: 'value', luaType: luaParamTypes?.value ?? zodToLuaTypeRef(base) }];
}

function unwrapInputSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
  let cur: z.ZodTypeAny = schema;
  if (cur instanceof z.ZodEffects) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- ZodEffects.innerType()
    cur = cur.innerType();
  }
  if (cur instanceof z.ZodPipeline) {
    cur = cur._def.in as z.ZodTypeAny;
  }
  return cur;
}

/**
 * Build mergeEnv-ready bridge tables using a surface and a host augmented with {@link LUARIZER_CAPABILITY_REGISTRY}.
 */
export function buildBridgeMergeEnvForHost<THost>(
  host: THost & WithLuarizerCapabilityRegistry,
  slotKey: string,
  surface: HostSurface,
): Readonly<Record<string, unknown>> {
  return buildDeclarativeBridgeTable(host, slotKey, [...surface.toBridgeDeclarations()]);
}
