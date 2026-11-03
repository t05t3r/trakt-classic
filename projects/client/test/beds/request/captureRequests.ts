import { server } from '$mocks/server.ts';

type CaptureRequestsOptions = {
  pathIncludes?: string;
};

export async function captureRequests(
  run: () => Promise<unknown>,
  { pathIncludes = '' }: CaptureRequestsOptions = {},
): Promise<string[]> {
  const requests: string[] = [];
  const record = ({ request }: { request: Request }) => {
    const { pathname } = new URL(request.url);
    if (!pathname.includes(pathIncludes)) return;

    requests.push(`${request.method} ${pathname}`);
  };

  server.events.on('request:start', record);
  try {
    await run();
  } finally {
    server.events.removeListener('request:start', record);
  }

  return requests;
}
