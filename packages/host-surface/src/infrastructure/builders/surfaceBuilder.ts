import { compileHostSurfaceFor } from '../../application/useCases/compileHostSurface.js';
import type { SchemaValidationPort } from '../../application/ports/SchemaValidationPort.js';
import type { InferSurfaceCapabilities } from '../../domain/surfaceCapabilities.js';
import { normalizeMethodDef, type SurfaceMethodDef } from '../../domain/surfaceMethodDef.js';
import type {
  AnyHostSurfaceMethod,
  HostSurface,
  HostSurfaceSpec,
  HostWorkflowHooksSpec,
} from '../../domain/hostSurfaceTypes.js';

type MutableHostSurfaceSpec = Record<string, Record<string, AnyHostSurfaceMethod>>;

/**
 * Fluent builder for a host surface. Created via {@link defineHostSurfaceFor} / {@link defineHostSurface} factory overloads.
 */
export class SurfaceBuilder<
  THost,
  const THooks extends HostWorkflowHooksSpec | undefined = undefined,
> {
  private readonly spec: MutableHostSurfaceSpec = {};

  private workflowHooksSpec: THooks;

  private readonly ports: readonly [SchemaValidationPort];

  constructor(
    ports: readonly [SchemaValidationPort],
    workflowHooks?: THooks,
    initialSpec?: MutableHostSurfaceSpec,
  ) {
    this.ports = ports;
    this.workflowHooksSpec = workflowHooks as THooks;
    if (initialSpec !== undefined) {
      for (const bridgeName of Object.keys(initialSpec)) {
        this.spec[bridgeName] = { ...initialSpec[bridgeName] };
      }
    }
  }

  /** Opens a Lua bridge table (e.g. `orders`, `greet`). */
  bridge<const B extends string>(name: B): BridgeBuilder<THost, B, THooks> {
    return new BridgeBuilder(this, name);
  }

  /** Attaches workflow hook Zod schemas (emitted into `.d.lua` as `on*` methods). */
  workflowHooks<const H extends HostWorkflowHooksSpec>(hooks: H): SurfaceBuilder<THost, H> {
    return new SurfaceBuilder<THost, H>(this.ports, hooks, this.spec);
  }

  /** Compiles the accumulated spec into a {@link HostSurface}. */
  build(): THooks extends HostWorkflowHooksSpec
    ? HostSurface<THooks, InferSurfaceCapabilities<HostSurfaceSpec>>
    : HostSurface<undefined, InferSurfaceCapabilities<HostSurfaceSpec>> {
    const spec = this.spec as HostSurfaceSpec;
    return compileHostSurfaceFor(this.ports, spec, this.workflowHooksSpec) as THooks extends HostWorkflowHooksSpec
      ? HostSurface<THooks, InferSurfaceCapabilities<HostSurfaceSpec>>
      : HostSurface<undefined, InferSurfaceCapabilities<HostSurfaceSpec>>;
  }

  /** @internal */
  addMethod<const B extends string, const M extends string>(
    bridgeName: B,
    methodName: M,
    entry: AnyHostSurfaceMethod,
  ): SurfaceBuilder<THost, THooks> {
    let bridge = this.spec[bridgeName];
    if (bridge === undefined) {
      bridge = {};
      this.spec[bridgeName] = bridge;
    }
    bridge[methodName] = entry;
    return this;
  }
}

/**
 * Per-bridge step in the fluent surface DSL. Return to {@link SurfaceBuilder} via `.method(…)`.
 */
export class BridgeBuilder<
  THost,
  const B extends string,
  THooks extends HostWorkflowHooksSpec | undefined,
> {
  constructor(
    private readonly parent: SurfaceBuilder<THost, THooks>,
    private readonly bridgeName: B,
  ) {}

  /** Registers one method on the current bridge and returns the root builder for chaining. */
  method<const M extends string, TIn, TOut, TCap extends `${string}:${string}`>(
    name: M,
    def: SurfaceMethodDef<THost, TIn, TOut, TCap>,
  ): SurfaceBuilder<THost, THooks> {
    return this.parent.addMethod(this.bridgeName, name, normalizeMethodDef(def));
  }
}
