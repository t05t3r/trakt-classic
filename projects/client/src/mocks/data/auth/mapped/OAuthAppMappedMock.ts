import { createOAuthApp } from '$lib/features/auth/createOAuthApp.ts';

export const OAuthAppMappedMock = createOAuthApp({
  origin: 'https://trakt.example.com',
  clientId: 'client-id',
  authHost: 'http://localhost',
});
