import type { TaggedWorkflowHost } from '@luarizer/luarizer';

import type { OrderRecord } from '../domain/models/orderRecord.js';
import type { BusinessWorkflowHooksSpec } from '../schemas/workflows/businessWorkflowHooks.js';

import { createBillingService } from './billing/createBillingService.js';
import { createInMemoryOrders } from './orders/createInMemoryOrders.js';
import { createNotificationService } from './notifications/createNotificationService.js';

type BusinessEngineServices = {
  readonly orders: ReturnType<typeof createInMemoryOrders>;
  readonly billing: ReturnType<typeof createBillingService>;
  readonly notifications: ReturnType<typeof createNotificationService>;
};

/**
 * Host services object passed into {@link BusinessScriptingEngine} and into every `fn<BusinessEngineHost, …>` handler
 * in {@link businessSurface.js}. Carries workflow hook typing for {@link HostWorkflowHub} via {@link TaggedWorkflowHost}.
 */
export type BusinessEngineHost = TaggedWorkflowHost<BusinessWorkflowHooksSpec, BusinessEngineServices>;

export function createDefaultBusinessHost(seedOrders: readonly OrderRecord[]): BusinessEngineHost {
  return {
    orders: createInMemoryOrders(seedOrders),
    billing: createBillingService(),
    notifications: createNotificationService(),
  };
}
