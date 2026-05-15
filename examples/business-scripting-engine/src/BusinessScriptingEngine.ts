import {
  createHostWorkflowHub,
  fixedTimeout,
  type CapabilityId,
  type HostWorkflowHub,
  type TimeoutPolicy,
} from '@luarizer/luarizer';

import surface from './businessSurface.js';
import type { BusinessDomainEvent } from './domain/events/businessDomainEvent.js';
import { businessWorkflowHooks } from './schemas/workflows/businessWorkflowHooks.js';
import type { BusinessEngineHost } from './services/businessEngineHost.js';
import type { z } from 'zod';

export type { BusinessDomainEvent } from './domain/events/businessDomainEvent.js';

export type BusinessScriptingEngineOptions = {
  /** Per-chunk wall-clock limit (default 30s). Combine with Wasm instruction budget in `@luarizer/runtime-wasm`. */
  readonly defaultTimeout?: TimeoutPolicy | undefined;
  /**
   * Lua library chunks loaded into **every** workflow slot (same `_ENV`, before each workflow script).
   * Prefer this over concatenating preludes per `registerWorkflow`.
   */
  readonly sharedLuaChunks?: readonly string[] | undefined;
};

/**
 * Thin façade: {@link createHostWorkflowHub} with this package’s default surface (Lua uses `workflow:extend()` per slot; many workflows run as separate hub sessions).
 */
export class BusinessScriptingEngine {
  private readonly hub: HostWorkflowHub<BusinessEngineHost>;

  constructor(
    readonly host: BusinessEngineHost,
    options: BusinessScriptingEngineOptions = {},
  ) {
    this.hub = createHostWorkflowHub({
      host,
      surface,
      defaultTimeout: options.defaultTimeout ?? fixedTimeout(30_000),
      sharedLuaChunks: options.sharedLuaChunks,
    });
  }

  readonly registerWorkflow = async (
    workflowId: string,
    luaSource: string,
    allowedCapabilities: readonly CapabilityId[],
    options?: {
      /** Extra prelude for this workflow only (runs after hub `sharedLuaChunks`). */
      readonly injectLuaChunks?: readonly string[] | undefined;
    },
  ): Promise<void> => {
    await this.hub.registerWorkflow({
      workflowId,
      script: luaSource,
      allowedCapabilities,
      injectLuaChunks: options?.injectLuaChunks,
    });
  };

  /**
   * Host → Lua: emit a workflow hook defined on the surface (e.g. `JobDone` when completion is **not** modeled as a bridge return).
   * For async tied to one bridge call, prefer `async fn` handlers and explicit Lua `:await()` or `onComplete`; hooks are for host-pushed events (see job_async_partner.lua).
   * Payload fields must be JSON-serializable literals accepted by `emitToAllWorkflows`.
   */
  readonly emitWorkflowHook = async <K extends keyof typeof businessWorkflowHooks & string>(
    kind: K,
    payload: Readonly<z.infer<(typeof businessWorkflowHooks)[K]>>,
  ): Promise<void> => {
    await this.hub.emitToAllWorkflows(kind, payload);
  };

  readonly dispatch = async (event: BusinessDomainEvent): Promise<void> => {
    if (event.kind === 'OrderPlaced') {
      await this.hub.emitToAllWorkflows('OrderPlaced', {
        orderId: event.orderId,
        amountCents: event.amountCents,
        customerId: event.customerId,
      });
      return;
    }
    await this.hub.emitToAllWorkflows('InventoryLow', { sku: event.sku, unitsLeft: event.unitsLeft });
  };

  readonly dispose = async (): Promise<void> => {
    await this.hub.dispose();
  };
}
