import { createSandboxId, createSandboxScript, Luarizer } from '@luarizer/luarizer';

/**
 * Minimal lifecycle-style demo: load a chunk defining `update`, invoke it, assert slot-local state.
 */
export async function runDuckStyleLifecycleEmulation(): Promise<void> {
  const runtime = Luarizer.createWasmRuntime();
  const sandbox = await runtime.createSandbox({ slotKey: createSandboxId('duckstyle-entity-1') });

  const load = await sandbox.run({
    script: createSandboxScript(`
      function update(dt)
        __tick = (__tick or 0) + dt
      end
    `),
  });
  if (load._tag !== 'ok') {
    throw new Error('load failed');
  }

  const step = await sandbox.run({
    script: createSandboxScript(`
      update(2)
      assert(__tick == 2, "tick: " .. tostring(__tick))
    `),
  });
  if (step._tag !== 'ok') {
    const msg =
      step._tag === 'err' && step.error._tag === 'AdapterError' ? step.error.message : JSON.stringify(step.error);
    throw new Error(`step failed: ${msg}`);
  }

  await sandbox.dispose();
}
