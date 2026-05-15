/**
 * Simple SKU → units map for Lua demos (read-only from Lua via `inventory:getUnits`).
 */
export function createInventoryService(seed: Readonly<Record<string, number>>) {
  const unitsBySku: Record<string, number> = { ...seed };
  return {
    getUnits: (sku: string): number => unitsBySku[sku] ?? 0,
  };
}
