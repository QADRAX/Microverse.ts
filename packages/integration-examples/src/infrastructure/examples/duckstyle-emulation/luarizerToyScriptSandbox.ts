import {
  createSandboxScript,
  createSlotKey,
  Luarizer,
  type Sandbox,
  type SandboxRuntime,
} from '@luarizer/luarizer';

import type { ToyScriptHook } from './types';
import { TOY_SCRIPT_HOOKS } from './types';

/**
 * Puerto mínimo inspirado en `ScriptSandbox` de Duck (`domain/ports/scriptSandbox.ts`).
 * Aquí `callHook` es async porque `Sandbox.run` en Luarizer es asíncrono.
 */
export type ToyScriptSandboxPort = {
  readonly detectHooks: (source: string) => readonly ToyScriptHook[];
  readonly createSlot: (slotKey: string, source: string) => Promise<void>;
  readonly destroySlot: (slotKey: string) => Promise<void>;
  readonly callHook: (slotKey: string, hook: ToyScriptHook, dt: number) => Promise<boolean>;
  /** Solo para tests / demos: comprueba un global numérico en el entorno del slot. */
  readonly assertGlobalNumber: (slotKey: string, name: string, expected: number) => Promise<void>;
  readonly dispose: () => Promise<void>;
};

/**
 * Implementación de juguete: un `SandboxRuntime` de Luarizer + un `Sandbox` por slot.
 * Carga el fuente una vez; los hooks son funciones globales en el entorno del slot (convención demo).
 */
export class LuarizerToyScriptSandboxAdapter implements ToyScriptSandboxPort {
  private readonly runtime: SandboxRuntime;

  private readonly sandboxes = new Map<string, Sandbox>();

  constructor() {
    this.runtime = Luarizer.createWasmRuntime();
  }

  readonly detectHooks = (source: string): readonly ToyScriptHook[] => {
    const out: ToyScriptHook[] = [];
    for (const h of TOY_SCRIPT_HOOKS) {
      const re = new RegExp(`function\\s+${h}\\s*\\(`);
      if (re.test(source)) {
        out.push(h);
      }
    }
    return out;
  };

  readonly createSlot = async (slotKey: string, source: string): Promise<void> => {
    if (this.sandboxes.has(slotKey)) {
      return;
    }
    const sandbox = await this.runtime.createSandbox({ slotKey: createSlotKey(slotKey) });
    this.sandboxes.set(slotKey, sandbox);
    const load = await sandbox.run({ script: createSandboxScript(source) });
    if (load._tag !== 'ok') {
      this.sandboxes.delete(slotKey);
      await sandbox.dispose();
      throw new Error('slot load failed');
    }
  };

  readonly destroySlot = async (slotKey: string): Promise<void> => {
    const sb = this.sandboxes.get(slotKey);
    if (sb === undefined) {
      return;
    }
    this.sandboxes.delete(slotKey);
    await sb.dispose();
  };

  readonly callHook = async (slotKey: string, hook: ToyScriptHook, dt: number): Promise<boolean> => {
    const sb = this.sandboxes.get(slotKey);
    if (sb === undefined) {
      return false;
    }
    const chunk = [
      `local h = ${JSON.stringify(hook)}`,
      `local f = _ENV[h]`,
      `if type(f) == "function" then f(${Number(dt)}) end`,
    ].join('\n');
    const r = await sb.run({ script: createSandboxScript(chunk) });
    return r._tag === 'ok';
  };

  readonly assertGlobalNumber = async (
    slotKey: string,
    name: string,
    expected: number,
  ): Promise<void> => {
    const sb = this.sandboxes.get(slotKey);
    if (sb === undefined) {
      throw new Error(`no sandbox for slot ${slotKey}`);
    }
    const r = await sb.run({
      script: createSandboxScript(
        `assert(type(${name}) == "number" and ${name} == ${expected}, "bad " .. "${name}" .. ": " .. tostring(${name}))`,
      ),
    });
    if (r._tag !== 'ok') {
      throw new Error(r._tag === 'err' && r.error._tag === 'AdapterError' ? r.error.message : 'assert failed');
    }
  };

  readonly dispose = async (): Promise<void> => {
    const keys = [...this.sandboxes.keys()];
    for (const k of keys) {
      await this.destroySlot(k);
    }
  };
}
