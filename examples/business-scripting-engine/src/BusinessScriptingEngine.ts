import {
  type CapabilityId,
  createSandboxId,
  HostScriptSession,
  luaGlobalHookName,
  Luarizer,
  type SandboxRuntime,
} from '@luarizer/luarizer';

import businessSurface from './businessSurface.js';
import type { BusinessEngineHost } from './integrations.js';

export type BusinessDomainEvent =
  | {
      readonly kind: 'OrderPlaced';
      readonly orderId: string;
      readonly amountCents: number;
      readonly customerId: string;
    }
  | {
      readonly kind: 'InventoryLow';
      readonly sku: string;
      readonly unitsLeft: number;
    };

function eventToPayloadRecord(event: BusinessDomainEvent): Record<string, string | number | boolean> {
  switch (event.kind) {
    case 'OrderPlaced':
      return {
        orderId: event.orderId,
        amountCents: event.amountCents,
        customerId: event.customerId,
      };
    case 'InventoryLow':
      return {
        sku: event.sku,
        unitsLeft: event.unitsLeft,
      };
  }
}

/**
 * Illustrative engine: orders, billing, and notifications behind a typed surface; business events invoke
 * Lua hooks (`onOrderPlaced`, `onInventoryLow`, …); each `workflowId` is an isolated session + allowlist.
 */
export class BusinessScriptingEngine {
  private readonly runtime: SandboxRuntime;

  private readonly sessions = new Map<string, HostScriptSession<BusinessEngineHost>>();

  constructor(readonly host: BusinessEngineHost) {
    this.runtime = Luarizer.createWasmRuntime();
  }

  /**
   * Registers a workflow: loads Lua once in an isolated slot with the given capability allowlist.
   */
  readonly registerWorkflow = async (
    workflowId: string,
    luaSource: string,
    allowedCapabilities: readonly CapabilityId[],
  ): Promise<void> => {
    if (this.sessions.has(workflowId)) {
      throw new Error(`workflow already registered: ${workflowId}`);
    }
    const session = new HostScriptSession({
      runtime: this.runtime,
      surface: businessSurface,
      host: this.host,
      slotKey: createSandboxId(`biz-wf:${workflowId}`),
      allowedCapabilities,
    });
    await session.openSession();
    const loaded = await session.runChunk(luaSource);
    if (loaded._tag !== 'ok') {
      await session.dispose();
      const detail =
        loaded._tag === 'err' && loaded.error._tag === 'AdapterError'
          ? loaded.error.message
          : JSON.stringify(loaded.error);
      throw new Error(`workflow "${workflowId}" failed to load: ${detail}`);
    }
    this.sessions.set(workflowId, session);
  };

  /**
   * Dispatches a business event to every workflow: calls `on<EventKind>` if defined in the Lua environment.
   */
  readonly dispatch = async (event: BusinessDomainEvent): Promise<void> => {
    const hook = luaGlobalHookName(event.kind);
    const payload = eventToPayloadRecord(event);

    for (const [id, session] of this.sessions) {
      const r = await session.invokeGlobalHookIfPresent(hook, payload);
      if (r._tag !== 'ok') {
        const detail =
          r._tag === 'err' && r.error._tag === 'AdapterError' ? r.error.message : JSON.stringify(r.error);
        throw new Error(`workflow "${id}" failed on dispatch: ${detail}`);
      }
    }
  };

  readonly dispose = async (): Promise<void> => {
    for (const s of this.sessions.values()) {
      await s.dispose();
    }
    this.sessions.clear();
  };
}
