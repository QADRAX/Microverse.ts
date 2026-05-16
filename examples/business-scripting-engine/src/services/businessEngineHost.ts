import type { TaggedLuaMicroverseHost } from '@microverse.ts/microverse-lua';

import type { OrderRecord } from '../domain/models/orderRecord.js';
import type { BusinessComponentHooksSpec } from '../schemas/components/businessComponentHooks.js';

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
 * (domain events are methods on the component from `component:extend()`, typed as `Component` in `.d.lua`).
 */
export type BusinessEngineHost = TaggedLuaMicroverseHost<BusinessComponentHooksSpec, BusinessEngineServices>;

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
