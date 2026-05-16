import { defineHostSurfaceFor } from '@microverse.ts/microverse-lua';
import { z } from 'zod';

import type { BusinessEngineHost } from './services/businessEngineHost.js';
import { businessComponentHooks } from './schemas/components/businessComponentHooks.js';
import {
  asyncioTickResult,
  chargeResult,
  inventoryUnitsDto,
  jobCreateResult,
  orderDto,
  orderId,
} from './schemas/surface/bridgePayloads.js';

export { businessComponentHooks } from './schemas/components/businessComponentHooks.js';

/**
 * Host surface exposed to Lua: domain integrations with Zod + capabilities.
 * Each script instance registers a subset via `surface.pickCapabilities(…)` (see {@link BusinessScriptingEngine.mountScriptInstance}).
 *
 * Default-exported for `microverse generate-lua-defs --surface ...` (see package.json).
 * LuaCATS names (`OrderDto`, `OrderId`, …) come from {@link luaType} on schemas in `bridgePayloads.ts`.
 * Component domain events: `on*` methods on **`Component`** from `component:extend()` (see generated `businessSurface.d.lua`).
 * For LuaLS, keep `.luarc.json` **`workspace.library`** as `./generated` (relative to that file) so stubs apply when the repo root is the IDE workspace. If your editor still flags bridge tables as undefined, list them under **`diagnostics.globals`** (see this package’s `.luarc.json`).
 */
export default defineHostSurfaceFor<BusinessEngineHost>()
  .bridge('orders')
  .method('get', {
    requires: 'orders:read',
    input: z.object({ orderId }),
    output: orderDto.optional(),
    description: 'Load order by id',
    handler: ({ host }, { orderId }) => host.orders.get(orderId),
  })
  .bridge('billing')
  .method('charge', {
    requires: 'billing:charge',
    input: z.object({
      orderId,
      amountCents: z.number().int().nonnegative(),
    }),
    output: chargeResult,
    description: 'Record a charge against an order',
    handler: ({ host }, input) => host.billing.charge(input.orderId, input.amountCents),
  })
  .bridge('notifications')
  .method('send', {
    requires: 'notifications:send',
    input: z.object({ channel: z.string(), message: z.string() }),
    output: z.undefined(),
    description: 'Send a notification (email, slack, …)',
    handler: ({ host }, input) => {
      host.notifications.send(input.channel, input.message);
      return undefined;
    },
  })
  .bridge('audit')
  .method('record', {
    requires: 'audit:record',
    input: z.object({ line: z.string() }),
    output: z.undefined(),
    description: 'Append one line to the in-memory audit trail',
    handler: ({ host }, { line }) => {
      host.audit.record(line);
      return undefined;
    },
  })
  .bridge('inventory')
  .method('getUnits', {
    requires: 'inventory:read',
    input: z.object({ sku: z.string() }),
    output: inventoryUnitsDto,
    description: 'Read stock units for a SKU',
    handler: ({ host }, { sku }) => ({ units: host.inventory.getUnits(sku) }),
  })
  .bridge('jobs')
  .method('create', {
    requires: 'jobs:create',
    input: z.object({ label: z.string() }),
    output: jobCreateResult,
    description:
      'Allocate a job id (sync). Host completes async work later and emits the JobDone workflow hook (consumer pattern, not engine async).',
    handler: ({ host }, { label }) => ({ jobId: host.jobs.createJob(label) }),
  })
  .bridge('asyncio')
  .method('tick', {
    requires: 'asyncio:tick',
    input: z.object({
      delayMs: z.number().int().nonnegative(),
      seed: z.number().int(),
    }),
    output: asyncioTickResult,
    description: 'Demo async bridge: use `:await()` or optional `onComplete` 2nd argument in Lua.',
    handler: async (_ctx, { delayMs, seed }) => {
      await new Promise((r) => setTimeout(r, Math.min(delayMs, 30)));
      return { value: seed + 7 };
    },
  })
  .componentHooks(businessComponentHooks)
  .build();
