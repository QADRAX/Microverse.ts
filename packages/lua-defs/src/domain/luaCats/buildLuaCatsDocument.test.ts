import { describe, expect, it } from 'vitest';

import type { LuarizerDefManifest } from '../manifest/LuarizerDefManifest.js';
import { buildLuaCatsDocument } from './buildLuaCatsDocument.js';

describe('buildLuaCatsDocument', () => {
  it('emits classes and globals', () => {
    const manifest: LuarizerDefManifest = {
      schemaVersion: 1,
      output: 'out.d.lua',
      classes: [
        {
          name: 'EchoBridge',
          methods: [
            {
              name: 'ping',
              params: [{ name: 'msg', luaType: 'string' }],
              returns: 'string',
            },
          ],
        },
      ],
      globals: [
        {
          name: 'Engine',
          fields: [{ name: 'Echo', luaType: 'EchoBridge' }],
        },
      ],
    };
    const lua = buildLuaCatsDocument(manifest);
    expect(lua).toContain('---@class EchoBridge');
    expect(lua).toContain('function EchoBridge:ping(msg) end');
    expect(lua).toContain('---@class EngineGlobal');
    expect(lua).toContain('---@field Echo EchoBridge');
    expect(lua).toContain('Engine = {}');
  });
});
