import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import type { WatchHoverContent } from './toWatchHover.ts';
import WatchHover from './WatchHover.svelte';

const PLAYED_AT = new Date('2026-11-04T22:19:00.000Z');

const lines = (hover: WatchHoverContent) => {
  const { container } = render(WatchHover, { props: { hover } });

  return [...container.querySelectorAll('p')].map((line) => line.textContent);
};

describe('component: WatchHover', () => {
  it('should offer the add', () => {
    expect(lines({ kind: 'add' })).toEqual(['Add to watched history']);
  });

  it('should say it is not released yet', () => {
    expect(lines({ kind: 'unreleased' })).toEqual(['Not released yet']);
  });

  it("should read a Play's date, in bold, and its time", () => {
    const shown = lines({ kind: 'play', playedAt: PLAYED_AT, minutes: 53 });

    expect(shown).toEqual(['Watched on 4 Nov 2026', '53m']);
    expect(screen.getByText('4 Nov 2026').tagName).toBe('B');
  });

  it('should read the plays and their time', () => {
    expect(lines({ kind: 'plays', count: 3, minutes: 159 }))
      .toEqual(['3 plays', '2h 39m']);
  });

  it('should write one play in the singular', () => {
    expect(lines({ kind: 'plays', count: 1, minutes: 53 }))
      .toEqual(['1 play', '53m']);
  });

  it('should leave the time out when no runtime is known', () => {
    expect(lines({ kind: 'plays', count: 25, minutes: undefined }))
      .toEqual(['25 plays']);
    expect(lines({ kind: 'play', playedAt: PLAYED_AT, minutes: undefined }))
      .toEqual(['Watched on 4 Nov 2026']);
  });

  it('should read the progress, its percent in bold, above a bar', () => {
    const shown = lines({
      kind: 'progress',
      progress: {
        percent: 83,
        completed: 25,
        total: 30,
        counts: '25/30 eps — 25 plays',
      },
    });

    expect(shown).toEqual(['83% watched', '25/30 eps — 25 plays']);
    expect(screen.getByText('83%').tagName).toBe('B');
    expect(
      screen.getByRole('progressbar', { name: '83% watched', hidden: true }),
    )
      .toHaveAttribute('aria-valuenow', '83');
  });

  it('should draw no bar without progress', () => {
    render(WatchHover, { props: { hover: { kind: 'add' } } });

    expect(screen.queryByRole('progressbar', { hidden: true })).toBeNull();
  });
});
