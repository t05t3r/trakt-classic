import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';

export function submitLogout(): void {
  const form = globalThis.document.createElement('form');
  form.action = UrlBuilder.auth.logout();
  form.method = 'POST';
  globalThis.document.body.append(form);
  form.submit();
}
