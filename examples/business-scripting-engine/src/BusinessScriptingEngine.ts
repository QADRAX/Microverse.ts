import {
  type CapabilityId,
  createSandboxId,
  HostScriptSession,
  Luarizer,
  type SandboxRuntime,
} from '@luarizer/luarizer';

import { businessSurface } from './businessSurface.js';
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

function hookNameForEvent(kind: BusinessDomainEvent['kind']): string {
  return `on${kind}`;
}

function assertSafeLuaIdentifier(name: string): void {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`unsafe Lua identifier: ${name}`);
  }
}

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

function recordToLuaTableLiteral(o: Record<string, string | number | boolean>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'string') {
      parts.push(`${k} = ${JSON.stringify(v)}`);
    } else if (typeof v === 'number' && Number.isFinite(v)) {
      parts.push(`${k} = ${v}`);
    } else if (typeof v === 'boolean') {
      parts.push(`${k} = ${v ? 'true' : 'false'}`);
    } else {
      throw new Error(`unsupported payload field ${k}`);
    }
  }
  return `{ ${parts.join(', ')} }`;
}

/**
 * Motor ilustrativo: varias integraciones (pedidos, cobros, notificaciones) detrás de una superficie,
 * eventos de negocio que disparan hooks Lua (`onOrderPlaced`, `onInventoryLow`, …) y un workflow por `workflowId`.
 */
export class BusinessScriptingEngine {
  private readonly runtime: SandboxRuntime;

  private readonly sessions = new Map<string, HostScriptSession<BusinessEngineHost>>();

  constructor(readonly host: BusinessEngineHost) {
    this.runtime = Luarizer.createWasmRuntime();
  }

  /**
   * Registra un workflow: carga Lua una vez en un slot aislado con la allowlist de capabilities dada.
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
   * Propaga un evento de negocio a todos los workflows: invoca `on<EventKind>` si existe en el entorno Lua.
   */
  readonly dispatch = async (event: BusinessDomainEvent): Promise<void> => {
    const hook = hookNameForEvent(event.kind);
    assertSafeLuaIdentifier(hook);
    const payloadLit = recordToLuaTableLiteral(eventToPayloadRecord(event));
    const chunk = [
      `local f = rawget(_ENV, ${JSON.stringify(hook)})`,
      `if type(f) == "function" then`,
      `  f(${payloadLit})`,
      `end`,
    ].join('\n');

    for (const [id, session] of this.sessions) {
      const r = await session.runChunk(chunk);
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
