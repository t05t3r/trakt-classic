import { browser } from '$app/environment';

export type Token = {
  value: string | Nil;
};

const token: Token = {
  value: null,
};

export function getToken() {
  return { ...token };
}

export function setToken(newToken: Token | Nil) {
  // On the server the singleton is shared by every request.
  if (!browser) return;

  if (!newToken) {
    token.value = null;
    return;
  }

  token.value = newToken.value;
}
