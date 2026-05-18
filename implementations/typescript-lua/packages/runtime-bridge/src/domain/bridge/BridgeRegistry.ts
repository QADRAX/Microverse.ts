import type { BridgeChannelId } from './BridgeChannelId';
import type { BridgeHandler } from './BridgeMessage';

export type BridgeRegistry = {
  readonly register: (channel: BridgeChannelId, handler: BridgeHandler) => void;
  readonly invoke: (channel: BridgeChannelId, payload: unknown) => Promise<unknown>;
};
