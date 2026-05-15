/**
 * Domain events dispatched from TypeScript into registered Lua workflows.
 */
export type BusinessDomainEvent =
  | {
      readonly kind: 'OrderPlaced';
      readonly orderId: string;
      readonly amountCents: number;
      readonly customerId: string;
    }
  | {
      readonly kind: 'InventoryLow';
      readonly sku: string;
      readonly unitsLeft: number;
    };
