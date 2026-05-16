import type { CapabilityId } from '@microverse.ts/runtime-capabilities';

import type { AnyHostSurfaceMethod, HostSurfaceMethodEntry, HostSurfaceSpec } from './hostSurfaceTypes.js';

type InferMethodCapability<M> = M extends { readonly capability: infer C extends CapabilityId }
  ? C
  : never;

type InferBridgeCapabilities<B> = B extends Readonly<Record<string, unknown>>
  ? InferMethodCapability<B[keyof B]>
  : never;

/**
 * Union of every {@link CapabilityId} declared on methods in a {@link HostSurfaceSpec}
 * (via `requires: 'domain:action'` on each fluent `.method(…)` entry).
 */
export type InferSurfaceCapabilities<TSpec extends HostSurfaceSpec> = InferBridgeCapabilities<
  TSpec[keyof TSpec]
>;

/** Runtime list of capability ids declared on a compiled surface spec. */
export function collectCapabilitiesFromHostSurfaceSpec<const TSpec extends HostSurfaceSpec>(
  spec: TSpec,
): readonly InferSurfaceCapabilities<TSpec>[] {
  const out: CapabilityId[] = [];
  const seen = new Set<string>();
  for (const bridgeName of Object.keys(spec)) {
    const methods = spec[bridgeName]!;
    for (const methodName of Object.keys(methods)) {
      const entry = methods[methodName]! as AnyHostSurfaceMethod;
      const id: CapabilityId = entry.capability;
      const key = String(id);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(id);
      }
    }
  }
  return out as unknown as readonly InferSurfaceCapabilities<TSpec>[];
}

/** Narrows `capabilities` to those declared on the surface (runtime check). */
export function pickSurfaceCapabilities<
  const TSurface extends readonly CapabilityId[],
  const T extends readonly `${string}:${string}`[],
>(
  surfaceCapabilities: TSurface,
  ...capabilities: T
): ReadonlyArray<Extract<TSurface[number], CapabilityId>> {
  const allowed = new Set(surfaceCapabilities.map((c) => String(c)));
  for (const id of capabilities) {
    if (!allowed.has(String(id))) {
      throw new Error(
        `capability not declared on host surface: ${String(id)} (surface has: ${[...allowed].join(', ')})`,
      );
    }
  }
  return capabilities as unknown as ReadonlyArray<Extract<TSurface[number], CapabilityId>>;
}

/** Helper type for method entries that preserve a specific capability literal. */
export type SurfaceCapabilityEntry<TCap extends CapabilityId> = HostSurfaceMethodEntry<
  unknown,
  unknown,
  unknown
> & { readonly capability: TCap };
