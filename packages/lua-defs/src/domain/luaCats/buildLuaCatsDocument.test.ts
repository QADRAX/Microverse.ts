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
    expect(lua).toContain('EchoBridge = {}');
    expect(lua).toContain('---@param payload { msg: string }');
    expect(lua).toContain('function EchoBridge.ping(payload) end');
    expect(lua).toContain('---@class EngineGlobal');
    expect(lua).toContain('---@field Echo EchoBridge');
    expect(lua).toContain('Engine = {}');
  });

  it('emits class fields before methods', () => {
    const manifest: LuarizerDefManifest = {
      schemaVersion: 1,
      output: 'out.d.lua',
      classes: [
        {
          name: 'Data',
          fields: [{ name: 'id', luaType: 'number' }],
          methods: [{ name: 'reset', params: [], returns: 'nil' }],
        },
      ],
    };
    const lua = buildLuaCatsDocument(manifest);
    expect(lua).toContain('---@class Data');
    expect(lua).toContain('---@field id number');
    expect(lua).toContain('Data = {}');
    expect(lua).toContain('function Data.reset() end');
  });

  it('emits aliases before bridge classes', () => {
    const manifest: LuarizerDefManifest = {
      schemaVersion: 1,
      output: 'out.d.lua',
      aliases: [
        { name: 'OrderId', definition: 'string' },
        { name: 'OrderDto', definition: '{ id: string, customerId: string, totalCents: number }' },
      ],
      classes: [
        {
          name: 'orders',
          methods: [
            {
              name: 'get',
              params: [{ name: 'orderId', luaType: 'OrderId' }],
              returns: 'OrderDto|nil',
            },
          ],
        },
      ],
    };
    const lua = buildLuaCatsDocument(manifest);
    const meta = lua.indexOf('---@meta');
    const aliasOrderId = lua.indexOf('---@alias OrderId string');
    const classOrders = lua.indexOf('---@class orders');
    expect(meta).toBeGreaterThanOrEqual(0);
    expect(aliasOrderId).toBeGreaterThan(meta);
    expect(classOrders).toBeGreaterThan(aliasOrderId);
    expect(lua).toContain('orders = {}');
  });

  it('emits luaHooks after classes', () => {
    const manifest: LuarizerDefManifest = {
      schemaVersion: 1,
      output: 'out.d.lua',
      luaHooks: [
        {
          name: 'onOrderPlaced',
          paramName: 'evt',
          payloadLuaType: '{ orderId: string, amountCents: number }',
        },
      ],
      classes: [
        {
          name: 'orders',
          methods: [{ name: 'get', params: [{ name: 'orderId', luaType: 'string' }], returns: 'nil' }],
        },
      ],
    };
    const lua = buildLuaCatsDocument(manifest);
    const classPos = lua.indexOf('---@class orders');
    const hookPos = lua.indexOf('function onOrderPlaced(evt) end');
    expect(classPos).toBeGreaterThanOrEqual(0);
    expect(hookPos).toBeGreaterThan(classPos);
  });
});
