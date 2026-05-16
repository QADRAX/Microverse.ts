import { createCapabilityId } from '@microverse.ts/runtime-capabilities';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  bridgeNamesForCapabilities,
  buildResolvedComponentTypeRegistry,
  resolveComponentTypeProfile,
  validateComponentTypeRegistry,
} from './componentTypeSpec';
import { normalizeMethodDef } from './surfaceMethodDef';

describe('componentTypeSpec', () => {
  const spec = {
    audit: {
      record: normalizeMethodDef({
        requires: 'audit:record',
        input: z.object({ line: z.string() }),
        output: z.undefined(),
        handler: () => undefined,
      }),
    },
    billing: {
      charge: normalizeMethodDef({
        requires: 'billing:charge',
        input: z.object({ orderId: z.string(), amountCents: z.number() }),
        output: z.object({ ok: z.boolean() }),
        handler: () => ({ ok: true }),
      }),
    },
  };

  const registry = {
    AuditOnly: {
      capabilities: ['audit:record'] as const,
      props: z.object({}),
      state: z.object({}),
    },
    Billing: {
      extends: 'AuditOnly',
      capabilities: ['billing:charge'] as const,
      props: z.object({ label: z.string().optional() }),
      state: z.object({}),
    },
  };

  it('merges inherited capabilities and props', () => {
    validateComponentTypeRegistry(registry, spec);
    const profile = resolveComponentTypeProfile(registry, 'Billing', spec);
    expect(profile.capabilities.map(String)).toEqual(['billing:charge', 'audit:record']);
    expect(profile.bridgeNames).toEqual(['audit', 'billing']);
    expect(profile.props.safeParse({ label: 'x' }).success).toBe(true);
  });

  it('bridgeNamesForCapabilities omits bridges without allowed methods', () => {
    const names = bridgeNamesForCapabilities(spec, [createCapabilityId('audit:record')]);
    expect(names).toEqual(['audit']);
  });

  it('buildResolvedComponentTypeRegistry resolves all types', () => {
    validateComponentTypeRegistry(registry, spec);
    const resolved = buildResolvedComponentTypeRegistry(registry, spec);
    expect(Object.keys(resolved).sort()).toEqual(['AuditOnly', 'Billing']);
  });
});
