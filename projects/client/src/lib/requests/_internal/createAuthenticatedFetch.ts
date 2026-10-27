import { sessionExpired } from '$lib/features/auth/sessionExpired.ts';
import { RefreshResponseSchema } from '$lib/features/auth/models/RefreshResponseSchema.ts';
import { getToken, setToken } from '$lib/features/auth/token.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';

async function renewSession(
  baseFetch: typeof fetch,
  rejected: string,
): Promise<string | null> {
  const response = await baseFetch(UrlBuilder.auth.refresh(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rejected }),
  });

  if (response.status === 401) {
    setToken(null);
    sessionExpired.next();
    return null;
  }

  if (!response.ok) return null;

  const responseToken = RefreshResponseSchema.safeParse(
    await response.json().catch(() => null),
  );
  if (!responseToken.success) return null;
  setToken({ value: responseToken.data.token });
  return responseToken.data.token;
}

export function createAuthenticatedFetch<
  T extends typeof fetch,
>(baseFetch: T): T {
  return (function authenticatedFetch(
    input: Parameters<T>[0],
    init?: Parameters<T>[1],
  ): Promise<Response> {
    const send = (token: string | Nil) => {
      const headers = new Headers(init?.headers || {});

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      return baseFetch(
        input,
        {
          ...init,
          headers,
        } as Parameters<T>[1],
      );
    };

    const { value: token } = getToken();

    return send(token).then((response) => {
      if (response.status !== 401 || !token) return response;

      return renewSession(baseFetch, token).then((renewed) =>
        renewed == null || renewed === token ? response : send(renewed)
      );
    });
  }) as unknown as T;
}
