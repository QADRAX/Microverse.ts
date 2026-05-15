import { z } from 'zod';

import { resolveZodLuaTypeAlias } from './zodLuaType.js';

/* Zod's internal `_def` / `options` are intentionally untyped for this best-effort emitter. */
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */

export type ZodToLuaTypeRefOptions = {
  /**
   * When `false`, expands {@link luaType} registrations to structural shapes (for `---@alias` bodies).
   * Default `true` emits registered nominal names at use sites.
   */
  readonly emitAliasNames?: boolean | undefined;
};

/**
 * Maps a Zod schema to a LuaCATS type reference string for manifest emission.
 *
 * @remarks
 * Register nominal types with {@link luaType} on shared Zod schemas (e.g. `orderDto`, `orderId`).
 * Prefer that over per-method `lua.paramTypes` / `lua.returns` on {@link fn}.
 */
export function zodToLuaTypeRef(schema: z.ZodTypeAny, options?: ZodToLuaTypeRefOptions): string {
  const emitAliasNames = options?.emitAliasNames !== false;

  if (schema instanceof z.ZodOptional) {
    return `${zodToLuaTypeRef(schema.unwrap(), options)}|nil`;
  }
  if (schema instanceof z.ZodNullable) {
    return `${zodToLuaTypeRef(schema.unwrap(), options)}|nil`;
  }
  if (schema instanceof z.ZodDefault) {
    return zodToLuaTypeRef(schema.removeDefault(), options);
  }
  if (schema instanceof z.ZodReadonly) {
    return zodToLuaTypeRef(schema.unwrap(), options);
  }
  if (schema instanceof z.ZodCatch) {
    return zodToLuaTypeRef(schema._def.innerType as z.ZodTypeAny, options);
  }
  if (schema instanceof z.ZodPipeline) {
    return zodToLuaTypeRef(schema._def.out as z.ZodTypeAny, options);
  }
  if (schema instanceof z.ZodEffects) {
    return zodToLuaTypeRef(schema.innerType(), options);
  }
  if (schema instanceof z.ZodLazy) {
    return zodToLuaTypeRef(schema.schema, options);
  }
  if (schema instanceof z.ZodBranded) {
    return zodToLuaTypeRef(schema.unwrap(), options);
  }

  if (emitAliasNames) {
    const alias = resolveZodLuaTypeAlias(schema);
    if (alias !== undefined) {
      return alias;
    }
  }

  if (schema instanceof z.ZodString) {
    return 'string';
  }
  if (schema instanceof z.ZodNumber) {
    return zodNumberToLua(schema);
  }
  if (schema instanceof z.ZodBoolean) {
    return 'boolean';
  }
  if (schema instanceof z.ZodBigInt) {
    return 'integer';
  }
  if (schema instanceof z.ZodUndefined) {
    return 'nil';
  }
  if (schema instanceof z.ZodNull) {
    return 'nil';
  }
  if (schema instanceof z.ZodVoid) {
    return 'nil';
  }
  if (schema instanceof z.ZodUnknown || schema instanceof z.ZodAny) {
    return 'unknown';
  }
  if (schema instanceof z.ZodLiteral) {
    const v = schema.value;
    if (typeof v === 'string') {
      return `"${v}"`;
    }
    if (typeof v === 'number' || typeof v === 'boolean') {
      return String(v);
    }
    return 'unknown';
  }
  if (schema instanceof z.ZodEnum) {
    return schema.options.map((o: string) => `"${String(o)}"`).join('|');
  }
  if (schema instanceof z.ZodNativeEnum) {
    return 'string|number';
  }
  if (schema instanceof z.ZodArray) {
    return 'table';
  }
  if (schema instanceof z.ZodRecord) {
    return 'table';
  }
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    const keys = Object.keys(shape);
    if (keys.length === 0) {
      return '{}';
    }
    const parts = keys.map((k) => `${k}: ${zodToLuaTypeRef(shape[k]!, options)}`);
    return `{ ${parts.join('; ')} }`;
  }
  if (schema instanceof z.ZodUnion) {
    return schema.options.map((o: z.ZodTypeAny) => zodToLuaTypeRef(o, options)).join('|');
  }
  if (schema instanceof z.ZodDiscriminatedUnion) {
    return schema.options.map((o: z.ZodTypeAny) => zodToLuaTypeRef(o, options)).join('|');
  }
  if (schema instanceof z.ZodIntersection) {
    return 'table';
  }
  if (schema instanceof z.ZodTuple) {
    return 'table';
  }
  return 'unknown';
}

function zodNumberToLua(schema: z.ZodNumber): string {
  const checks = schema._def.checks as readonly { readonly kind: string }[];
  if (checks.some((c) => c.kind === 'int')) {
    return 'integer';
  }
  return 'number';
}
