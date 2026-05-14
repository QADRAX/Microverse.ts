export type CancellationToken = {
  readonly isCancelled: () => boolean;
};

export const neverCancelledToken: CancellationToken = {
  isCancelled: () => false,
};
