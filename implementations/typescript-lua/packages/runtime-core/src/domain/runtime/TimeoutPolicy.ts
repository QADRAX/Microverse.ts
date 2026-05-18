export type TimeoutPolicy =
  | { readonly kind: 'none' }
  | { readonly kind: 'fixed'; readonly milliseconds: number };

export const noTimeout: TimeoutPolicy = { kind: 'none' };

export function fixedTimeout(milliseconds: number): TimeoutPolicy {
  return { kind: 'fixed', milliseconds };
}
