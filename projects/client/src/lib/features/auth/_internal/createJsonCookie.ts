import { safeJsonParse } from '$lib/utils/json/safeJsonParse.ts';
import type { Cookies } from '@sveltejs/kit';
import type { z } from 'zod';

type JsonCookieOptions = {
  httpOnly: true;
  sameSite: 'lax';
  path: string;
  maxAge: number;
};

type CreateJsonCookieParams<Schema extends z.ZodTypeAny> = {
  name: string;
  schema: Schema;
  options: JsonCookieOptions;
};

export function createJsonCookie<Schema extends z.ZodTypeAny>(
  { name, schema, options }: CreateJsonCookieParams<Schema>,
) {
  const parse = (value: string): z.infer<Schema> | null => {
    const result = schema.safeParse(safeJsonParse<unknown>(value, null));
    return result.success ? result.data : null;
  };

  const clear = (cookies: Cookies) => {
    cookies.delete(name, { path: options.path });
  };

  return {
    name,
    // A value that cannot be parsed is not kept: the browser would resend it on every request.
    read(cookies: Cookies): z.infer<Schema> | null {
      const raw = cookies.get(name);
      if (!raw) return null;
      const value = parse(raw);
      if (value === null) clear(cookies);
      return value;
    },
    write(cookies: Cookies, value: z.infer<Schema>) {
      cookies.set(name, JSON.stringify(value), options);
    },
    clear,
  };
}
