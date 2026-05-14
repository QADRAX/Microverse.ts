import { describe, expect, it } from 'vitest';

import { createSandboxId } from '../../domain/sandbox/SandboxId';
import { createSandboxScript } from '../../domain/sandbox/SandboxScript';
import { ConsoleLogger } from '../logging/ConsoleLogger';
import { StubRuntimeAdapter } from './StubRuntimeAdapter';
import { createStubSandboxRuntime } from './StubSandboxRuntime';

describe('StubSandboxRuntime', () => {
  it('executes scripts via the stub adapter', async () => {
    const runtime = createStubSandboxRuntime({
      adapter: new StubRuntimeAdapter(),
      logger: new ConsoleLogger(),
    });
    const sandbox = await runtime.createSandbox({});
    const result = await sandbox.run({ script: createSandboxScript('return 1') });
    expect(result._tag).toBe('ok');
    if (result._tag === 'ok') {
      expect(result.value.output).toContain('stub:');
    }
  });

  it('rejects duplicate slotKey in the same runtime', async () => {
    const runtime = createStubSandboxRuntime({
      adapter: new StubRuntimeAdapter(),
      logger: new ConsoleLogger(),
    });
    const k = createSandboxId('same-slot');
    await runtime.createSandbox({ slotKey: k });
    await expect(runtime.createSandbox({ slotKey: k })).rejects.toThrow(/duplicate slotKey/);
  });
});
