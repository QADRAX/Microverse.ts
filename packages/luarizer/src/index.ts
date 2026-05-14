/**
 * **@luarizer/luarizer** — single dependency surface for consuming apps (re-exports + `Luarizer` namespace).
 */
export * from '@luarizer/shared';
export * from '@luarizer/runtime-core';
export * from '@luarizer/runtime-lua';
export * from '@luarizer/runtime-wasm';
export * from '@luarizer/runtime-bridge';
export * from '@luarizer/runtime-capabilities';
export * from '@luarizer/runtime-zod';

export { Luarizer } from './infrastructure/facade/luarizerNamespace';
