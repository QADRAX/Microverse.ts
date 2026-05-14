import type { ToyScene } from './toyScene';
import type { ToyScriptingSession } from './toyScriptingSession';
import type { ToySlotState } from './toySlotState';
import { toySlotKey } from './toySlotState';
import type { ToyEntityId } from './types';

/**
 * Equivalente mínimo de la parte “crear slots para scripts de esta entidad” de `reconcileSlots` en Duck.
 */
export async function reconcileToyEntityScripts(
  session: ToyScriptingSession,
  scene: ToyScene,
  entityId: ToyEntityId,
): Promise<void> {
  const entity = scene.get(entityId);
  if (entity === undefined) {
    return;
  }

  const { slots, sandbox } = session;

  for (const ref of entity.scripts) {
    if (!ref.enabled) {
      continue;
    }
    const key = toySlotKey(entityId, ref.scriptId);
    if (slots.has(key)) {
      continue;
    }

    const declared = new Set(sandbox.detectHooks(ref.source));
    await sandbox.createSlot(key, ref.source);

    const slot: ToySlotState = {
      slotKey: key,
      entityId,
      scriptId: ref.scriptId,
      enabled: true,
      declaredHooks: declared,
    };
    slots.set(key, slot);

    if (declared.has('init')) {
      const ok = await sandbox.callHook(key, 'init', 0);
      if (!ok) {
        slot.enabled = false;
      }
    }
    if (slot.enabled && declared.has('onEnable')) {
      const ok = await sandbox.callHook(key, 'onEnable', 0);
      if (!ok) {
        slot.enabled = false;
      }
    }
  }
}
