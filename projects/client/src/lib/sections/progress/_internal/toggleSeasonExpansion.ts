export type SeasonExpansion = ReadonlySet<number>;

type SeasonToggle = {
  expansion: SeasonExpansion;
  season: number;
};

export function toggleSeasonExpansion(
  { expansion, season }: SeasonToggle,
): SeasonExpansion {
  const open = [...expansion];

  return new Set(
    open.includes(season)
      ? open.filter((number) => number !== season)
      : [...open, season],
  );
}
