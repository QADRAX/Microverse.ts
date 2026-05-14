import { reconcileToyEntityScripts } from './reconcileToyEntityScripts';
import { runToyHookOnAllSlots } from './runToyHookOnAllSlots';
import { createToyScriptingSession, type ToyScriptingSession } from './toyScriptingSession';
import type { ToyScene } from './toyScene';
import type { ToyEntityId } from './types';

/**
 * Forma análoga a `createScriptingSubsystem` en Duck: estado de sesión + callbacks de fase.
 * No usa `createSceneSubsystem` de `core-v2`; solo refleja **dónde** encajaría en un motor real.
 */
export type ToyScriptingStack = {
  readonly session: ToyScriptingSession;
  readonly reconcileEntityFromScene: (scene: ToyScene, entityId: ToyEntityId) => Promise<void>;
  readonly runPhaseUpdate: (dt: number) => Promise<void>;
  readonly dispose: () => Promise<void>;
};

export function createToyScriptingStack(): ToyScriptingStack {
  const session = createToyScriptingSession();
  return {
    session,
    reconcileEntityFromScene: (scene, entityId) => reconcileToyEntityScripts(session, scene, entityId),
    runPhaseUpdate: (dt) => runToyHookOnAllSlots(session, 'update', dt),
    dispose: async () => {
      session.slots.clear();
      await session.sandbox.dispose();
    },
  };
}
