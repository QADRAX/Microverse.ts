import type { CapabilityId } from '@luarizer/runtime-capabilities';

import type { BridgeChannelId } from './BridgeChannelId';

export type BridgeRegistration = {
  readonly channel: BridgeChannelId;
  readonly requiredCapability?: CapabilityId | undefined;
};

export type BridgeHandler = (payload: unknown) => Promise<unknown>;

export type BridgeInvokeMessage = {
  readonly _tag: 'invoke';
  readonly channel: BridgeChannelId;
  readonly requestId: string;
  readonly payload: unknown;
};

export type BridgeResultMessage = {
  readonly _tag: 'result';
  readonly requestId: string;
  readonly payload: unknown;
};

export type BridgeErrorMessage = {
  readonly _tag: 'error';
  readonly requestId: string;
  readonly message: string;
};

export type BridgeMessage = BridgeInvokeMessage | BridgeResultMessage | BridgeErrorMessage;
