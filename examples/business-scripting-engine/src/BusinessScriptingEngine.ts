import {
  createLuaMicroverse,
  fixedTimeout,
  type LuaMicroverse,
  type TimeoutPolicy,
} from '@microverse/microverse';

import surface from './businessSurface.js';
import type { BusinessDomainEvent } from './domain/events/businessDomainEvent.js';
import type { businessWorkflowHooks } from './schemas/workflows/businessWorkflowHooks.js';
import type { BusinessEngineHost } from './services/businessEngineHost.js';
import type { z } from 'zod';

export type { BusinessDomainEvent } from './domain/events/businessDomainEvent.js';

/** Capability ids declared on {@link default} `businessSurface` (for script allowlists). */
export type BusinessSurfaceCapabilities = (typeof surface.capabilities)[number];

export type BusinessScriptingEngineOptions = {
  /** Per-chunk wall-clock limit (default 30s). Combine with Wasm instruction budget in `@microverse/runtime-wasm`. */
  readonly defaultTimeout?: TimeoutPolicy | undefined;
  /**
   * Lua library chunks loaded into **every** script slot (same `_ENV`, before each script's main chunk).
   * Prefer this over concatenating preludes per `registerScript`.
   */
  readonly sharedLuaChunks?: readonly string[] | undefined;
};

/**
 * Thin façade: {@link createLuaMicroverse} with this package's default surface.
 * Script capabilities come from `surface.pickCapabilities(…)` — see {@link businessSurface.ts}.
 */
export class BusinessScriptingEngine {
  private readonly microverse: LuaMicroverse<BusinessEngineHost>;

  /** Host surface used for bridges, LuaCATS, and capability allowlists. */
  readonly surface = surface;

  constructor(
    readonly host: BusinessEngineHost,
    options: BusinessScriptingEngineOptions = {},
  ) {
    this.microverse = createLuaMicroverse({
      host,
      surface,
      defaultTimeout: options.defaultTimeout ?? fixedTimeout(30_000),
      sharedLuaChunks: options.sharedLuaChunks,
    });
  }

  readonly registerScript = async (
    scriptId: string,
    luaSource: string,
    capabilities: readonly BusinessSurfaceCapabilities[],
    options?: {
      /** Extra prelude for this script only (runs after microverse `sharedLuaChunks`). */
      readonly injectLuaChunks?: readonly string[] | undefined;
    },
  ): Promise<void> => {
    await this.microverse.registerScript({
      scriptId,
      script: luaSource,
      capabilities,
      injectLuaChunks: options?.injectLuaChunks,
    });
  };

  /**
   * Host → Lua: emit a domain hook to every registered script (e.g. `JobDone` when completion is host-driven).
   */
  readonly emitHook = async <K extends keyof typeof businessWorkflowHooks>(
    kind: K,
    payload: Readonly<z.infer<(typeof businessWorkflowHooks)[K]>>,
  ): Promise<void> => {
    await this.microverse.emitToAllScripts(kind, payload);
  };

  readonly dispatch = async (event: BusinessDomainEvent): Promise<void> => {
    if (event.kind === 'OrderPlaced') {
      await this.microverse.emitToAllScripts('OrderPlaced', {
        orderId: event.orderId,
        amountCents: event.amountCents,
        customerId: event.customerId,
      });
      return;
    }
    await this.microverse.emitToAllScripts('InventoryLow', { sku: event.sku, unitsLeft: event.unitsLeft });
  };

  readonly dispose = async (): Promise<void> => {
    await this.microverse.dispose();
  };
}
