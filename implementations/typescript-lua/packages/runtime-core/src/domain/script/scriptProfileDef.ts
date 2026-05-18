import type { z } from 'zod';

import type { ScriptReferenceFieldSchema } from './scriptReferenceSchema';

/** Declarative script profile (catalog / mount); resolved against a host surface at runtime. */
export type ScriptProfileDefInput<
  TCap extends `${string}:${string}` = `${string}:${string}`,
> = {
  readonly extends?: string | undefined;
  readonly capabilities: readonly TCap[];
  readonly props: z.ZodObject<z.ZodRawShape>;
  readonly state?: z.ZodObject<z.ZodRawShape> | undefined;
  readonly hooks?: readonly string[] | undefined;
  readonly references?: ScriptReferenceFieldSchema | undefined;
};
