import type {
  BuildSurfaceSpecDocumentOptions,
  SurfaceSpecComponentType,
  SurfaceSpecDocument,
} from '../domain/SurfaceSpecDocument';
import { SURFACE_SPEC_SCHEMA_VERSION } from '../domain/SurfaceSpecDocument';
import { collectCapabilitiesFromDocument } from './collectCapabilitiesFromDocument';
import type { SurfaceSpecBridgeInput } from '../domain/SurfaceSpecBridgeInput';
import { validateSurfaceSpecDocument } from './validateSurfaceSpecDocument';

export type AssembleSurfaceSpecDocumentInput = {
  readonly bridges: Readonly<Record<string, SurfaceSpecBridgeInput>>;
  readonly componentTypes: Readonly<Record<string, SurfaceSpecComponentType>>;
  readonly componentHooks?: Readonly<Record<string, unknown>> | undefined;
  readonly capabilities?: readonly string[] | undefined;
  readonly options?: BuildSurfaceSpecDocumentOptions | undefined;
};

/**
 * Builds a validated {@link SurfaceSpecDocument} from neutral bridge/component data.
 * Used by host-surface after Zod → JSON Schema conversion.
 */
export function assembleSurfaceSpecDocument(
  input: AssembleSurfaceSpecDocumentInput,
): SurfaceSpecDocument {
  const draft: SurfaceSpecDocument = {
    schemaVersion: SURFACE_SPEC_SCHEMA_VERSION,
    ...(input.options?.scriptProfile !== undefined
      ? { scriptProfile: input.options.scriptProfile }
      : {}),
    capabilities: input.capabilities ?? [],
    bridges: input.bridges,
    componentTypes: input.componentTypes,
    ...(input.componentHooks !== undefined ? { componentHooks: input.componentHooks } : {}),
  };

  const computed = collectCapabilitiesFromDocument(draft);
  const capabilities =
    draft.capabilities.length > 0
      ? [...draft.capabilities].sort((a, b) => a.localeCompare(b))
      : [...computed].sort((a, b) => a.localeCompare(b));

  const doc: SurfaceSpecDocument = { ...draft, capabilities };
  validateSurfaceSpecDocument(doc);
  return doc;
}
