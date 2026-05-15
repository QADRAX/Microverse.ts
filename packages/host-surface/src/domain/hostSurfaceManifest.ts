import type {
  LuarizerDefManifest,
  ManifestAlias,
  ManifestClass,
  ManifestClassField,
  ManifestMethod,
  ManifestParam,
} from '@luarizer/lua-defs';
import { z } from 'zod';

import type { HostSurfaceSpec, HostWorkflowHooksSpec } from './hostSurfaceTypes.js';
import { luaGlobalHookName } from './luaGlobalHook.js';
import { isLuaTypeAtom } from './luaTypeAtoms.js';
import { zodToLuaTypeRef } from './zodToLuaTypeRef.js';

function buildWorkflowHookManifestFields(
  kinds: readonly string[],
  workflowHooks: HostWorkflowHooksSpec,
  selfType: string,
  fieldDescriptionSuffix: string,
): ManifestClassField[] {
  const out: ManifestClassField[] = [];
  for (const kind of kinds) {
    const schema = workflowHooks[kind];
    if (!(schema instanceof z.ZodObject)) {
      throw new Error(`defineHostSurface workflowHooks: "${kind}" must be a z.object(...)`);
    }
    const payloadName = `LuarizerWorkflowEvt_${kind}`;
    const hookName = luaGlobalHookName(kind);
    out.push({
      name: hookName,
      description: `${fieldDescriptionSuffix} Payload: \`${payloadName}\`.`,
      luaType: `fun(self: ${selfType}, evt: ${payloadName})`,
    });
  }
  return out;
}

function pushWorkflowPayloadManifestClasses(
  kinds: readonly string[],
  workflowHooks: HostWorkflowHooksSpec,
  classes: ManifestClass[],
): void {
  for (const kind of kinds) {
    const schema = workflowHooks[kind];
    if (!(schema instanceof z.ZodObject)) {
      throw new Error(`defineHostSurface workflowHooks: "${kind}" must be a z.object(...)`);
    }
    const name = `LuarizerWorkflowEvt_${kind}`;
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    classes.push({
      name,
      description: `Workflow hook payload for \`${luaGlobalHookName(kind)}\` (Zod → LuaCATS fields).`,
      fields: Object.keys(shape).map((k) => ({
        name: k,
        luaType: zodToLuaTypeRef(shape[k]!),
      })),
      emitSingleton: false,
    });
  }
}

export function buildLuarizerDefManifestFromHostSurfaceSpec(
  spec: HostSurfaceSpec,
  opts: {
    readonly output: string;
    readonly headerNote?: string | undefined;
    readonly luaTypeAliases?: Readonly<Record<string, string>> | undefined;
  },
  workflowHooks?: HostWorkflowHooksSpec,
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
  const inferred = inferLuaTypeAliasesFromHostSpec(spec);
  const merged = new Map<string, string>(inferred.map((a) => [a.name, a.definition]));
  if (opts.luaTypeAliases !== undefined) {
    for (const [k, v] of Object.entries(opts.luaTypeAliases)) {
      merged.set(k, v);
    }
  }

  if (workflowHooks !== undefined) {
    const kinds = Object.keys(workflowHooks).sort((a, b) => a.localeCompare(b));
    pushWorkflowPayloadManifestClasses(kinds, workflowHooks, classes);
    const abstractFields = buildWorkflowHookManifestFields(
      kinds,
      workflowHooks,
      'Workflow',
      'Host invokes this method on your table (from `workflow:extend()`) when the matching domain event fires.',
    );
    classes.push({
      name: 'Workflow',
      description:
        'Abstract workflow handler type. Call `local w = workflow:extend()` then define `function w:onOrderPlaced(evt) … end` (etc.). Each Lua slot has its own `workflow` helper and handler table.',
      fields: abstractFields,
      emitSingleton: false,
    });
    classes.push({
      name: 'workflow',
      description:
        'Per-slot helper injected by the host (not a TS bridge). Creates the active handler table for this sandbox slot.',
      methods: [
        {
          name: 'extend',
          description:
            'Returns a new handler table with default no-op hooks; registers it for host → Lua dispatch in this slot.',
          params: [],
          returns: 'Workflow',
        },
      ],
    });
  }

  const aliases =
    merged.size === 0
      ? undefined
      : [...merged.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, definition]) => ({ name, definition }));

  return {
    schemaVersion: 1,
    output: opts.output,
    headerNote: opts.headerNote,
    aliases,
    classes,
  };
}

function nominalTokensFromLuaReturnString(retLua: string): readonly string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const segment of retLua.split('|')) {
    const s = segment.trim();
    if (!/^[A-Za-z_]\w*$/.test(s)) {
      continue;
    }
    if (isLuaTypeAtom(s)) {
      continue;
    }
    if (seen.has(s)) {
      continue;
    }
    seen.add(s);
    out.push(s);
  }
  return out;
}

function unwrapOutputBaseForAlias(schema: z.ZodTypeAny): z.ZodTypeAny {
  /* eslint-disable @typescript-eslint/no-unsafe-assignment -- Zod internal unwrap chain */
  let cur: z.ZodTypeAny = schema;
  for (;;) {
    if (cur instanceof z.ZodOptional || cur instanceof z.ZodNullable) {
      cur = cur.unwrap();
      continue;
    }
    if (cur instanceof z.ZodDefault) {
      cur = cur.removeDefault();
      continue;
    }
    if (cur instanceof z.ZodReadonly) {
      cur = cur.unwrap();
      continue;
    }
    if (cur instanceof z.ZodEffects) {
      cur = cur.innerType();
      continue;
    }
    if (cur instanceof z.ZodPipeline) {
      cur = cur._def.out as z.ZodTypeAny;
      continue;
    }
    break;
  }
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */
  return cur;
}

function inferLuaTypeAliasesFromHostSpec(spec: HostSurfaceSpec): readonly ManifestAlias[] {
  const byName = new Map<string, string>();

  for (const bridgeName of Object.keys(spec)) {
    const methods = spec[bridgeName]!;
    for (const methodName of Object.keys(methods)) {
      const entry = methods[methodName]!;

      const luaParams = entry.lua?.paramTypes;
      if (luaParams !== undefined) {
        const baseInput = unwrapInputSchema(entry.input);
        if (baseInput instanceof z.ZodObject) {
          const shape = baseInput.shape as Record<string, z.ZodTypeAny>;
          for (const [key, L] of Object.entries(luaParams)) {
            if (typeof L !== 'string') {
              continue;
            }
            if (!/^[A-Za-z_]\w*$/.test(L) || isLuaTypeAtom(L)) {
              continue;
            }
            const field = shape[key];
            if (field === undefined) {
              continue;
            }
            const def = zodToLuaTypeRef(field);
            if (L !== def) {
              byName.set(L, def);
            }
          }
        }
      }

      const retLua = entry.lua?.returns;
      if (typeof retLua === 'string' && retLua.length > 0) {
        for (const T of nominalTokensFromLuaReturnString(retLua)) {
          const baseOut = unwrapOutputBaseForAlias(entry.output);
          const def = zodToLuaTypeRef(baseOut);
          if (T !== def) {
            byName.set(T, def);
          }
        }
      }
    }
  }

  return [...byName.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, definition]) => ({ name, definition }));
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
