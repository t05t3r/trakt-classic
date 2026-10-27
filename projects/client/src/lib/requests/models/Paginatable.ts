import { z } from 'zod';

const PaginatedPageMetaSchema = z.object({
  type: z.literal('paginated'),
  current: z.number(),
  total: z.number(),
  itemCount: z.number().optional(),
});

const InfinitePageMetaSchema = z.object({
  type: z.literal('infinite'),
  current: z.number(),
});

const PageMetaSchema = z.discriminatedUnion('type', [
  PaginatedPageMetaSchema,
  InfinitePageMetaSchema,
]);

export const PaginatableSchemaFactory = <T extends z.ZodType>(entrySchema: T) =>
  z.object({
    entries: z.array(entrySchema),
    page: PageMetaSchema,
  });

export type PageMeta = z.infer<typeof PageMetaSchema>;
export type Paginatable<T> = z.infer<
  ReturnType<typeof PaginatableSchemaFactory<z.ZodType<T>>>
>;
