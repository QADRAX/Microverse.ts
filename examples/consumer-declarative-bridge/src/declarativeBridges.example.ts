import { buildDeclarativeBridgeTable, type DeclarativeBridgeDeclaration } from '@luarizer/luarizer';

type DemoHost = { readonly prefix: string };

/**
 * Example: compose bridge APIs for one slot from declarative factories.
 */
export function runDeclarativeBridgesExample(): { readonly ping: string } {
  const host: DemoHost = { prefix: 'demo' };
  const declarations: readonly DeclarativeBridgeDeclaration<DemoHost, 'slot-x'>[] = [
    {
      name: 'Echo',
      perEntity: true,
      createApi: (h, slot) => ({
        ping: () => `${h.prefix}:${slot}`,
      }),
    },
  ];
  const table = buildDeclarativeBridgeTable(host, 'slot-x', declarations);
  return { ping: (table.Echo as { ping: () => string }).ping() };
}
