import type {
  BridgeApiObject,
  DeclarativeBridgeDeclaration,
} from '../../domain/bridge/DeclarativeBridge';

/**
 * Builds a frozen bridge table: bridge name → API object, ready to pass into a Lua host.
 */
export function buildDeclarativeBridgeTable<THostContext, TSlotKey extends string>(
  host: THostContext,
  slotKey: TSlotKey,
  declarations: readonly DeclarativeBridgeDeclaration<THostContext, TSlotKey>[],
): Readonly<Record<string, BridgeApiObject>> {
  const out: Record<string, BridgeApiObject> = {};
  for (const d of declarations) {
    if (Object.prototype.hasOwnProperty.call(out, d.name)) {
      throw new Error(`duplicate bridge name: ${d.name}`);
    }
    out[d.name] = Object.freeze(d.createApi(host, slotKey));
  }
  return Object.freeze(out);
}
