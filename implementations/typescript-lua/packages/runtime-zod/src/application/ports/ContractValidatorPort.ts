import type { Result } from '@microverse.ts/shared';

export type ContractValidatorPort = {
  readonly validate: <T>(payload: unknown, validate: (value: unknown) => Result<T, string>) => Result<T, string>;
};
