import { z } from 'zod';
import { parseLocalDate } from './parseLocalDate.ts';

const DateOnlySchema = z.string().date();

export function parseDateOnly(value: string | Nil): Date | undefined {
  const dateOnly = DateOnlySchema.safeParse(value);
  if (!dateOnly.success) return undefined;

  return parseLocalDate(dateOnly.data);
}
