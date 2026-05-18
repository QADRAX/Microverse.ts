import { describe, expect, it } from 'vitest';

import { createMicroverseId } from '../../domain/microverse/MicroverseId';
import { createMicroverseScript } from '../../domain/microverse/MicroverseScript';
import { ConsoleLogger } from '../logging/ConsoleLogger';
import { StubRuntimeAdapter } from './StubRuntimeAdapter';
import { createStubMicroverseRuntime } from './StubMicroverseRuntime';

describe('StubMicroverseRuntime', () => {
  it('executes scripts via the stub adapter', async () => {
    const runtime = createStubMicroverseRuntime({
      adapter: new StubRuntimeAdapter(),
      logger: new ConsoleLogger(),
    });
    const microverse = await runtime.createMicroverse({});
    const result = await microverse.run({ script: createMicroverseScript('return 1') });
    expect(result._tag).toBe('ok');
    if (result._tag === 'ok') {
      expect(result.value.output).toContain('stub:');
    }
  });

  it('rejects duplicate slotKey in the same runtime', async () => {
    const runtime = createStubMicroverseRuntime({
      adapter: new StubRuntimeAdapter(),
      logger: new ConsoleLogger(),
    });
    const k = createMicroverseId('same-slot');
    await runtime.createMicroverse({ slotKey: k });
    await expect(runtime.createMicroverse({ slotKey: k })).rejects.toThrow(/duplicate slotKey/);
  });
});
