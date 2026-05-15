import { type DeclarativeBridgeDeclaration } from '@luarizer/runtime-bridge';
import type { z } from 'zod';

import { LUARIZER_CAPABILITY_REGISTRY, type WithLuarizerCapabilityRegistry } from '../../domain/capabilityRegistrySymbol.js';
import type { HostSurfaceSpec } from '../../domain/hostSurfaceTypes.js';
import type { SchemaValidationPort } from '../ports/SchemaValidationPort.js';

function isThenable(value: unknown): value is Promise<unknown> {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value !== 'object' && typeof value !== 'function') {
    return false;
  }
  const then = (value as { then?: unknown }).then;
  return typeof then === 'function';
}

/**
 * Builds declarative bridge declarations from a host surface spec, using the schema validation port for Lua ↔ host payloads.
 */
export function createBridgeDeclarationsFromHostSurfaceSpec<TSpec extends HostSurfaceSpec>(
  schemaValidation: SchemaValidationPort,
  spec: TSpec,
): ReadonlyArray<DeclarativeBridgeDeclaration<WithLuarizerCapabilityRegistry, string>> {
  const out: DeclarativeBridgeDeclaration<WithLuarizerCapabilityRegistry, string>[] = [];
  for (const bridgeName of Object.keys(spec)) {
    const methods = spec[bridgeName]!;
    out.push({
      name: bridgeName,
      perEntity: true,
      createApi: (host, slotKey) => {
        const api: Record<string, (payload: unknown) => unknown> = {};
        for (const methodName of Object.keys(methods)) {
          const entry = methods[methodName]!;
          api[methodName] = (...args: unknown[]) => {
            const payload = args.length >= 2 ? args[1] : args[0];
            const registry = host[LUARIZER_CAPABILITY_REGISTRY];
            if (!registry.isAllowed(entry.capability)) {
              throw new Error(`capability denied: ${String(entry.capability)}`);
            }
            const parsedIn = schemaValidation.validateWithZodSchema(entry.input as z.ZodType<unknown>, payload);
            if (parsedIn._tag === 'err') {
              throw new Error(parsedIn.error);
            }
            const raw: unknown = entry.handler({ host, slotKey: String(slotKey) }, parsedIn.value);
            if (isThenable(raw)) {
              return raw.then((resolved) => {
                const parsedOut = schemaValidation.validateWithZodSchema(
                  entry.output as z.ZodType<unknown>,
                  resolved,
                );
                if (parsedOut._tag === 'err') {
                  throw new Error(parsedOut.error);
                }
                return parsedOut.value;
              });
            }
            const parsedOut = schemaValidation.validateWithZodSchema(entry.output as z.ZodType<unknown>, raw);
            if (parsedOut._tag === 'err') {
              throw new Error(parsedOut.error);
            }
            return parsedOut.value;
          };
        }
        return Object.freeze(api);
      },
    });
  }
  return out;
}
