import type { ToyScriptingSession } from './toyScriptingSession';
import type { ToyScriptHook } from './types';

/** Análogo de `runHookOnAllSlots` en `scripting-lua/src/domain/slots/slots.ts`. */
export async function runToyHookOnAllSlots(
  session: ToyScriptingSession,
  hook: ToyScriptHook,
  dt: number,
): Promise<void> {
  const { slots, sandbox } = session;
  for (const [key, slot] of slots) {
    if (!slot.enabled) {
      continue;
    }
    if (!slot.declaredHooks.has(hook)) {
      continue;
    }
    const success = await sandbox.callHook(key, hook, dt);
    if (!success) {
      slot.enabled = false;
    }
  }
}
