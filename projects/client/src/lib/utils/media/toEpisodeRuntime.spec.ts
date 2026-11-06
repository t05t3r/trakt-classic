import { describe, expect, it } from 'vitest';
import { toEpisodeRuntime } from './toEpisodeRuntime.ts';

const runtimeOf = (episode: number, show: number) =>
  toEpisodeRuntime({ episode: { runtime: episode }, show: { runtime: show } });

describe('util: toEpisodeRuntime', () => {
  it("should read the episode's own runtime", () => {
    expect(runtimeOf(60, 45)).toBe(60);
  });

  it("should read the show's when the episode has none", () => {
    expect(runtimeOf(NaN, 45)).toBe(45);
  });

  it("should keep an episode's runtime of 0 from taking the show's", () => {
    expect(runtimeOf(0, 45)).toBe(0);
  });
});
