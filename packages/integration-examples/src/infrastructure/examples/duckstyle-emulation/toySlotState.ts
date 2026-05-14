import type { ToyEntityId, ToyScriptHook } from './types';

export function toySlotKey(entityId: ToyEntityId, scriptId: string): string {
  return `${entityId}::${scriptId}`;
}

export type ToySlotState = {
  readonly slotKey: string;
  readonly entityId: ToyEntityId;
  readonly scriptId: string;
  enabled: boolean;
  readonly declaredHooks: ReadonlySet<ToyScriptHook>;
};
