export function settleWithin(promise: Promise<unknown>, ms: number) {
  return Promise.race([
    promise.then(() => 'resolved', () => 'rejected'),
    new Promise((resolve) => setTimeout(() => resolve('pending'), ms)),
  ]);
}
