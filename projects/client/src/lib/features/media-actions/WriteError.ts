export type WriteErrorClass =
  | 'rate-limited'
  | 'limit-reached'
  | 'failed'
  | 'session-expired';

type WriteErrorParams = {
  class: WriteErrorClass;
  retryAfter?: number;
};

export class WriteError extends Error {
  readonly class: WriteErrorClass;
  readonly retryAfter?: number;

  constructor({ class: errorClass, retryAfter }: WriteErrorParams) {
    super(`Write failed: ${errorClass}`);
    this.name = 'WriteError';
    this.class = errorClass;
    this.retryAfter = retryAfter;
  }
}
