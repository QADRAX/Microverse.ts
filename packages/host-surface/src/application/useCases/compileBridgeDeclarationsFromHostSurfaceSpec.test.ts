import { createAllowlist, InMemoryCapabilityRegistry } from '@luarizer/runtime-capabilities';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { augmentHostWithCapabilityRegistry } from '../../infrastructure/adapters/augmentHostWithCapabilityRegistry.js';
import { createZodSchemaValidationPort } from '../../infrastructure/adapters/zodSchemaValidationAdapter.js';
import { cap, fn } from '../../domain/hostSurfaceMethodHelpers.js';
import { createBridgeDeclarationsFromHostSurfaceSpec } from './compileBridgeDeclarationsFromHostSurfaceSpec.js';

describe('createBridgeDeclarationsFromHostSurfaceSpec', () => {
  it('returns a Promise that resolves to Zod-validated output when the handler is async', async () => {
    const schemaValidation = createZodSchemaValidationPort();
    const decls = createBridgeDeclarationsFromHostSurfaceSpec(schemaValidation, {
      demo: {
        bump: fn<{ n: number }, { x: number }, { y: number }>({
          capability: cap('demo:bump'),
          input: z.object({ x: z.number() }),
          output: z.object({ y: z.number() }),
          handler: async (_ctx, { x }) => ({ y: x + 1 }),
        }),
      },
    });
    const registry = new InMemoryCapabilityRegistry(createAllowlist([cap('demo:bump')]));
    const host = augmentHostWithCapabilityRegistry({ n: 0 }, registry);
    const api = decls[0]!.createApi(host, 'slot-a');
    const out = api.bump!({ x: 41 });
    expect(out).toBeInstanceOf(Promise);
    await expect(out).resolves.toEqual({ y: 42 });
  });

  it('rejects the Promise when Zod output validation fails after resolution', async () => {
    const schemaValidation = createZodSchemaValidationPort();
    const decls = createBridgeDeclarationsFromHostSurfaceSpec(schemaValidation, {
      demo: {
        bad: fn<Record<string, never>, Record<string, never>, { y: number }>({
          capability: cap('demo:bad'),
          input: z.object({}),
          output: z.object({ y: z.number() }),
          handler: async () => ({ y: 'oops' }) as { y: number },
        }),
      },
    });
    const registry = new InMemoryCapabilityRegistry(createAllowlist([cap('demo:bad')]));
    const host = augmentHostWithCapabilityRegistry({}, registry);
    const api = decls[0]!.createApi(host, 'slot-b');
    const out = api.bad!({});
    await expect(out).rejects.toThrow();
  });
});
