import { compileHostSurfaceFor } from '../../application/useCases/compileHostSurface.js';
import type { SchemaValidationPort } from '../../application/ports/SchemaValidationPort.js';
import type { InferSurfaceCapabilities } from '../../domain/surfaceCapabilities.js';
import { normalizeMethodDef, type SurfaceMethodDef } from '../../domain/surfaceMethodDef.js';
import { assertSafeObjectKey, createNullPrototypeRecord } from '../../domain/safeObjectKey.js';
import type {
  AnyHostSurfaceMethod,
  HostSurface,
  HostSurfaceSpec,
  HostComponentHooksSpec,
} from '../../domain/hostSurfaceTypes.js';

type MutableHostSurfaceSpec = Record<string, Record<string, AnyHostSurfaceMethod>>;

/**
 * Fluent builder for a host surface. Created via {@link defineHostSurfaceFor} / {@link defineHostSurface} factory overloads.
 */
export class SurfaceBuilder<
  THost,
  const THooks extends HostComponentHooksSpec | undefined = undefined,
> {
  private readonly spec: MutableHostSurfaceSpec = createNullPrototypeRecord();

  private componentHooksSpec: THooks;

  private readonly ports: readonly [SchemaValidationPort];

  constructor(
    ports: readonly [SchemaValidationPort],
    componentHooks?: THooks,
    initialSpec?: MutableHostSurfaceSpec,
  ) {
    this.ports = ports;
    this.componentHooksSpec = componentHooks as THooks;
    if (initialSpec !== undefined) {
      for (const bridgeName of Object.keys(initialSpec)) {
        assertSafeObjectKey('bridge', bridgeName);
        const srcBridge = initialSpec[bridgeName]!;
        const bridge = createNullPrototypeRecord<Record<string, AnyHostSurfaceMethod>>();
        for (const methodName of Object.keys(srcBridge)) {
          assertSafeObjectKey('method', methodName);
          bridge[methodName] = srcBridge[methodName]!;
        }
        this.spec[bridgeName] = bridge;
      }
    }
  }

  /** Opens a Lua bridge table (e.g. `orders`, `greet`). */
  bridge<const B extends string>(name: B): BridgeBuilder<THost, B, THooks> {
    return new BridgeBuilder(this, name);
  }

  /** Attaches component domain-event Zod schemas (emitted into `.d.lua` as `on*` methods on `Component`). */
  componentHooks<const H extends HostComponentHooksSpec>(hooks: H): SurfaceBuilder<THost, H> {
    return new SurfaceBuilder<THost, H>(this.ports, hooks, this.spec);
  }

  /** Compiles the accumulated spec into a {@link HostSurface}. */
  build(): THooks extends HostComponentHooksSpec
    ? HostSurface<THooks, InferSurfaceCapabilities<HostSurfaceSpec>>
    : HostSurface<undefined, InferSurfaceCapabilities<HostSurfaceSpec>> {
    const spec = this.spec as HostSurfaceSpec;
    return compileHostSurfaceFor(this.ports, spec, this.componentHooksSpec);
  }

  /** @internal */
  addMethod<const B extends string, const M extends string>(
    bridgeName: B,
    methodName: M,
    entry: AnyHostSurfaceMethod,
  ): SurfaceBuilder<THost, THooks> {
    assertSafeObjectKey('bridge', bridgeName);
    assertSafeObjectKey('method', methodName);
    let bridge = this.spec[bridgeName];
    if (bridge === undefined) {
      bridge = createNullPrototypeRecord<Record<string, AnyHostSurfaceMethod>>();
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
  THooks extends HostComponentHooksSpec | undefined,
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
