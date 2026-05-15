import { describe, expect, it } from 'vitest';

import { createMicroverseInstanceId } from '../../domain/runtime/MicroverseInstanceId';
import { createMicroverseScript } from '../../domain/microverse/MicroverseScript';
import { ConsoleLogger } from '../logging/ConsoleLogger';
import { StubRuntimeAdapter } from '../runtime/StubRuntimeAdapter';
import { createStubMicroverseRuntime } from '../runtime/StubMicroverseRuntime';
import { IsolatedMicroverseRuntimeMap } from './IsolatedMicroverseRuntimeMap';

describe('Isolated sandbox composition (N runtimes)', () => {
  it('runs independent scripts on two registered stub runtimes', async () => {
    const map = new IsolatedMicroverseRuntimeMap();
    const a = createMicroverseInstanceId('entity-a');
    const b = createMicroverseInstanceId('entity-b');

    map.register(
      a,
      createStubMicroverseRuntime({ adapter: new StubRuntimeAdapter(), logger: new ConsoleLogger() }),
    );
    map.register(
      b,
      createStubMicroverseRuntime({ adapter: new StubRuntimeAdapter(), logger: new ConsoleLogger() }),
    );

    const ra = map.get(a);
    const rb = map.get(b);
    expect(ra).toBeDefined();
    expect(rb).toBeDefined();

    const sa = await ra!.createMicroverse({});
    const sb = await rb!.createMicroverse({});

    const pa = await sa.run({ script: createMicroverseScript('a') });
    const pb = await sb.run({ script: createMicroverseScript('b') });
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
