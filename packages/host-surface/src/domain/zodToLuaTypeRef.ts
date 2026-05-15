import { z } from 'zod';

/* Zod's internal `_def` / `options` are intentionally untyped for this best-effort emitter. */
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */

/**
 * Maps a Zod schema to a **best-effort** LuaCATS type reference string for manifest emission.
 *
 * @remarks
 * Complex or nominal Lua types (e.g. `EntityId`) are not inferred reliably from Zod alone.
 * Use the `lua.paramTypes` / `lua.returns` fields on {@link fn} when you need precise IDE typings.
 *
 * @param schema - Any Zod schema (including wrappers like `optional`, `nullable`, `effects`).
 * @returns A LuaCATS-friendly type string such as `string`, `number`, `table`, `unknown`, or unions with `|nil`.
 */
export function zodToLuaTypeRef(schema: z.ZodTypeAny): string {
  if (schema instanceof z.ZodOptional) {
    return `${zodToLuaTypeRef(schema.unwrap())}|nil`;
  }
  if (schema instanceof z.ZodNullable) {
    return `${zodToLuaTypeRef(schema.unwrap())}|nil`;
  }
  if (schema instanceof z.ZodDefault) {
    return zodToLuaTypeRef(schema.removeDefault());
  }
  if (schema instanceof z.ZodReadonly) {
    return zodToLuaTypeRef(schema.unwrap());
  }
  if (schema instanceof z.ZodCatch) {
    return zodToLuaTypeRef(schema._def.innerType as z.ZodTypeAny);
  }
  if (schema instanceof z.ZodPipeline) {
    return zodToLuaTypeRef(schema._def.out as z.ZodTypeAny);
  }
  if (schema instanceof z.ZodEffects) {
    return zodToLuaTypeRef(schema.innerType());
  }
  if (schema instanceof z.ZodLazy) {
    return zodToLuaTypeRef(schema.schema);
  }
  if (schema instanceof z.ZodBranded) {
    return zodToLuaTypeRef(schema.unwrap());
  }

  if (schema instanceof z.ZodString) {
    return 'string';
  }
  if (schema instanceof z.ZodNumber) {
    return 'number';
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
    const parts = keys.map((k) => `${k}: ${zodToLuaTypeRef(shape[k]!)}`);
    return `{ ${parts.join('; ')} }`;
  }
  if (schema instanceof z.ZodUnion) {
    return schema.options.map((o: z.ZodTypeAny) => zodToLuaTypeRef(o)).join('|');
  }
  if (schema instanceof z.ZodDiscriminatedUnion) {
    return schema.options.map((o: z.ZodTypeAny) => zodToLuaTypeRef(o)).join('|');
  }
  if (schema instanceof z.ZodIntersection) {
    return 'table';
  }
  if (schema instanceof z.ZodTuple) {
    return 'table';
  }
  return 'unknown';
}
