import type { ManifestAlias } from '@microverse.ts/lua-defs';
import { z } from 'zod';

import type { HostSurfaceSpec } from '../hostSurfaceSpecTypes';
import { isLuaTypeAtom } from './luaTypeAtoms';
import { getLuaTypeRegistrationRoot, getRegisteredLuaTypeName } from './zodLuaType';
import { zodToLuaTypeRef } from './zodToLuaTypeRef';

function nominalTokensFromLuaReturnString(retLua: string): readonly string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const segment of retLua.split('|')) {
    const s = segment.trim();
    if (!/^[A-Za-z_]\w*$/.test(s) || isLuaTypeAtom(s) || seen.has(s)) {
      continue;
    }
    seen.add(s);
    out.push(s);
  }
  return out;
}

function unwrapInputSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
  let cur: z.ZodTypeAny = schema;
  if (cur instanceof z.ZodEffects) {
    cur = cur.innerType() as z.ZodTypeAny;
  }
  if (cur instanceof z.ZodPipeline) {
    cur = cur._def.in as z.ZodTypeAny;
  }
  return cur;
}

function unwrapOutputBaseForAlias(schema: z.ZodTypeAny): z.ZodTypeAny {
  let cur: z.ZodTypeAny = schema;
  for (;;) {
    if (cur instanceof z.ZodOptional || cur instanceof z.ZodNullable) {
      cur = cur.unwrap() as z.ZodTypeAny;
      continue;
    }
    if (cur instanceof z.ZodDefault) {
      cur = cur.removeDefault() as z.ZodTypeAny;
      continue;
    }
    if (cur instanceof z.ZodReadonly) {
      cur = cur.unwrap() as z.ZodTypeAny;
      continue;
    }
    if (cur instanceof z.ZodEffects) {
      cur = cur.innerType() as z.ZodTypeAny;
      continue;
    }
    if (cur instanceof z.ZodPipeline) {
      cur = cur._def.out as z.ZodTypeAny;
      continue;
    }
    break;
  }
  return cur;
}

export function collectLuaTypeAliasesFromHostSpec(spec: HostSurfaceSpec): readonly ManifestAlias[] {
  const byName = new Map<string, string>();
  const seenRoots = new Set<z.ZodTypeAny>();

  const consider = (schema: z.ZodTypeAny): void => {
    const root = getLuaTypeRegistrationRoot(schema);
    if (root === undefined || seenRoots.has(root)) {
      return;
    }
    const name = getRegisteredLuaTypeName(root);
    if (name === undefined) {
      return;
    }
    seenRoots.add(root);
    const definition = zodToLuaTypeRef(root, { emitAliasNames: false });
    if (definition !== name) {
      byName.set(name, definition);
    }
  };

  const walk = (schema: z.ZodTypeAny): void => {
    consider(schema);
    const base = unwrapInputSchema(schema);
    if (base instanceof z.ZodObject) {
      const shape = base.shape as Record<string, z.ZodTypeAny>;
      for (const field of Object.values(shape)) {
        consider(field);
      }
    }
  };

  for (const bridgeName of Object.keys(spec)) {
    const methods = spec[bridgeName]!;
    for (const methodName of Object.keys(methods)) {
      const entry = methods[methodName]!;
      walk(entry.input);
      walk(entry.output);
    }
  }

  return [...byName.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, definition]) => ({ name, definition }));
}

export function inferLuaTypeAliasesFromHostSpec(spec: HostSurfaceSpec): readonly ManifestAlias[] {
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
            if (typeof L !== 'string' || !/^[A-Za-z_]\w*$/.test(L) || isLuaTypeAtom(L)) {
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
          const def = zodToLuaTypeRef(unwrapOutputBaseForAlias(entry.output));
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

export { unwrapInputSchema };
