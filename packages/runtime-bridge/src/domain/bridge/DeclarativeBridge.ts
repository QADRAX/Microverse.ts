/**
 * Object exposed to Lua under one bridge name (e.g. `Transform`, `Scene`).
 * Keys are method names; values are typically functions.
 */
export type BridgeApiObject = Record<string, unknown>;

/**
 * Builds one bridge API for a host-defined context and slot key.
 * When `perEntity` is false on the declaration, implementations may ignore `slotKey`.
 */
export type DeclarativeBridgeFactory<THostContext, TSlotKey extends string = string> = (
  host: THostContext,
  slotKey: TSlotKey,
) => BridgeApiObject;

export type DeclarativeBridgeDeclaration<THostContext, TSlotKey extends string = string> = {
  readonly name: string;
  /** When true, factories should scope APIs using `slotKey` (e.g. entity id). */
  readonly perEntity: boolean;
  readonly createApi: DeclarativeBridgeFactory<THostContext, TSlotKey>;
};
