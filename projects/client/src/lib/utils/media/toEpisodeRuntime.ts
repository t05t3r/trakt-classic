type EpisodeRuntimeParams = {
  episode: { runtime: number };
  show: { runtime: number };
};

// The mappers turn a missing runtime into NaN, which `??` does not catch.
export function toEpisodeRuntime(
  { episode, show }: EpisodeRuntimeParams,
): number {
  return Number.isNaN(episode.runtime) ? show.runtime : episode.runtime;
}
