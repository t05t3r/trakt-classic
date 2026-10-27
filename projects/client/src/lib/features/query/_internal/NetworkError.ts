export class NetworkError extends Error {
  constructor(cause: TypeError) {
    super(cause.message, { cause });
    this.name = 'NetworkError';
  }
}
