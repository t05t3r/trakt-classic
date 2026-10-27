export type SeasonRead = { slug: string; season: number };

export const isSameRead = (a: SeasonRead, b: SeasonRead) =>
  a.slug === b.slug && a.season === b.season;
