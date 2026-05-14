import { createSandboxId, createSandboxScript, Luarizer } from '@luarizer/luarizer';

/**
 * Example: two stable slots in one Wasmoon VM, globals must not leak between slots.
 * Consumes only the `@luarizer/luarizer` facade (typical app dependency).
 */
export async function runTwoSlotsWasmExample(): Promise<void> {
  const runtime = Luarizer.createWasmRuntime();
  const slotA = createSandboxId('consumer-slot-a');
  const slotB = createSandboxId('consumer-slot-b');
  const sandboxA = await runtime.createSandbox({ slotKey: slotA });
  const sandboxB = await runtime.createSandbox({ slotKey: slotB });

  const r1 = await sandboxA.run({ script: createSandboxScript('x = 99') });
  if (r1._tag !== 'ok') {
    throw new Error('slot A failed');
  }

  const r2 = await sandboxB.run({
    script: createSandboxScript('assert(x ~= 99, "global leaked between slots")'),
  });
  if (r2._tag !== 'ok') {
    const detail =
      r2._tag === 'err' && r2.error._tag === 'AdapterError' ? r2.error.message : JSON.stringify(r2.error);
    throw new Error(`slot B failed: ${detail}`);
  }

  await sandboxA.dispose();
  await sandboxB.dispose();
}
