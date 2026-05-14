import type { BridgeRegistry } from '../../domain/bridge/BridgeRegistry';
import type { BridgeChannelId } from '../../domain/bridge/BridgeChannelId';
import type { BridgeHandler } from '../../domain/bridge/BridgeMessage';

export class InMemoryBridgeRegistry implements BridgeRegistry {
  private readonly handlers = new Map<BridgeChannelId, BridgeHandler>();

  readonly register = (channel: BridgeChannelId, handler: BridgeHandler): void => {
    if (this.handlers.has(channel)) {
      throw new Error('duplicate');
    }
    this.handlers.set(channel, handler);
  };

  readonly invoke = async (channel: BridgeChannelId, payload: unknown): Promise<unknown> => {
    const handler = this.handlers.get(channel);
    if (!handler) {
      throw new Error('unknown_channel');
    }
    return handler(payload);
  };
}
