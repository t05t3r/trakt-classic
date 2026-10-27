import type { z } from 'zod';
import type { SessionSchema } from './SessionSchema.ts';

export type Session = z.infer<typeof SessionSchema>;
