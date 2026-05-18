import { createCapabilityId } from '@microverse.ts/runtime-capabilities';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { HostSurfaceSpec } from './hostSurfaceSpecTypes';
import {
  buildResolvedScriptProfileRegistry,
  resolveScriptProfile,
  validateScriptProfileRegistry,
} from './scriptProfileSpec';
import { validateComponentTypeRegistry, type ComponentTypeDefRegistry } from './componentTypeSpec';

describe('componentTypeSpec', () => {
  const spec: HostSurfaceSpec = {
    billing: {
      charge: {
        capability: createCapabilityId('billing:charge'),
        input: z.object({ orderId: z.string() }),
        output: z.object({ ok: z.boolean() }),
        handler: () => ({ ok: true }),
      },
    },
  };

  const registry: ComponentTypeDefRegistry = {
    Billing: {
      capabilities: ['billing:charge'],
      props: z.object({}),
      state: z.object({}),
    },
    AuditOnly: {
      extends: 'Billing',
      capabilities: [],
      props: z.object({}),
      state: z.object({}),
    },
  };

  it('validateComponentTypeRegistry delegates to script profile validation', () => {
    validateComponentTypeRegistry(registry, spec);
    const profile = resolveScriptProfile(registry, 'Billing', spec);
    expect(profile.capabilities.map(String)).toEqual(['billing:charge']);
    expect(profile.bridgeNames).toEqual(['billing']);
  });

  it('buildResolvedScriptProfileRegistry resolves all types', () => {
    validateScriptProfileRegistry(registry, spec);
    const resolved = buildResolvedScriptProfileRegistry(registry, spec);
    expect(Object.keys(resolved).sort()).toEqual(['AuditOnly', 'Billing']);
  });
});
