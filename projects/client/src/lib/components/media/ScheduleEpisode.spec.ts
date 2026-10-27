import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { render, screen, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import ScheduleEpisode from './ScheduleEpisode.svelte';
import type { ScheduleEpisodeProps } from './ScheduleEpisodeProps.ts';

type EpisodeProps = Extract<ScheduleEpisodeProps, { kind: 'episode' }>;

const tag = createRawSnippet(() => ({
  render: () => '<span class="tag">Season Finale</span>',
}));

const SILO: EpisodeProps = {
  kind: 'episode',
  title: 'Silo',
  href: '/shows/silo',
  sameShow: false,
  episode: {
    sxe: '2x10',
    text: 'Into the Fire',
    href: '/shows/silo/seasons/2/episodes/10',
  },
  airsAt: new Date('2025-01-17T04:00:00.000Z'),
  network: 'Apple TV+',
};

const MOANA: ScheduleEpisodeProps = {
  kind: 'movie',
  title: 'Moana',
  href: '/movies/moana-2026',
  tagline: 'The ocean chose her for a reason.',
};

function renderEntry(props: ScheduleEpisodeProps) {
  const { container } = render(ScheduleEpisode, { props });

  const root = container.querySelector<HTMLElement>('.trakt-schedule-episode');
  if (!root) throw new Error('ScheduleEpisode rendered no root');

  return root;
}

function textOf(element: Element | null) {
  return element?.textContent?.replace(/\s+/g, ' ').trim();
}

describe('component: ScheduleEpisode', () => {
  describe('episode', () => {
    it("should link the show's title to the show", () => {
      const root = renderEntry(SILO);

      const title = within(root).getByRole('heading', { level: 4 });
      expect(within(title).getByRole('link', { name: 'Silo' }))
        .toHaveAttribute('href', '/shows/silo');
    });

    it('should link the sxe and episode title to the episode', () => {
      const root = renderEntry(SILO);

      const line = within(root).getByRole('heading', { level: 5 });
      const link = within(line).getByRole('link');
      expect(link).toHaveAttribute('href', '/shows/silo/seasons/2/episodes/10');
      expect(textOf(link)).toBe('2x10 Into the Fire');
      expect(within(link).getByText('2x10')).toHaveClass('episode-sxe');
    });

    it('should show the tag, then the air time and network', () => {
      const root = renderEntry({ ...SILO, tag });

      const meta = within(root).getByRole('heading', { level: 6 });
      expect([...meta.children].map(textOf))
        .toEqual(['Season Finale', '04:00 on Apple TV+']);
    });

    it.each([['with', tag], ['without', undefined]])(
      'should keep the meta line a heading %s a tag',
      (_, entryTag) => {
        const root = renderEntry({ ...SILO, tag: entryTag });

        expect(within(root).getByRole('heading', { level: 6 }))
          .toBeInTheDocument();
      },
    );

    it('should show the air line alone without a tag', () => {
      const root = renderEntry(SILO);

      const meta = within(root).getByRole('heading', { level: 6 });
      expect([...meta.children].map(textOf)).toEqual(['04:00 on Apple TV+']);
    });

    it('should carry the media key it is handed on its root', () => {
      const root = renderEntry({ ...SILO, mediaKey: 'show-180770' });

      expect(root).toHaveAttribute('data-media-key', 'show-180770');
    });

    it('should show the time alone when the show has no network', () => {
      const root = renderEntry({ ...SILO, network: null });

      expect(textOf(within(root).getByRole('heading', { level: 6 })))
        .toBe('04:00');
    });

    describe('time zone', () => {
      it('should show the air time in local time', () => {
        setTimeZone('Asia/Tokyo');

        const root = renderEntry(SILO);

        expect(textOf(within(root).getByRole('heading', { level: 6 })))
          .toBe('13:00 on Apple TV+');
      });
    });
  });

  describe('full season', () => {
    it('should name the season with no sxe and link it to its page', () => {
      const root = renderEntry({
        ...SILO,
        episode: {
          text: 'Season 2',
          href: '/shows/silo/seasons/2',
        },
      });

      const link = within(within(root).getByRole('heading', { level: 5 }))
        .getByRole('link');
      expect(textOf(link)).toBe('Season 2');
      expect(link.querySelector('.episode-sxe')).toBeNull();
      expect(link).toHaveAttribute('href', '/shows/silo/seasons/2');
    });
  });

  describe('same show', () => {
    it('should keep its episode line and tag but drop the title and air line', () => {
      const root = renderEntry({ ...SILO, sameShow: true, tag });

      expect(root).toHaveClass('is-same-show');
      expect(within(root).queryByRole('heading', { level: 4 })).toBeNull();
      expect(textOf(within(root).getByRole('heading', { level: 5 })))
        .toBe('2x10 Into the Fire');
      expect(textOf(within(root).getByRole('heading', { level: 6 })))
        .toBe('Season Finale');
      expect(screen.queryByText(/04:00/)).toBeNull();
    });

    it('should keep only the tag in a heading meta line when it has a tag', () => {
      const root = renderEntry({ ...SILO, sameShow: true, tag });

      const meta = root.querySelector('h6');
      expect([...(meta?.children ?? [])].map(textOf))
        .toEqual(['Season Finale']);
      expect(meta?.textContent).toBe('Season Finale');
      expect(meta).not.toHaveAttribute('role');
    });

    it('should keep an empty presentational meta line when it has no tag', () => {
      const root = renderEntry({ ...SILO, sameShow: true });

      const meta = root.querySelector('h6');
      expect(meta).not.toBeNull();
      expect(meta?.textContent).toBe('');
      expect(meta).toHaveAttribute('role', 'presentation');
    });

    it('should leave a first-of-show entry unmarked', () => {
      expect(renderEntry(SILO)).not.toHaveClass('is-same-show');
    });
  });

  describe('movie', () => {
    it('should link the title to the movie and show its tagline', () => {
      const root = renderEntry(MOANA);

      expect(
        within(within(root).getByRole('heading', { level: 4 }))
          .getByRole('link', { name: 'Moana' }),
      ).toHaveAttribute('href', '/movies/moana-2026');
      expect(textOf(within(root).getByRole('heading', { level: 6 })))
        .toBe('The ocean chose her for a reason.');
      expect(within(root).queryByRole('heading', { level: 5 })).toBeNull();
    });

    it('should show a tag it is handed before the tagline', () => {
      const root = renderEntry({ ...MOANA, tag });

      const meta = within(root).getByRole('heading', { level: 6 });
      expect(within(meta).getByText('Season Finale')).toHaveClass('tag');
      expect(textOf(meta))
        .toBe('Season FinaleThe ocean chose her for a reason.');
    });

    it('should show a tag it is handed with an empty tagline', () => {
      const root = renderEntry({ ...MOANA, tagline: '', tag });

      expect(textOf(within(root).getByRole('heading', { level: 6 })))
        .toBe('Season Finale');
    });

    it('should render no tagline line for an empty tagline', () => {
      const root = renderEntry({ ...MOANA, tagline: '' });

      expect(within(root).getByRole('heading', { level: 4 })).toBeVisible();
      expect(within(root).queryByRole('heading', { level: 6 })).toBeNull();
    });
  });
});
