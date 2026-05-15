/**
 * Spike: how Wasmoon exposes JS functions to Lua when the JS side returns a Promise.
 * Raw `async`/`Promise` returns are userdata until `:await()`; Luarizer slot bootstrap requires explicit
 * `:await()` or a 2nd-arg callback (see `LUARIZER_SLOT_VM_BOOTSTRAP_LUA`).
 */
import { LuaFactory } from 'wasmoon';
import { describe, expect, it } from 'vitest';

describe('wasmoon JS↔Lua interop (async spike, real engine)', () => {
  it('sync JS callable from Lua returns a Lua value', async () => {
    const factory = new LuaFactory();
    const lua = await factory.createEngine({ injectObjects: true });
    try {
      lua.global.set('double', (n: number) => n * 2);
      await lua.doString(`assert(double(21) == 42)`);
    } finally {
      await lua.global.close?.();
    }
  });

  it('async JS returning Promise: Lua sees userdata (not awaited) — bridges must stay sync or wrap', async () => {
    const factory = new LuaFactory();
    const lua = await factory.createEngine({ injectObjects: true });
    try {
      lua.global.set('asyncAdd', async (n: number) => n + 1);
      await lua.doString(`
        local r = asyncAdd(1)
        _G.__rtype = type(r)
      `);
      const rtype = lua.global.get('__rtype') as string;
      // Wasmoon 1.15: Promise is not transparently awaited into a Lua number.
      expect(rtype).not.toBe('number');
      expect(['userdata', 'table']).toContain(rtype);
    } finally {
      await lua.global.close?.();
    }
  });

  it('Lua closure passed as second argument has type function or userdata', async () => {
    const factory = new LuaFactory();
    const lua = await factory.createEngine({ injectObjects: true });
    try {
      lua.global.set('echoType', (...args: unknown[]) => {
        const second = args[1];
        return typeof second;
      });
      await lua.doString(`
        local t = echoType("a", function() end)
        _G.__secondArgType = t
      `);
      const t = lua.global.get('__secondArgType') as string;
      expect(['function', 'userdata']).toContain(t);
    } finally {
      await lua.global.close?.();
    }
  });

  it('JS function that returns Promise.resolve synchronously from JS POV still yields non-number to Lua', async () => {
    const factory = new LuaFactory();
    const lua = await factory.createEngine({ injectObjects: true });
    try {
      lua.global.set('promFive', () => Promise.resolve(5));
      await lua.doString(`
        local r = promFive()
        _G.__ptype = type(r)
      `);
      const ptype = lua.global.get('__ptype') as string;
      expect(ptype).not.toBe('number');
    } finally {
      await lua.global.close?.();
    }
  });
});
