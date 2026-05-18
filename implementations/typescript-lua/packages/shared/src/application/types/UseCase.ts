/**
 * Use case callable. Ports are always passed as the first argument (tuple of implementations).
 *
 * @example
 * ```ts
 * type Ports = readonly [ClockPort, LoggerPort];
 * type UC = UseCase<Ports, readonly [string], number>;
 * ```
 */
export type UseCase<
  TPorts extends readonly unknown[],
  TArgs extends readonly unknown[],
  TResult,
> = (ports: TPorts, ...args: TArgs) => TResult;

/**
 * Async variant of {@link UseCase}. Port tuple ordering matches {@link UseCase}.
 */
export type AsyncUseCase<
  TPorts extends readonly unknown[],
  TArgs extends readonly unknown[],
  TResult,
> = (ports: TPorts, ...args: TArgs) => Promise<TResult>;
