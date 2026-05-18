import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { compileHostSurfaceFor } from '../application/useCases/compileHostSurface';
import type { SchemaValidationPort } from '../application/ports/SchemaValidationPort';
import { normalizeMethodDef } from '../domain/surfaceMethodDef';
import { err, ok } from '@microverse.ts/shared';

const schemaValidation: SchemaValidationPort = {
  validateWithZodSchema: (schema, payload) => {
    const parsed = schema.safeParse(payload);
    return parsed.success ? ok(parsed.data) : err(parsed.error.message);
  },
};

describe('buildSurfaceSpecDocumentFromZod', () => {
  it('caches document on HostSurface with bridges and component types', () => {
    const surface = compileHostSurfaceFor(
      [schemaValidation],
      {
        demo: {
          ping: normalizeMethodDef({
            requires: 'demo:ping',
            input: z.object({}),
            output: z.string(),
            handler: () => 'pong',
          }),
        },
      },
      {
        Minimal: {
          capabilities: ['demo:ping'],
          props: z.object({}),
          state: z.object({}),
          hooks: [],
        },
      },
    );
    expect(surface.document.schemaVersion).toBe(1);
    expect(surface.document.bridges.demo?.methods.ping?.requires).toBe('demo:ping');
    expect(surface.document.componentTypes.Minimal?.bridgeNames).toContain('demo');
    expect(surface.toProtocolJson()).toBe(surface.document);
  });
});
