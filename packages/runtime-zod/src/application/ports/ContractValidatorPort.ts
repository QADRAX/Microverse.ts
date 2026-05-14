import type { Result } from '@luarizer/shared';

export type ContractValidatorPort = {
  readonly validate: <T>(payload: unknown, validate: (value: unknown) => Result<T, string>) => Result<T, string>;
};
