import type { TaggedLuaMicroverseHost } from '@microverse.ts/microverse-lua';

import type { OrderRecord } from '../domain/models/orderRecord';
import type { BusinessComponentHooksSpec } from '../schemas/components/businessComponentHooks';

import { createAuditService } from './audit/createAuditService';
import { createBillingService } from './billing/createBillingService';
import { createInventoryService } from './inventory/createInventoryService';
import { createJobsService } from './jobs/createJobsService';
import { createInMemoryOrders } from './orders/createInMemoryOrders';
import { createNotificationService } from './notifications/createNotificationService';

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
