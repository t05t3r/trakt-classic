import { LIST_TYPES } from '$lib/features/lists/LIST_TYPES.ts';
import { toListTypeSegment } from '$lib/features/lists/toListTypeSegment.ts';

export const FAVORITES_SEGMENTS = [null, ...LIST_TYPES.favorites].map((type) =>
  toListTypeSegment(type)
);
