import { z } from 'zod';

type ParseEnvIntParams = {
  value: string | undefined;
  fallback: number;
  minimum: number;
};

export function parseEnvInt(
  { value, fallback, minimum }: ParseEnvIntParams,
): number {
  const result = z
    .string()
    .trim()
    // Blank env values are unset: coercing `''` gives `0`, which a `minimum` of `0` would accept.
    .min(1)
    .pipe(z.coerce.number().int().min(minimum))
    .safeParse(value);

  return result.success ? result.data : fallback;
}
