import { server } from '$mocks/server.ts';
import { onTestFinished } from 'vitest';

// Records every request but a GET, as `METHOD /path`, until the test ends.
export function recordWrites(): ReadonlyArray<string> {
  const writes: string[] = [];
  const record = ({ request }: { request: Request }) => {
    if (request.method === 'GET') return;
    writes.push(`${request.method} ${new URL(request.url).pathname}`);
  };
  server.events.on('request:start', record);
  onTestFinished(() => {
    server.events.removeListener('request:start', record);
  });
  return writes;
}
