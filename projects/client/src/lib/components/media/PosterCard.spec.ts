import { cardActions } from '$test/beds/media/cardActions.ts';
import { controlViewport } from '$test/beds/viewport/controlViewport.ts';
import { render, screen, within } from '@testing-library/svelte';
import { createRawSnippet, type Snippet, tick } from 'svelte';
import { describe, expect, expectTypeOf, it } from 'vitest';
import PosterCard from './PosterCard.svelte';
import type { PosterCardMedia, PosterCardProps } from './PosterCardProps.ts';

const viewport = controlViewport();

const badges = createRawSnippet(() => ({
  render: () => '<div class="ribbon">Season Premiere</div>',
}));

const progress = createRawSnippet(() => ({
  render: () => '<div class="bar">progress</div>',
}));

const subtitle = createRawSnippet(() => ({
  render: () => '<a href="/shows/silo">Silo</a>',
}));

const sort = createRawSnippet(() => ({
  render: () => '<span>Added 3 days ago</span>',
}));

const showLead = createRawSnippet(() => ({
  render: () => '<button type="button">Drop</button>',
}));

const image = createRawSnippet(() => ({
  render: () => '<img src="/img/poster.jpg" alt="Poster">',
}));

function renderCard(props: Partial<PosterCardProps> = {}) {
  const { container } = render(PosterCard, {
    props: {
      media: { type: 'show', title: 'Slow Horses' },
      href: '/shows/slow-horses',
      image,
      ...props,
    },
  });

  const root = container.querySelector('.trakt-poster-card');
  if (!root) throw new Error('PosterCard rendered no root');

  return { root, posterLink: root.querySelector('a.poster') };
}

describe('component: PosterCard', () => {
  describe('dropped', () => {
    it('should mark a dropped card and set the badge inside the poster link', () => {
      const { root, posterLink } = renderCard({
        droppedAt: new Date(2026, 2, 4, 21, 5),
      });

      expect(root).toHaveClass('is-dropped');
      expect(posterLink).toContainElement(
        screen.getByRole('img', { name: /Dropped on/ }),
      );
    });

    it('should leave a card without a drop date unmarked and unbadged', () => {
      const { root } = renderCard();

      expect(root).not.toHaveClass('is-dropped');
      expect(screen.queryByRole('img', { name: /Dropped on/ })).toBeNull();
    });
  });

  describe('viewport gate', () => {
    it('should hold the actions back until the card is in view', async () => {
      const { root } = renderCard({ actions: cardActions });

      expect(screen.queryByRole('button', { name: 'Mark as watched' }))
        .toBeNull();

      viewport.enter(root);
      await tick();

      expect(screen.getByRole('button', { name: 'Mark as watched' }))
        .toBeVisible();
    });
  });

  describe('titles', () => {
    it.each<[string, PosterCardMedia, string, string]>([
      [
        'movie',
        { type: 'movie', title: 'The Batman', year: 2022 },
        'The Batman',
        'The Batman (2022)',
      ],
      [
        'movie without a year',
        { type: 'movie', title: 'The Batman' },
        'The Batman',
        'The Batman',
      ],
      [
        'show',
        { type: 'show', title: 'Slow Horses' },
        'Slow Horses',
        'Slow Horses',
      ],
      [
        'season',
        { type: 'season', show: 'Silo', number: 3 },
        'Season 3',
        'Silo\nSeason 3',
      ],
      [
        'specials season',
        { type: 'season', show: 'Silo', number: 0 },
        'Specials',
        'Silo\nSpecials',
      ],
      [
        'episode',
        {
          type: 'episode',
          show: "Widow's Bay",
          season: 1,
          number: 6,
          title: 'Our History',
        },
        '1x06 Our History',
        `Widow's Bay\n1x06 "Our History"`,
      ],
    ])(
      'should title a %s card, its full-title tooltip and its poster tooltip',
      (_, media, heading, tooltip) => {
        const { posterLink } = renderCard({ media });

        const title = screen.getByRole('heading', { level: 3, name: heading });
        expect(title).toHaveAttribute('title', heading);
        expect(title.querySelector('a')).toHaveAttribute(
          'href',
          '/shows/slow-horses',
        );
        expect(posterLink).toHaveAttribute('title', tooltip);
      },
    );

    // A heading that clipped the ellipsis would clip its link's focus ring too.
    it('should clip a long title on its link, not on the heading', () => {
      renderCard();

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).not.toHaveClass('ellipsis');
      expect(title.querySelector('a')).toHaveClass('ellipsis');
    });

    it("should set an episode's number in bold before its name", () => {
      renderCard({
        media: {
          type: 'episode',
          show: "Widow's Bay",
          season: 1,
          number: 6,
          title: 'Our History',
        },
      });

      const title = screen.getByRole('heading', { level: 3 });
      expect(title.querySelector('b')).toHaveTextContent('1x06');
    });
  });

  describe('show line', () => {
    const EPISODE: PosterCardMedia = {
      type: 'episode',
      show: 'Silo',
      season: 2,
      number: 3,
      title: 'Solo',
    };

    it("should link a season or episode card's show on its one subtitle line", () => {
      renderCard({ media: EPISODE, showHref: '/shows/silo' });

      const line = screen.getByRole('heading', { level: 4 });
      const link = within(line).getByRole('link', { name: 'Silo' });
      expect(link).toHaveAttribute('href', '/shows/silo');
      expect(line).not.toHaveClass('ellipsis');
      expect(link).toHaveClass('ellipsis');
    });

    it("should set the show line first and the caller's line second", () => {
      const { root } = renderCard({
        media: EPISODE,
        showHref: '/shows/silo',
        lines: [sort, undefined],
      });

      expect(
        Array.from(
          root.querySelectorAll('.titles > *'),
          (child) => [child.tagName, child.textContent.trim()],
        ),
      ).toEqual([['H3', '2x03 Solo'], ['H4', 'Silo'], [
        'H4',
        'Added 3 days ago',
      ]]);
    });

    it('should keep two lines, the second empty, when the caller fills none', () => {
      const { root } = renderCard({
        media: { type: 'season', show: 'Silo', number: 3 },
        showHref: '/shows/silo',
        lines: [undefined, undefined],
      });

      expect(
        Array.from(
          root.querySelectorAll('.card-subtitle'),
          (line) => [line.tagName, line.textContent],
        ),
      ).toEqual([['H4', 'Silo'], ['DIV', '\u00a0']]);
    });

    it('should set the leading snippet inside the show line, before the name', () => {
      renderCard({ media: EPISODE, showHref: '/shows/silo', showLead });

      const line = screen.getByRole('heading', { level: 4 });
      const lead = within(line).getByRole('button', { name: 'Drop' });
      expect(
        lead.compareDocumentPosition(within(line).getByRole('link')),
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('should draw no show line without a show link', () => {
      const { root } = renderCard({
        media: EPISODE,
        lines: [undefined, undefined],
      });

      expect(root.querySelectorAll('.card-subtitle')).toHaveLength(2);
      expect(screen.queryAllByRole('heading', { level: 4 })).toEqual([]);
    });

    it('should draw no show line on a movie or show card', () => {
      renderCard({ showHref: '/shows/silo' });

      expect(screen.queryAllByRole('heading', { level: 4 })).toEqual([]);
    });

    it('should leave the second line empty and take no subtitle beside a show link', () => {
      type Base = Pick<PosterCardProps, 'media' | 'href' | 'image'>;
      type Show = { showHref: '/shows/silo' };

      expectTypeOf<Base & Show & { lines: readonly [Snippet, undefined] }>()
        .toExtend<PosterCardProps>();
      expectTypeOf<Base & Show & { lines: readonly [undefined, Snippet] }>()
        .not.toExtend<PosterCardProps>();
      expectTypeOf<Base & Show & { subtitle: Snippet }>().not
        .toExtend<PosterCardProps>();
    });
  });

  describe('slots', () => {
    it('should set the badges inside the poster link', () => {
      const { posterLink } = renderCard({ badges });

      expect(posterLink?.querySelector('.ribbon')).toHaveTextContent(
        'Season Premiere',
      );
    });

    it('should stack the progress, the title and the subtitle row', () => {
      const { root } = renderCard({ progress, subtitle });

      const titles = root.querySelector('.titles');
      expect(titles).toHaveClass('has-progress');
      expect(
        Array.from(titles?.children ?? [], (child) => child.textContent.trim()),
      ).toEqual(['progress', 'Slow Horses', 'Silo']);
      expect(screen.getByRole('heading', { level: 4, name: 'Silo' }))
        .toBeVisible();
    });

    it('should render no subtitle row by default', () => {
      renderCard();

      expect(screen.queryAllByRole('heading', { level: 4 })).toEqual([]);
    });

    it('should render both lines, a filled one as a heading and a missing one as a no-break space', () => {
      const { root } = renderCard({ lines: [subtitle, undefined] });

      const lines = [...root.querySelectorAll('.card-subtitle')];
      expect(lines.map((line) => [line.tagName, line.textContent])).toEqual([
        ['H4', 'Silo'],
        ['DIV', '\u00a0'],
      ]);
      expect(
        Array.from(
          root.querySelectorAll('.titles > *'),
          (child) => child.tagName,
        ),
      ).toEqual(['H3', 'H4', 'DIV']);
    });

    it('should not make a missing line a heading', () => {
      renderCard({ lines: [subtitle, undefined] });

      expect(
        screen.getAllByRole('heading', { level: 4 }).map((heading) =>
          heading.textContent
        ),
      ).toEqual(['Silo']);
    });

    it('should hide a missing line from assistive tech and keep a filled one', () => {
      const { root } = renderCard({ lines: [subtitle, undefined] });

      const [filled, empty] = root.querySelectorAll('.card-subtitle');
      expect(filled).not.toHaveAttribute('aria-hidden');
      expect(empty).toHaveAttribute('aria-hidden', 'true');
    });

    it('should render two no-break-space lines and no heading when both are missing', () => {
      const { root } = renderCard({ lines: [undefined, undefined] });

      expect(
        Array.from(
          root.querySelectorAll('.card-subtitle'),
          (line) => [line.tagName, line.textContent],
        ),
      ).toEqual([['DIV', '\u00a0'], ['DIV', '\u00a0']]);
      expect(screen.queryAllByRole('heading', { level: 4 })).toEqual([]);
    });

    it('should not wrap a line in a link of its own', () => {
      const { root } = renderCard({ lines: [undefined, subtitle] });

      const empty = root.querySelector('.card-subtitle');
      const filled = screen.getByRole('heading', { level: 4 });
      expect(empty?.querySelector('a')).toBeNull();
      expect(filled.querySelectorAll('a')).toHaveLength(1);
      expect(filled.closest('a')).toBeNull();
    });

    it('should take a subtitle or two lines, never both', () => {
      type Base = Pick<PosterCardProps, 'media' | 'href' | 'image'>;
      type Lines = readonly [Snippet | undefined, Snippet | undefined];

      expectTypeOf<Base & { subtitle: Snippet }>().toExtend<PosterCardProps>();
      expectTypeOf<Base & { lines: Lines }>().toExtend<PosterCardProps>();
      expectTypeOf<Base & { subtitle: Snippet; lines: Lines }>().not
        .toExtend<PosterCardProps>();
    });

    it('should keep the strip, recessed by default, before the card is in view', () => {
      const { root } = renderCard({ actions: cardActions });

      expect(root).toHaveAttribute('data-strip', 'recessed');
      expect(root.querySelector('.poster-strip')).not.toBeNull();
    });

    it('should carry the overlay strip variant', () => {
      const { root } = renderCard({ strip: 'overlay' });

      expect(root).toHaveAttribute('data-strip', 'overlay');
    });

    it('should carry the media type', () => {
      const { root } = renderCard({
        media: { type: 'season', show: 'Silo', number: 3 },
      });

      expect(root).toHaveAttribute('data-type', 'season');
    });
  });
});
