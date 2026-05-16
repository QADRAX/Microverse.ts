import {
  MicroverseLua,
  type ScriptPropertyBag,
  type TimeoutPolicy,
} from '@microverse.ts/microverse-lua';

import surface from './businessSurface';
import type { BusinessDomainEvent } from './domain/events/businessDomainEvent';
import type { businessComponentHooks } from './schemas/components/businessComponentHooks';
import type { BusinessEngineHost } from './services/businessEngineHost';
import type { z } from 'zod';

export type { BusinessDomainEvent } from './domain/events/businessDomainEvent';

/** Capability ids declared on {@link default} `businessSurface` (for script allowlists). */
export type BusinessSurfaceCapabilities = (typeof surface.capabilities)[number];

export type BusinessScriptingEngineOptions = {
  /** Per-chunk wall-clock limit in milliseconds (default 30_000). Combine with Wasm instruction budget in `@microverse.ts/runtime-wasm`. */
  readonly defaultTimeoutMs?: number | undefined;
  /** Advanced: custom timeout policy (overrides `defaultTimeoutMs` when set). */
  readonly defaultTimeout?: TimeoutPolicy | undefined;
  /**
   * Lua library chunks loaded into **every** script slot (same `_ENV`, before each script's main chunk).
   * Prefer this over concatenating preludes per script definition.
   */
  readonly sharedLuaChunks?: readonly string[] | undefined;
};

/**
 * Thin façade: {@link MicroverseLua.create} with this package's default surface (built-in Wasm Lua VM).
 * Script capabilities come from `surface.pickCapabilities(…)` — see {@link businessSurface.ts}.
 */
export class BusinessScriptingEngine {
  private readonly microverse;

  /** Host surface used for bridges, LuaCATS, and capability allowlists. */
  readonly surface = surface;

  constructor(
    readonly host: BusinessEngineHost,
    options: BusinessScriptingEngineOptions = {},
  ) {
    this.microverse = MicroverseLua.create({
      host,
      surface,
      defaultTimeout: options.defaultTimeout,
      defaultTimeoutMs: options.defaultTimeoutMs ?? 30_000,
      sharedLuaChunks: options.sharedLuaChunks,
    });
  }

  /** Registers a script in the catalog (source, optional per-type preludes). Does not create a Lua slot. */
  readonly registerScriptDefinition = (
    scriptId: string,
    luaSource: string,
    options?: {
      readonly injectLuaChunks?: readonly string[] | undefined;
    },
  ): void => {
    this.microverse.registerScriptDefinition({
      scriptId,
      source: luaSource,
      injectLuaChunks: options?.injectLuaChunks,
    });
  };

  /**
   * Mounts a script instance in its own Wasm slot. Defaults `instanceId` to `scriptId` when omitted.
   */
  readonly mountScriptInstance = async (args: {
    readonly scriptId: string;
    readonly capabilities: ReturnType<typeof surface.pickCapabilities>;
    readonly instanceId?: string | undefined;
    readonly props?: ScriptPropertyBag | undefined;
    readonly audit?: Readonly<Record<string, string | number | boolean>> | undefined;
    readonly injectLuaChunks?: readonly string[] | undefined;
  }): Promise<void> => {
    await this.microverse.mountScriptInstance({
      instanceId: args.instanceId ?? args.scriptId,
      scriptId: args.scriptId,
      capabilities: args.capabilities,
      props: args.props,
      audit: args.audit,
      injectLuaChunks: args.injectLuaChunks,
    });
  };

  readonly unmountScriptInstance = async (instanceId: string): Promise<void> => {
    await this.microverse.unmountScriptInstance(instanceId);
  };

  /**
   * Host → Lua: emit a domain hook to every mounted instance (e.g. `JobDone` when completion is host-driven).
   */
  readonly emitHook = async <K extends keyof typeof businessComponentHooks>(
    kind: K,
    payload: Readonly<z.infer<(typeof businessComponentHooks)[K]>>,
  ): Promise<void> => {
    await this.microverse.emitToAllInstances(kind, payload);
  };

  readonly dispatch = async (event: BusinessDomainEvent): Promise<void> => {
    if (event.kind === 'OrderPlaced') {
      await this.microverse.emitToAllInstances('OrderPlaced', {
        orderId: event.orderId,
        amountCents: event.amountCents,
        customerId: event.customerId,
      });
      return;
    }
    await this.microverse.emitToAllInstances('InventoryLow', { sku: event.sku, unitsLeft: event.unitsLeft });
  };

  readonly dispose = async (): Promise<void> => {
    await this.microverse.dispose();
  };
}
