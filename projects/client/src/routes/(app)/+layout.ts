import { setToken } from '$lib/features/auth/token.ts';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ data }) => {
  setToken({ value: data.auth.token });
  return data;
};
