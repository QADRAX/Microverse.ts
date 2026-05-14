import { createToyEntityId } from './types';
import { createToyScene, type ToyEntity } from './toyScene';
import { toySlotKey } from './toySlotState';
import { createToyScriptingStack } from './toyScriptingSubsystem';

const COUNTER_SCRIPT = `
counter = 0
function init(dt)
  counter = 1
end
function onEnable(dt)
  counter = counter + 10
end
function update(dt)
  counter = counter + dt
end
`.trim();

/**
 * Escenario: una entidad con un script; reconciliar; varias fases `update`;
 * comprobar estado Lua vía `assertGlobalNumber` (equivalente a tests de invariantes en Duck).
 */
export async function runDuckStyleLifecycleEmulation(): Promise<void> {
  const stack = createToyScriptingStack();
  try {
    const entityId = createToyEntityId('player');
    const entity: ToyEntity = {
      id: entityId,
      scripts: [{ scriptId: 'behaviors/counter', source: COUNTER_SCRIPT, enabled: true }],
    };
    const scene = createToyScene([entity]);
    await stack.reconcileEntityFromScene(scene, entityId);

    const key = toySlotKey(entityId, 'behaviors/counter');
    await stack.session.sandbox.assertGlobalNumber(key, 'counter', 11);

    await stack.runPhaseUpdate(1);
    await stack.session.sandbox.assertGlobalNumber(key, 'counter', 12);

    await stack.runPhaseUpdate(1);
    await stack.session.sandbox.assertGlobalNumber(key, 'counter', 13);
  } finally {
    await stack.dispose();
  }
}
