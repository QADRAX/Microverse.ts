import { describe, expect, it } from 'vitest';

import type { LuaDefManifest } from '../manifest/LuaDefManifest.js';
import { buildLuaCatsDocument } from './buildLuaCatsDocument.js';

describe('buildLuaCatsDocument', () => {
  it('emits classes and globals', () => {
    const manifest: LuaDefManifest = {
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
    expect(lua).toContain('function EchoBridge:ping(payload) end');
    expect(lua).toContain('---@class EngineGlobal');
    expect(lua).toContain('---@field Echo EchoBridge');
    expect(lua).toContain('Engine = {}');
  });

  it('emits class fields before methods', () => {
    const manifest: LuaDefManifest = {
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
    expect(lua).toContain('function Data:reset() end');
  });

  it('emits aliases before bridge classes', () => {
    const manifest: LuaDefManifest = {
      schemaVersion: 1,
      output: 'out.d.lua',
      aliases: [
        { name: 'OrderId', definition: 'string' },
        { name: 'OrderDto', definition: '{ id: string; customerId: string; totalCents: number }' },
      ],
      classes: [
        {
          name: 'Orders',
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
    const classOrders = lua.indexOf('---@class Orders');
    expect(meta).toBeGreaterThanOrEqual(0);
    expect(aliasOrderId).toBeGreaterThan(meta);
    expect(classOrders).toBeGreaterThan(aliasOrderId);
    expect(lua).toContain('Orders = {}');
  });

  it('emits @field method signatures when emitSingleton is false (nested bridge access)', () => {
    const manifest: LuaDefManifest = {
      schemaVersion: 1,
      output: 'out.d.lua',
      classes: [
        {
          name: 'Notifications',
          methods: [
            {
              name: 'send',
              params: [
                { name: 'channel', luaType: 'string' },
                { name: 'message', luaType: 'string' },
              ],
              returns: 'nil',
            },
          ],
          emitSingleton: false,
        },
        {
          name: 'MicroverseBridges',
          fields: [{ name: 'notifications', luaType: 'Notifications' }],
          emitSingleton: false,
        },
      ],
    };
    const lua = buildLuaCatsDocument(manifest);
    expect(lua).toContain(
      '---@field send fun(self: Notifications, payload: { channel: string; message: string }): nil',
    );
    expect(lua).not.toContain('Notifications = {}');
    expect(lua).not.toContain('function Notifications:send');
  });

  it('omits class singleton when emitSingleton is false', () => {
    const manifest: LuaDefManifest = {
      schemaVersion: 1,
      output: 'out.d.lua',
      classes: [
        {
          name: 'AbstractOnly',
          fields: [{ name: 'x', luaType: 'number', description: 'n' }],
          emitSingleton: false,
        },
      ],
    };
    const lua = buildLuaCatsDocument(manifest);
    expect(lua).toContain('---@class AbstractOnly');
    expect(lua).toContain('---@field x number');
    expect(lua).not.toContain('AbstractOnly = {}');
  });

  it('emits singleValue methods on a class (workflow evt)', () => {
    const manifest: LuaDefManifest = {
      schemaVersion: 1,
      output: 'out.d.lua',
      aliases: [{ name: 'Evt', definition: '{ x: number }' }],
      classes: [
        {
          name: 'Workflow',
          description: 'Hooks',
          methods: [
            {
              name: 'onPing',
              callStyle: 'singleValue',
              params: [{ name: 'evt', luaType: 'Evt' }],
            },
          ],
        },
      ],
    };
    const lua = buildLuaCatsDocument(manifest);
    expect(lua).toContain('---@param evt Evt');
    expect(lua).toContain('function Workflow:onPing(evt) end');
    expect(lua).not.toContain('function Workflow:onPing(payload) end');
  });

  it('emits asyncBridge methods with payload and onComplete', () => {
    const manifest: LuaDefManifest = {
      schemaVersion: 1,
      output: 'out.d.lua',
      classes: [
        {
          name: 'asyncio',
          emitSingleton: false,
          methods: [
            {
              name: 'tick',
              callStyle: 'asyncBridge',
              params: [
                { name: 'delayMs', luaType: 'integer' },
                { name: 'seed', luaType: 'number' },
                { name: 'onComplete', luaType: 'fun(result: TickResult)|nil' },
              ],
              returns: 'AsyncioTickHandle',
            },
          ],
        },
        {
          name: 'AsyncioTickHandle',
          fields: [{ name: 'await', luaType: 'fun(self): TickResult' }],
          emitSingleton: false,
        },
      ],
    };
    const lua = buildLuaCatsDocument(manifest);
    expect(lua).toContain(
      '---@field tick fun(self: asyncio, payload: { delayMs: integer; seed: number }, onComplete: fun(result: TickResult)|nil): AsyncioTickHandle',
    );
    expect(lua).not.toContain('function asyncio:tick');
  });

  it('emits luaHooks after classes', () => {
    const manifest: LuaDefManifest = {
      schemaVersion: 1,
      output: 'out.d.lua',
      aliases: [{ name: 'OrderPlacedPayload', definition: '{ orderId: string; amountCents: number }' }],
      luaHooks: [
        {
          name: 'onOrderPlaced',
          paramName: 'evt',
          payloadLuaType: 'OrderPlacedPayload',
        },
      ],
      classes: [
        {
          name: 'Orders',
          methods: [{ name: 'get', params: [{ name: 'orderId', luaType: 'string' }], returns: 'nil' }],
        },
      ],
    };
    const lua = buildLuaCatsDocument(manifest);
    const classPos = lua.indexOf('---@class Orders');
    const hookPos = lua.indexOf('function onOrderPlaced(evt) end');
    expect(classPos).toBeGreaterThanOrEqual(0);
    expect(hookPos).toBeGreaterThan(classPos);
  });
});
