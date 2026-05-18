export {
  SURFACE_SPEC_SCHEMA_VERSION,
  MICROVERSE_SCRIPT_PROFILE_LUA_1,
  type SurfaceSpecDocument,
  type SurfaceSpecBridge,
  type SurfaceSpecMethod,
  type SurfaceSpecComponentType,
  type SurfaceSpecScriptProfile,
  type SurfaceSpecSchemaVersion,
  type BuildSurfaceSpecDocumentOptions,
} from './domain/SurfaceSpecDocument';
export type { SurfaceSpecBridgeInput } from './domain/SurfaceSpecBridgeInput';
export {
  type InferSurfaceCapabilities,
  type InferHookPayload,
  type InferMethodCapability,
  type InferBridgeCapabilities,
  type BridgeMethodEntry,
} from './domain/typeOperators';
export { collectCapabilitiesFromDocument } from './application/collectCapabilitiesFromDocument';
export { bridgeNamesForCapabilities } from './application/bridgeNamesForCapabilities';
export { validateSurfaceSpecDocument } from './application/validateSurfaceSpecDocument';
export {
  assembleSurfaceSpecDocument,
  type AssembleSurfaceSpecDocumentInput,
} from './application/assembleSurfaceSpecDocument';
export { parseSurfaceSpecJson } from './infrastructure/parseSurfaceSpecJson';
