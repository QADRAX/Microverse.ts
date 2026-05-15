import type { TaggedLuaMicroverseHost } from '@microverse/microverse-lua';

import type { OrderRecord } from '../domain/models/orderRecord.js';
import type { BusinessWorkflowHooksSpec } from '../schemas/workflows/businessWorkflowHooks.js';

import { createAuditService } from './audit/createAuditService.js';
import { createBillingService } from './billing/createBillingService.js';
import { createInventoryService } from './inventory/createInventoryService.js';
import { createJobsService } from './jobs/createJobsService.js';
import { createInMemoryOrders } from './orders/createInMemoryOrders.js';
import { createNotificationService } from './notifications/createNotificationService.js';

type BusinessEngineServices = {
  readonly orders: ReturnType<typeof createInMemoryOrders>;
  readonly billing: ReturnType<typeof createBillingService>;
  readonly notifications: ReturnType<typeof createNotificationService>;
  readonly audit: ReturnType<typeof createAuditService>;
  readonly inventory: ReturnType<typeof createInventoryService>;
  readonly jobs: ReturnType<typeof createJobsService>;
};

/**
 * Host services object passed into {@link BusinessScriptingEngine} and into every `fn<BusinessEngineHost, …>` handler
 * in {@link businessSurface.js}. Carries hook typing for {@link createLuaMicroverse} via {@link TaggedLuaMicroverseHost}
 * (hooks are methods on the handler table from `workflow:extend()`, typed as `Workflow` in `.d.lua`).
 */
export type BusinessEngineHost = TaggedLuaMicroverseHost<BusinessWorkflowHooksSpec, BusinessEngineServices>;

export function createDefaultBusinessHost(
  seedOrders: readonly OrderRecord[],
  inventorySeed: Readonly<Record<string, number>> = {},
): BusinessEngineHost {
  return {
    orders: createInMemoryOrders(seedOrders),
    billing: createBillingService(),
    notifications: createNotificationService(),
    audit: createAuditService(),
    inventory: createInventoryService(inventorySeed),
    jobs: createJobsService(),
  };
}
