export type { BridgeCapabilityAssertion } from './domain/bridge/BridgeCapabilityAssertion';
export { createBridgeChannelId, type BridgeChannelId } from './domain/bridge/BridgeChannelId';
export type {
  BridgeErrorMessage,
  BridgeHandler,
  BridgeInvokeMessage,
  BridgeMessage,
  BridgeRegistration,
  BridgeResultMessage,
} from './domain/bridge/BridgeMessage';
export type { BridgeRegistry } from './domain/bridge/BridgeRegistry';
export type {
  BridgeApiObject,
  DeclarativeBridgeDeclaration,
  DeclarativeBridgeFactory,
} from './domain/bridge/DeclarativeBridge';
export { buildDeclarativeBridgeTable } from './application/composition/buildDeclarativeBridgeTable';
export { createRegistryBackedAssertion } from './infrastructure/gates/RegistryBackedAssertion';
export { BridgeCoordinator, type BridgeCoordinatorDeps } from './infrastructure/facade/BridgeCoordinator';
export { InMemoryBridgeRegistry } from './infrastructure/registry/InMemoryBridgeRegistry';
