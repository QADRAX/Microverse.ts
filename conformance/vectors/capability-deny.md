# Capability deny (behavioral vector)

This vector is **not** a JSON file. It documents runtime behavior that conforming implementations must match.

## Setup

Use [surface-profiles-inheritance.json](./surface-profiles-inheritance.json):

- Profile **`AuditOnly`** capabilities: `audit:record` only.
- Bridge **`orders.get`** requires `orders:read`.

## Expected behavior

When mounting a script instance with profile **`AuditOnly`**:

1. The sandbox bridge API must **not** include an `orders` table (or any `orders:get` callable).
2. The `audit` bridge **must** remain available (includes `record`).
3. The host must **not** throw at mount time solely because `orders` is missing from the profile; disallowed bridges are omitted, not errors.

When mounting with profile **`OrderEcho`** (extends `AuditOnly`, adds `orders:read`):

1. Both `audit` and `orders` bridge tables must be present.

## Reference implementation

`@microverse.ts/microverse-lua` filters `mergeEnv` per active profile (`host-surface` / `filterBridgeDeclarations`).
