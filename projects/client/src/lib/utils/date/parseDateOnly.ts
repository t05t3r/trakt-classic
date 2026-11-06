import { z } from 'zod';
import { isValidDate } from './isValidDate.ts';
import { parseLocalDate } from './parseLocalDate.ts';

const DateOnlySchema = z.string().date();

export function parseDateOnly(value: string | Nil): Date | undefined {
  const dateOnly = DateOnlySchema.safeParse(value);
  if (!dateOnly.success) return undefined;

  const date = parseLocalDate(dateOnly.data);

  return isValidDate(date) ? date : undefined;
}
