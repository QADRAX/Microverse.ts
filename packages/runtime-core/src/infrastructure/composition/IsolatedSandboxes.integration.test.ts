import { describe, expect, it } from 'vitest';

import { createSandboxInstanceId } from '../../domain/runtime/SandboxInstanceId';
import { createSandboxScript } from '../../domain/sandbox/SandboxScript';
import { ConsoleLogger } from '../logging/ConsoleLogger';
import { StubRuntimeAdapter } from '../runtime/StubRuntimeAdapter';
import { createStubSandboxRuntime } from '../runtime/StubSandboxRuntime';
import { IsolatedSandboxRuntimeMap } from './IsolatedSandboxRuntimeMap';

describe('Isolated sandbox composition (N runtimes)', () => {
  it('runs independent scripts on two registered stub runtimes', async () => {
    const map = new IsolatedSandboxRuntimeMap();
    const a = createSandboxInstanceId('entity-a');
    const b = createSandboxInstanceId('entity-b');

    map.register(
      a,
      createStubSandboxRuntime({ adapter: new StubRuntimeAdapter(), logger: new ConsoleLogger() }),
    );
    map.register(
      b,
      createStubSandboxRuntime({ adapter: new StubRuntimeAdapter(), logger: new ConsoleLogger() }),
    );

    const ra = map.get(a);
    const rb = map.get(b);
    expect(ra).toBeDefined();
    expect(rb).toBeDefined();

    const sa = await ra!.createSandbox({});
    const sb = await rb!.createSandbox({});

    const pa = await sa.run({ script: createSandboxScript('a') });
    const pb = await sb.run({ script: createSandboxScript('b') });
    expect(pa._tag).toBe('ok');
    expect(pb._tag).toBe('ok');
    if (pa._tag === 'ok' && pb._tag === 'ok') {
      expect(pa.value.output).toContain('stub:a');
      expect(pb.value.output).toContain('stub:b');
    }

    await sa.dispose();
    await sb.dispose();
    map.unregister(a);
    map.unregister(b);
  });
});
