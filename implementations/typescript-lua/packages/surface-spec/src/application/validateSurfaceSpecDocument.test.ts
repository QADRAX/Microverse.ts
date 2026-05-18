import { describe, expect, it } from 'vitest';

import { assembleSurfaceSpecDocument } from './assembleSurfaceSpecDocument';
import { parseSurfaceSpecJson } from '../infrastructure/parseSurfaceSpecJson';

describe('validateSurfaceSpecDocument', () => {
  it('assembles and validates a minimal document', () => {
    const doc = assembleSurfaceSpecDocument({
      bridges: {
        demo: {
          methods: {
            ping: {
              requires: 'demo:ping',
              input: { type: 'object', properties: {} },
              output: { type: 'string' },
            },
          },
        },
      },
      componentTypes: {
        Minimal: {
          capabilities: ['demo:ping'],
          hooks: [],
          bridgeNames: ['demo'],
          props: { type: 'object', properties: {} },
          state: { type: 'object', properties: {} },
        },
      },
      options: { scriptProfile: 'lua@1' },
    });
    expect(doc.capabilities).toContain('demo:ping');
    expect(JSON.parse(JSON.stringify(doc))).toEqual(doc);
  });

  it('parses hand-written JSON vectors', () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      capabilities: ['game:tick'],
      bridges: {
        game: {
          methods: {
            noop: {
              requires: 'game:tick',
              input: { type: 'object', properties: {} },
              output: { type: 'null' },
            },
          },
        },
      },
      componentTypes: {
        Listener: {
          capabilities: ['game:tick'],
          hooks: ['Tick'],
          bridgeNames: ['game'],
          props: { type: 'object', properties: {} },
          state: { type: 'object', properties: {} },
        },
      },
      componentHooks: {
        Tick: {
          type: 'object',
          properties: { step: { type: 'integer' } },
          required: ['step'],
        },
      },
    });
    const doc = parseSurfaceSpecJson(raw);
    expect(doc.componentTypes.Listener?.hooks).toEqual(['Tick']);
  });
});
