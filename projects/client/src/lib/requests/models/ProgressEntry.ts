import { z } from 'zod';
import { ShowEntrySchema } from './ShowEntry.ts';

const BaseProgressEntrySchema = z.object({
  key: z.string(),
  show: ShowEntrySchema,
});

export const DroppedProgressEntrySchema = BaseProgressEntrySchema.merge(
  z.object({
    type: z.literal('dropped'),
    hiddenAt: z.date(),
  }),
);

export type DroppedProgressEntry = z.infer<typeof DroppedProgressEntrySchema>;
