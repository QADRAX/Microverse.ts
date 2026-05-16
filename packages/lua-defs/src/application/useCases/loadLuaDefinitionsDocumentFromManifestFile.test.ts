import { describe, expect, it } from 'vitest';

import { buildLuaCatsDocument } from '../../domain/luaCats/buildLuaCatsDocument';
import { parseManifestJson } from '../../domain/manifest/parseManifestJson';
import type { FileSystemPort } from '../ports/FileSystemPort';
import type { LuaDefinitionsFromManifestFilePorts } from '../ports/LuaDefinitionsFromManifestFilePorts';
import { loadLuaDefinitionsDocumentFromManifestFile } from './loadLuaDefinitionsDocumentFromManifestFile';

describe('loadLuaDefinitionsDocumentFromManifestFile', () => {
  it('returns lua document string without writing files', async () => {
    const manifestJson = JSON.stringify({
      schemaVersion: 1,
      output: 'out.d.lua',
      globals: [{ name: 'G', fields: [{ name: 'x', luaType: 'number' }] }],
    });
    const fs: FileSystemPort = {
      readTextFile: async () => manifestJson,
      writeTextFile: async () => {
        throw new Error('should not write');
      },
      mkdirpForFile: async () => {
        throw new Error('should not mkdir');
      },
      resolve: (cwd, ...segments) => [cwd, ...segments].join('|'),
      dirname: (p) => p.split('|').slice(0, -1).join('|') || '.',
    };
    const ports: LuaDefinitionsFromManifestFilePorts = [fs, parseManifestJson, buildLuaCatsDocument];
    const lua: string = await loadLuaDefinitionsDocumentFromManifestFile(ports, {
      cwd: '/proj',
      manifestPath: 'm.json',
    });
    expect(lua).toContain('---@class GGlobal');
    expect(lua).toContain('G = {}');
  });
});
