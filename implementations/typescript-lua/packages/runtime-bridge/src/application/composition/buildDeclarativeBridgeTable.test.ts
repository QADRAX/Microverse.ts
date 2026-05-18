import { describe, expect, it } from 'vitest';

import type { DeclarativeBridgeDeclaration } from '../../domain/bridge/DeclarativeBridge';
import { buildDeclarativeBridgeTable } from './buildDeclarativeBridgeTable';

type Host = { readonly prefix: string };

describe('buildDeclarativeBridgeTable', () => {
  it('composes named bridge APIs for a slot', () => {
    const host: Host = { prefix: 'H' };
    const declarations: readonly DeclarativeBridgeDeclaration<Host, string>[] = [
      {
        name: 'Echo',
        perEntity: true,
        createApi: (h, slot) => ({
          ping: () => `${h.prefix}:${slot}`,
        }),
      },
      {
        name: 'Math',
        perEntity: false,
        createApi: () => ({
          add: (a: number, b: number) => a + b,
        }),
      },
    ];

    const table = buildDeclarativeBridgeTable(host, 'slot-1', declarations);
    expect((table.Echo as { ping: () => string }).ping()).toBe('H:slot-1');
    expect((table.Math as { add: (a: number, b: number) => number }).add(2, 3)).toBe(5);
  });
});
