import { z } from 'zod';

const aliasBySchema = new WeakMap<z.ZodTypeAny, string>();

/**
 * Registers a nominal LuaCATS name for a Zod schema. {@link zodToLuaTypeRef} emits the name;
 * `.d.lua` generation adds a matching `---@alias` with the structural shape.
 *
 * @example
 * ```ts
 * export const orderDto = luaType('OrderDto', z.object({ id: z.string() }));
 * // bridge: output: orderDto.optional()  →  returns `OrderDto|nil` in manifest
 * ```
 */
export function luaType<T extends z.ZodTypeAny>(name: string, schema: T): T {
  if (!/^[A-Za-z_]\w*$/.test(name)) {
    throw new Error(`luaType: invalid alias name: ${name}`);
  }
  aliasBySchema.set(schema, name);
  return schema;
}

/** @internal Root schema that carries a {@link luaType} registration (after unwrapping optional/nullable/…). */
export function getLuaTypeRegistrationRoot(schema: z.ZodTypeAny): z.ZodTypeAny | undefined {
  let cur: z.ZodTypeAny = schema;
  for (;;) {
    const name = aliasBySchema.get(cur);
    if (name !== undefined) {
      return cur;
    }
    const next = unwrapOneLayer(cur);
    if (next === undefined) {
      return undefined;
    }
    cur = next;
  }
}

/** @internal Nominal LuaCATS name for this schema, if registered via {@link luaType}. */
export function resolveZodLuaTypeAlias(schema: z.ZodTypeAny): string | undefined {
  const root = getLuaTypeRegistrationRoot(schema);
  return root === undefined ? undefined : aliasBySchema.get(root);
}

export function getRegisteredLuaTypeName(root: z.ZodTypeAny): string | undefined {
  return aliasBySchema.get(root);
}

function unwrapOneLayer(schema: z.ZodTypeAny): z.ZodTypeAny | undefined {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return schema.unwrap();
  }
  if (schema instanceof z.ZodDefault) {
    return schema.removeDefault();
  }
  if (schema instanceof z.ZodReadonly) {
    return schema.unwrap();
  }
  if (schema instanceof z.ZodEffects) {
    return schema.innerType();
  }
  if (schema instanceof z.ZodPipeline) {
    return schema._def.in as z.ZodTypeAny;
  }
  if (schema instanceof z.ZodLazy) {
    return schema.schema;
  }
  if (schema instanceof z.ZodBranded) {
    return schema.unwrap();
  }
  return undefined;
}
