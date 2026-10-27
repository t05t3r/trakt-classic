import { onTestFinished } from 'vitest';

// The answer runs only once the gate opens, so a body it builds is built then.
export function holdResponse<A extends unknown[], R>(
  answer: (...args: A) => R | Promise<R>,
): Readonly<{
  answer: (...args: A) => Promise<R>;
  requested: Promise<void>;
  release: () => void;
}> {
  const requested = Promise.withResolvers<void>();
  const gate = Promise.withResolvers<void>();
  const release = () => gate.resolve();
  onTestFinished(release);

  return {
    answer: async (...args: A) => {
      requested.resolve();
      await gate.promise;
      return answer(...args);
    },
    requested: requested.promise,
    release,
  };
}
