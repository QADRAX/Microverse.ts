export type ExecutionFailure =
  | { readonly _tag: 'Timeout' }
  | { readonly _tag: 'Cancelled' }
  | { readonly _tag: 'AdapterError'; readonly message: string };

/** Human-readable detail for logging or `Error` messages. */
export function formatExecutionFailure(failure: ExecutionFailure): string {
  switch (failure._tag) {
    case 'AdapterError':
      return failure.message;
    case 'Timeout':
      return 'execution timed out';
    case 'Cancelled':
      return 'execution cancelled';
  }
}
