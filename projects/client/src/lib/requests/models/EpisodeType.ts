import { z } from 'zod';

const EpisodeFinaleTypeSchema = z.enum([
  'series_finale',
  'season_finale',
  'mid_season_finale',
]);
const EpisodePremiereTypeSchema = z.enum([
  'series_premiere',
  'season_premiere',
  'mid_season_premiere',
]);
const EpisodeUnknownTypeSchema = z.enum(['unknown']);
const EpisodeStandardTypeSchema = z.enum(['standard']);
const EpisodeComputedTypeSchema = z.enum(['full_season', 'multiple_episodes']);

export const EpisodeTypeSchema = z.union([
  EpisodeFinaleTypeSchema,
  EpisodePremiereTypeSchema,
  EpisodeUnknownTypeSchema,
  EpisodeStandardTypeSchema,
  EpisodeComputedTypeSchema,
]);
export type EpisodeType = z.infer<typeof EpisodeTypeSchema>;

export const EpisodeFinaleType = EpisodeFinaleTypeSchema.Enum;

export const EpisodePremiereType = EpisodePremiereTypeSchema.Enum;

export const EpisodeUnknownType = EpisodeUnknownTypeSchema.Enum;

export const EpisodeComputedType = EpisodeComputedTypeSchema.Enum;
