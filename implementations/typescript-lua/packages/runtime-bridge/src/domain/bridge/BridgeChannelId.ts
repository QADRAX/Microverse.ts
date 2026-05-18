export type BridgeChannelId = string & { readonly __brand: 'BridgeChannelId' };

export function createBridgeChannelId(value: string): BridgeChannelId {
  return value as BridgeChannelId;
}
