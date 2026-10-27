import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';
import { render, screen, waitFor } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { markImageLoaded } from '$test/beds/image/markImageLoaded.ts';
import SummaryHero from './SummaryHero.svelte';

const BACKDROP = '/img/movies/000/297/485/fanarts/full/1a2b3c4d5e.jpg.webp';

const breadcrumb = createRawSnippet(() => ({
  render: () =>
    '<a href="/lists/official/top-gun-collection">Top Gun Collection</a>',
}));

const poster = createRawSnippet(() => ({
  render: () => '<span>FROM poster</span>',
}));

const premiere = createRawSnippet(() => ({
  render: () => '<span>Season Premiere</span>',
}));

const ratings = createRawSnippet(() => ({
  render: () => '<span>FROM ratings</span>',
}));

const neighbours = createRawSnippet(() => ({
  render: () => '<a href="/shows/from/seasons/3">Previous season</a>',
}));

describe('component: SummaryHero', () => {
  it('should title the page with the year after the title', () => {
    render(SummaryHero, {
      props: { backdrop: BACKDROP, title: 'Top Gun: Maverick', year: 2022 },
    });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Top Gun: Maverick 2022',
    );
  });

  it('should leave the year out when there is none', () => {
    render(SummaryHero, {
      props: { backdrop: BACKDROP, title: 'Top Gun: Maverick', year: null },
    });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /^Top Gun: Maverick$/,
    );
  });

  it('should leave a zoned year out until the app hydrates', async () => {
    render(SummaryHero, {
      props: { backdrop: BACKDROP, title: 'FROM', year: 2022, yearZoned: true },
    });
    const title = screen.getByRole('heading', { level: 1 });

    expect(title).toHaveTextContent(/^FROM$/);

    emulateHydrated();

    await waitFor(() => expect(title).toHaveTextContent('FROM 2022'));
  });

  it('should put the certification in the title after the year', () => {
    render(SummaryHero, {
      props: {
        backdrop: BACKDROP,
        title: 'FROM',
        year: 2022,
        certification: 'TV-MA',
      },
    });

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(/^FROM 2022TV-MA$/);
    expect(heading.querySelector('.trakt-certification')).not.toBeNull();
  });

  it('should leave no text between the year and the certification', () => {
    render(SummaryHero, {
      props: {
        backdrop: BACKDROP,
        title: 'FROM',
        year: 2022,
        certification: 'TV-MA',
      },
    });

    const nodes = Array.from(
      screen.getByRole('heading', { level: 1 }).childNodes,
    );
    const indexOf = (className: string) =>
      nodes.findIndex((node) =>
        node instanceof Element && node.classList.contains(className)
      );
    const year = indexOf('hero-year');
    const chip = indexOf('trakt-certification');

    expect(year).not.toBe(-1);
    expect(chip).toBeGreaterThan(year);
    const textBetween = nodes
      .slice(year + 1, chip)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent);
    expect(textBetween).toEqual([]);
  });

  it.each([null, undefined])(
    'should show no certification chip for %s',
    (certification) => {
      const { container } = render(SummaryHero, {
        props: { backdrop: BACKDROP, title: 'FROM', year: 2022, certification },
      });

      expect(container.querySelector('.trakt-certification')).toBeNull();
    },
  );

  it('should put the breadcrumb in a heading above the title', () => {
    render(SummaryHero, {
      props: {
        backdrop: BACKDROP,
        title: 'Top Gun: Maverick',
        year: 2022,
        breadcrumb,
      },
    });

    const crumb = screen.getByRole('heading', { level: 2 });
    expect(crumb).toHaveTextContent('Top Gun Collection');
    expect(screen.getByRole('link', { name: 'Top Gun Collection' }))
      .toHaveAttribute('href', '/lists/official/top-gun-collection');
  });

  it('should render no breadcrumb heading without a breadcrumb', () => {
    render(SummaryHero, {
      props: { backdrop: BACKDROP, title: 'FROM', year: 2022 },
    });

    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  });

  it('should title a movie or a show with no variant', () => {
    render(SummaryHero, {
      props: { backdrop: BACKDROP, title: 'FROM', year: 2022 },
    });

    expect(screen.getByRole('heading', { level: 1 })).not.toHaveAttribute(
      'data-variant',
    );
  });

  describe('an episode', () => {
    it('should title the page with the episode number before its title', () => {
      render(SummaryHero, {
        props: {
          backdrop: BACKDROP,
          title: 'The Arrival',
          sxe: '4x01',
          year: 2026,
        },
      });

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/^4x01 The Arrival 2026$/);
      expect(heading).toHaveAttribute('data-variant', 'episode');
    });

    it('should mark the episode title for its own style', () => {
      render(SummaryHero, {
        props: {
          backdrop: BACKDROP,
          title: 'The Arrival',
          sxe: '4x01',
          year: 2026,
        },
      });

      expect(screen.getByText('The Arrival')).toHaveClass('hero-title-main');
    });

    it('should put the premiere tag first in the title block, outside any heading', () => {
      const { container } = render(SummaryHero, {
        props: {
          backdrop: BACKDROP,
          title: 'The Arrival',
          sxe: '4x01',
          year: 2026,
          breadcrumb,
          premiere,
        },
      });

      const tag = screen.getByText('Season Premiere');
      const column = container.querySelector('.hero-title-column');
      expect(column?.firstElementChild?.contains(tag)).toBe(true);
      expect(tag.closest('h1, h2, h3, h4, h5, h6')).toBeNull();
    });

    it('should render no premiere slot without a premiere', () => {
      const { container } = render(SummaryHero, {
        props: { backdrop: BACKDROP, title: 'FROM', year: 2022, breadcrumb },
      });

      expect(container.querySelector('.hero-premiere')).toBeNull();
    });
  });

  it('should render the poster in the title block when given', () => {
    const { container } = render(SummaryHero, {
      props: { backdrop: BACKDROP, title: 'FROM', year: 2022, poster },
    });

    const slot = container.querySelector('.hero-mobile-poster');
    expect(slot).toHaveTextContent('FROM poster');
    expect(slot?.closest('.hero-title-block')).not.toBeNull();
  });

  it('should render no poster slot without a poster', () => {
    const { container } = render(SummaryHero, {
      props: { backdrop: BACKDROP, title: 'FROM', year: 2022 },
    });

    expect(container.querySelector('.hero-mobile-poster')).toBeNull();
  });

  it('should render the ratings bar at the foot of the hero, outside the title block', () => {
    const { container } = render(SummaryHero, {
      props: { backdrop: BACKDROP, title: 'FROM', year: 2022, ratings },
    });

    const slot = container.querySelector('.hero-ratings');
    expect(slot).toHaveTextContent('FROM ratings');
    expect(slot?.closest('.hero-title-block')).toBeNull();
    expect(slot?.parentElement).toHaveClass('trakt-summary-hero');
  });

  it('should render no ratings slot without a ratings bar', () => {
    const { container } = render(SummaryHero, {
      props: { backdrop: BACKDROP, title: 'FROM', year: 2022 },
    });

    expect(container.querySelector('.hero-ratings')).toBeNull();
  });

  it('should render the neighbour links over the hero, outside the title block', () => {
    const { container } = render(SummaryHero, {
      props: { backdrop: BACKDROP, title: 'FROM', year: 2022, neighbours },
    });

    const slot = container.querySelector('.hero-neighbours');
    expect(slot).toHaveTextContent('Previous season');
    expect(slot?.closest('.hero-title-block')).toBeNull();
    expect(slot?.parentElement).toHaveClass('trakt-summary-hero');
  });

  it('should render no neighbours slot without neighbour links', () => {
    const { container } = render(SummaryHero, {
      props: { backdrop: BACKDROP, title: 'FROM', year: 2022 },
    });

    expect(container.querySelector('.hero-neighbours')).toBeNull();
  });

  it('should keep the backdrop the page arrived with shown while it loads', () => {
    const { container } = render(SummaryHero, {
      props: { backdrop: BACKDROP, title: 'FROM', year: 2022 },
    });
    const backdrop = container.querySelector('img');

    expect(backdrop).toHaveAttribute('src', BACKDROP);
    expect(backdrop).not.toHaveClass('is-pending');
  });

  it('should hide a backdrop mounted after hydration until it loads', async () => {
    emulateHydrated();
    const { container } = render(SummaryHero, {
      props: { backdrop: BACKDROP, title: 'FROM', year: 2022 },
    });
    const backdrop = container.querySelector('img');
    expect(backdrop).toHaveClass('is-pending');

    await markImageLoaded(backdrop);

    expect(backdrop).not.toHaveClass('is-pending');
  });

  it('should hide a backdrop that broke before hydration', () => {
    const complete = vi
      .spyOn(HTMLImageElement.prototype, 'complete', 'get')
      .mockReturnValue(true);
    const naturalWidth = vi
      .spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get')
      .mockReturnValue(0);

    try {
      const { container } = render(SummaryHero, {
        props: { backdrop: BACKDROP, title: 'FROM', year: 2022 },
      });

      expect(container.querySelector('img')).toHaveClass('is-failed');
    } finally {
      complete.mockRestore();
      naturalWidth.mockRestore();
    }
  });

  it('should size the backdrop to a fanart', () => {
    const { container } = render(SummaryHero, {
      props: { backdrop: BACKDROP, title: 'FROM', year: 2022 },
    });
    const backdrop = container.querySelector('img');

    expect(backdrop).toHaveAttribute('width', '853');
    expect(backdrop).toHaveAttribute('height', '480');
  });

  it.each([
    ['a Placeholder', PLACEHOLDERS.fanart],
    ['no image', null],
  ])('should draw no backdrop for %s', (_case, backdrop) => {
    const { container } = render(SummaryHero, {
      props: { backdrop, title: 'FROM', year: 2022 },
    });

    expect(container.querySelector('img')).toBeNull();
  });
});
