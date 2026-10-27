import { LogLevel, print } from '$lib/utils/console/print.ts';

export function error(...args: unknown[]) {
  print(LogLevel.Error, 'error', ...args);
}
