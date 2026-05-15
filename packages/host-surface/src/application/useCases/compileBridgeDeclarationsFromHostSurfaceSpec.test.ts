import { createAllowlist, createCapabilityId, InMemoryCapabilityRegistry } from '@microverse/runtime-capabilities';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { normalizeMethodDef } from '../../domain/surfaceMethodDef.js';
import { augmentHostWithCapabilityRegistry } from '../../infrastructure/adapters/augmentHostWithCapabilityRegistry.js';
import { createZodSchemaValidationPort } from '../../infrastructure/adapters/zodSchemaValidationAdapter.js';
import { createBridgeDeclarationsFromHostSurfaceSpec } from './compileBridgeDeclarationsFromHostSurfaceSpec.js';

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
    const capId = createCapabilityId('demo:bump');
    const registry = new InMemoryCapabilityRegistry(createAllowlist([capId]));
    const host = augmentHostWithCapabilityRegistry({ n: 0 }, registry);
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
    const capId = createCapabilityId('demo:bad');
    const registry = new InMemoryCapabilityRegistry(createAllowlist([capId]));
    const host = augmentHostWithCapabilityRegistry({}, registry);
    const api = decls[0]!.createApi(host, 'slot-b') as { bad: (payload: Record<string, never>) => Promise<{ y: number }> };
    const out = api.bad({});
    await expect(out).rejects.toThrow();
  });
});
