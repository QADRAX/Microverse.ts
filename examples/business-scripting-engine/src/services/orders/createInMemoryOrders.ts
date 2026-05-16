import type { OrderRecord } from '../../domain/models/orderRecord';

export function createInMemoryOrders(initial: readonly OrderRecord[]) {
  const map = new Map(initial.map((o) => [o.id, o] as const));
  return {
    get: (orderId: string): OrderRecord | undefined => map.get(orderId),
    upsert: (order: OrderRecord): void => {
      map.set(order.id, order);
    },
  };
}
