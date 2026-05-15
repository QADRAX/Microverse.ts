import {
  createHostWorkflowHub,
  type CapabilityId,
  type HostWorkflowHub,
} from '@luarizer/luarizer';

import surface from './businessSurface.js';
import type { BusinessDomainEvent } from './domain/events/businessDomainEvent.js';
import type { BusinessEngineHost } from './services/businessEngineHost.js';

export type { BusinessDomainEvent } from './domain/events/businessDomainEvent.js';

/**
 * Thin façade: {@link createHostWorkflowHub} with this package’s default surface (workflow hooks live on the surface).
 */
export class BusinessScriptingEngine {
  private readonly hub: HostWorkflowHub<BusinessEngineHost>;

  constructor(readonly host: BusinessEngineHost) {
    this.hub = createHostWorkflowHub({ host, surface });
  }

  readonly registerWorkflow = async (
    workflowId: string,
    luaSource: string,
    allowedCapabilities: readonly CapabilityId[],
  ): Promise<void> => {
    await this.hub.registerWorkflow({ workflowId, script: luaSource, allowedCapabilities });
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
