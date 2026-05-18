export type Result<T, E> =
  | { readonly _tag: 'ok'; readonly value: T }
  | { readonly _tag: 'err'; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { _tag: 'ok', value };
}

export function err<E>(error: E): Result<never, E> {
  return { _tag: 'err', error };
}

export function isOk<T, E>(r: Result<T, E>): r is { readonly _tag: 'ok'; readonly value: T } {
  return r._tag === 'ok';
}

export function isErr<T, E>(r: Result<T, E>): r is { readonly _tag: 'err'; readonly error: E } {
  return r._tag === 'err';
}
