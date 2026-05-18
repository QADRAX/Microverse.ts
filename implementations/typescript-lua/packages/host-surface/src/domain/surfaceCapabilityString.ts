import type { CapabilityId } from '@microverse.ts/runtime-capabilities';

/**
 * Unbranded string literal(s) for capabilities on a surface — use as {@link HostSurfaceCore.pickCapabilities} arguments.
 */
export type SurfaceCapabilityString<TCap extends CapabilityId> = TCap extends CapabilityId &
  (infer S extends `${string}:${string}`)
  ? S
  : TCap extends CapabilityId
    ? `${string}:${string}`
    : never;
