export type CapabilityId = string & { readonly __brand: 'CapabilityId' };

export function createCapabilityId(value: `${string}:${string}`): CapabilityId {
  return value as CapabilityId;
}
