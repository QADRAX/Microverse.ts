import type { ChargeRecord } from '../../domain/models/chargeRecord.js';

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
