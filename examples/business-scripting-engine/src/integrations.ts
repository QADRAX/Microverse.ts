export type OrderRecord = {
  readonly id: string;
  readonly customerId: string;
  readonly totalCents: number;
};

export type ChargeRecord = {
  readonly orderId: string;
  readonly amountCents: number;
};

export function createInMemoryOrders(initial: readonly OrderRecord[]) {
  const map = new Map(initial.map((o) => [o.id, o] as const));
  return {
    get: (orderId: string): OrderRecord | undefined => map.get(orderId),
    upsert: (order: OrderRecord): void => {
      map.set(order.id, order);
    },
  };
}

export function createBillingService() {
  const charges: ChargeRecord[] = [];
  return {
    getCharges: (): readonly ChargeRecord[] => charges,
    charge: (orderId: string, amountCents: number): { readonly ok: boolean } => {
      if (amountCents <= 0) {
        return { ok: false };
      }
      charges.push({ orderId, amountCents });
      return { ok: true };
    },
    totalChargedCentsForOrder: (orderId: string): number =>
      charges.filter((c) => c.orderId === orderId).reduce((s, c) => s + c.amountCents, 0),
  };
}

export function createNotificationService() {
  const sent: { readonly channel: string; readonly message: string }[] = [];
  return {
    getSent: (): readonly (typeof sent)[number][] => sent,
    send: (channel: string, message: string): void => {
      sent.push({ channel, message });
    },
  };
}

export type BusinessEngineHost = {
  readonly orders: ReturnType<typeof createInMemoryOrders>;
  readonly billing: ReturnType<typeof createBillingService>;
  readonly notifications: ReturnType<typeof createNotificationService>;
};

export function createDefaultBusinessHost(seedOrders: readonly OrderRecord[]): BusinessEngineHost {
  return {
    orders: createInMemoryOrders(seedOrders),
    billing: createBillingService(),
    notifications: createNotificationService(),
  };
}
