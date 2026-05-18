import { createScriptInstanceContext } from '@microverse.ts/runtime-core';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { normalizeMethodDef } from '../../domain/surfaceMethodDef';
import { augmentHostWithScriptContext } from '../../infrastructure/adapters/augmentHostWithScriptContext';
import { createZodSchemaValidationPort } from '../../infrastructure/adapters/zodSchemaValidationAdapter';
import { createBridgeDeclarationsFromHostSurfaceSpec } from './compileBridgeDeclarationsFromHostSurfaceSpec';

describe('createBridgeDeclarationsFromHostSurfaceSpec', () => {
  it('returns a Promise that resolves to Zod-validated output when the handler is async', async () => {
    const schemaValidation = createZodSchemaValidationPort();
    const decls = createBridgeDeclarationsFromHostSurfaceSpec(schemaValidation, {
      demo: {
        bump: normalizeMethodDef({
          requires: 'demo:bump',
          input: z.object({ x: z.number() }),
          output: z.object({ y: z.number() }),
          handler: async (_ctx, { x }) => ({ y: x + 1 }),
        }),
      },
    });
    const host = augmentHostWithScriptContext(
      { n: 0 },
      createScriptInstanceContext({
        instanceId: 'i',
        scriptId: 's',
        slotKey: 'slot-a',
      }),
    );
    const api = decls[0]!.createApi(host, 'slot-a') as { bump: (payload: { x: number }) => Promise<{ y: number }> };
    const out = api.bump({ x: 41 });
    expect(out).toBeInstanceOf(Promise);
    await expect(out).resolves.toEqual({ y: 42 });
  });

  it('rejects the Promise when Zod output validation fails after resolution', async () => {
    const schemaValidation = createZodSchemaValidationPort();
    const decls = createBridgeDeclarationsFromHostSurfaceSpec(schemaValidation, {
      demo: {
        bad: normalizeMethodDef({
          requires: 'demo:bad',
          input: z.object({}),
          output: z.object({ y: z.number() }),
          handler: async () => ({ y: 'oops' }) as unknown as { y: number },
        }),
      },
    });
    const host = augmentHostWithScriptContext(
      {},
      createScriptInstanceContext({
        instanceId: 'i',
        scriptId: 's',
        slotKey: 'slot-b',
      }),
    );
    const api = decls[0]!.createApi(host, 'slot-b') as { bad: (payload: Record<string, never>) => Promise<{ y: number }> };
    const out = api.bad({});
    await expect(out).rejects.toThrow();
  });
});
