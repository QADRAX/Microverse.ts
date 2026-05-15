import { cap, defineHostSurfaceFor, fn } from '@luarizer/luarizer';
import { z } from 'zod';

import type { BusinessEngineHost } from './services/businessEngineHost.js';
import type { OrderRecord } from './domain/models/orderRecord.js';
import { businessWorkflowHooks } from './schemas/workflows/businessWorkflowHooks.js';
import {
  asyncioTickResult,
  chargeResult,
  inventoryUnitsDto,
  jobCreateResult,
  orderDto,
} from './schemas/surface/bridgePayloads.js';

export { businessWorkflowHooks } from './schemas/workflows/businessWorkflowHooks.js';

/**
 * Host surface exposed to Lua: domain integrations with Zod + capabilities.
 * Each workflow session declares only the capabilities it needs in its allowlist.
 *
 * Default-exported for `luarizer generate-defs --surface ...` (see package.json).
 * Workflow hooks: abstract **`Workflow`** plus injected **`workflow:extend()`** helper (see generated `businessSurface.d.lua`).
 * For LuaLS, keep `.luarc.json` **`workspace.library`** as `./generated` (relative to that file) so stubs apply when the repo root is the IDE workspace. If your editor still flags bridge tables as undefined, list them under **`diagnostics.globals`** (see this package’s `.luarc.json`).
 */
export default defineHostSurfaceFor(
  {
    orders: {
      get: fn<BusinessEngineHost, { orderId: string }, OrderRecord | undefined>({
        capability: cap('orders:read'),
        input: z.object({ orderId: z.string() }),
        output: orderDto.optional(),
        description: 'Load order by id',
        lua: { paramTypes: { orderId: 'OrderId' }, returns: 'OrderDto|nil' },
        handler: ({ host }, { orderId }) => host.orders.get(orderId),
      }),
    },
    billing: {
      charge: fn<BusinessEngineHost, { orderId: string; amountCents: number }, { ok: boolean }>({
        capability: cap('billing:charge'),
        input: z.object({
          orderId: z.string(),
          amountCents: z.number().int().nonnegative(),
        }),
        output: chargeResult,
        description: 'Record a charge against an order',
        lua: { paramTypes: { orderId: 'OrderId', amountCents: 'integer' }, returns: 'ChargeResult' },
        handler: ({ host }, input) => host.billing.charge(input.orderId, input.amountCents),
      }),
    },
    notifications: {
      send: fn<BusinessEngineHost, { channel: string; message: string }, undefined>({
        capability: cap('notifications:send'),
        input: z.object({ channel: z.string(), message: z.string() }),
        output: z.undefined(),
        description: 'Send a notification (email, slack, …)',
        handler: ({ host }, input) => {
          host.notifications.send(input.channel, input.message);
          return undefined;
        },
      }),
    },
    audit: {
      record: fn<BusinessEngineHost, { line: string }, undefined>({
        capability: cap('audit:record'),
        input: z.object({ line: z.string() }),
        output: z.undefined(),
        description: 'Append one line to the in-memory audit trail',
        handler: ({ host }, { line }) => {
          host.audit.record(line);
          return undefined;
        },
      }),
    },
    inventory: {
      getUnits: fn<BusinessEngineHost, { sku: string }, { units: number }>({
        capability: cap('inventory:read'),
        input: z.object({ sku: z.string() }),
        output: inventoryUnitsDto,
        description: 'Read stock units for a SKU',
        lua: { returns: 'InventoryUnits' },
        handler: ({ host }, { sku }) => ({ units: host.inventory.getUnits(sku) }),
      }),
    },
    jobs: {
      create: fn<BusinessEngineHost, { label: string }, { jobId: string }>({
        capability: cap('jobs:create'),
        input: z.object({ label: z.string() }),
        output: jobCreateResult,
        description: 'Allocate a job id (sync). Host completes async work later and emits the JobDone workflow hook.',
        lua: { returns: 'JobCreateResult' },
        handler: ({ host }, { label }) => ({ jobId: host.jobs.createJob(label) }),
      }),
    },
    asyncio: {
      tick: fn<BusinessEngineHost, { delayMs: number; seed: number }, { value: number }>({
        capability: cap('asyncio:tick'),
        input: z.object({
          delayMs: z.number().int().nonnegative(),
          seed: z.number().int(),
        }),
        output: asyncioTickResult,
        description: 'Async-capable bridge: handler may await; Wasmoon Promise is applied in Lua via slot bootstrap.',
        lua: { paramTypes: { delayMs: 'integer', seed: 'integer' }, returns: 'AsyncioTickResult' },
        handler: async (_ctx, { delayMs, seed }) => {
          await new Promise((r) => setTimeout(r, Math.min(delayMs, 30)));
          return { value: seed + 7 };
        },
      }),
    },
  },
  businessWorkflowHooks,
);
