/**
 * Build-time type helpers for host surfaces. Used with Zod-backed builders in `@microverse.ts/host-surface`.
 */

/** Union of capability ids from a bridge method map. */
export type InferMethodCapability<M> = M extends { readonly capability: infer C extends string }
  ? C
  : never;

export type InferBridgeCapabilities<B> = B extends Readonly<Record<string, unknown>>
  ? InferMethodCapability<B[keyof B]>
  : never;

export type InferSurfaceCapabilities<TSpec extends Readonly<Record<string, Readonly<Record<string, unknown>>>>> =
  InferBridgeCapabilities<TSpec[keyof TSpec]>;

/** Payload type for a component hook map entry (Zod object schemas). */
export type InferHookPayload<
  THooks extends Readonly<Record<string, { _output: unknown }>>,
  TKind extends keyof THooks & string,
> = THooks[TKind] extends { _output: infer O } ? O : never;

export type BridgeMethodEntry<
  TSpec extends Readonly<Record<string, Readonly<Record<string, unknown>>>>,
  TBridge extends keyof TSpec & string,
  TMethod extends keyof TSpec[TBridge] & string,
> = TSpec[TBridge][TMethod];
