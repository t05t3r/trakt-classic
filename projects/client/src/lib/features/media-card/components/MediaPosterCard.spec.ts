import type { PosterCardSubtitles } from '$lib/components/media/PosterCardProps.ts';
import { toMediaCard } from '$lib/features/media-card/toMediaCard.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { itemOfType } from '$test/beds/dashboard/itemOfType.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { screen, waitFor, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, expectTypeOf, it } from 'vitest';
import MediaPosterCard from './MediaPosterCard.svelte';
import type { MediaPosterCardProps } from './MediaPosterCardProps.ts';

const HERETIC = {
  card: toMediaCard({ type: 'movie', movie: MovieHereticMappedMock }),
  poster: MovieHereticMappedMock.poster,
  posterTitle: 'Heretic',
};

const badges = createRawSnippet(() => ({
  render: () => '<div class="ribbon">Series Premiere</div>',
}));

const progress = createRawSnippet(() => ({
  render: () => '<div class="bar">3 of 8 watched</div>',
}));

const subtitle = createRawSnippet(() => ({
  render: () => '<button type="button">Hide</button>',
}));

const line = createRawSnippet(() => ({
  render: () => '<span>Added 3 days ago</span>',
}));

const showLead = createRawSnippet(() => ({
  render: () => '<button type="button">Drop</button>',
}));

const season = itemOfType('season');
const SILO_SEASON = {
  card: toMediaCard({ type: 'season', ...season.entry }),
  poster: assertDefined(season.entry.season.poster),
  posterTitle: season.entry.show.title,
};

const episode = itemOfType('episode');
const DRAGON_EPISODE = {
  card: toMediaCard({ type: 'episode', ...episode.entry }),
  poster: episode.entry.show.poster,
  posterTitle: episode.entry.show.title,
};

async function renderCard(props: MediaPosterCardProps) {
  const { container, userLoaded } = renderComponent(MediaPosterCard, {
    props,
  });
  await userLoaded;

  return waitFor(() => {
    const root = container.querySelector('.trakt-poster-card');
    if (!root) throw new Error('MediaPosterCard rendered no poster card');

    return root;
  });
}

// The card fills its strip once it is in view.
function findPart(root: Element, selector: string) {
  return waitFor(() => {
    const part = root.querySelector<HTMLElement>(selector);
    if (!part) throw new Error(`MediaPosterCard drew no ${selector}`);

    return part;
  });
}

describe('component: MediaPosterCard', () => {
  it("should draw the poster's thumb, named by the poster title, inside the poster link", async () => {
    const root = await renderCard(HERETIC);

    const image = screen.getByRole('img', { name: '"Heretic" poster' });
    expect(image).toHaveAttribute(
      'src',
      '/img/movies/000/916/302/posters/thumb/db9d66deb8.jpg.webp',
    );
    expect(root.querySelector('a.poster')).toContainElement(image);
    expect(root.querySelector('a.poster')).toHaveAttribute(
      'href',
      '/movies/heretic-2024',
    );
  });

  it('should set the smaller community rating in the smaller quick-icons strip', async () => {
    const root = await renderCard(HERETIC);

    const strip = await findPart(root, '.trakt-quick-actions');
    const rating = (await within(strip).findByText('72%'))
      .closest('.trakt-community-rating');

    expect(strip).toHaveAttribute('data-size', 'smaller');
    expect(rating).toHaveAttribute('data-variant', 'smaller');
  });

  it('should give a season card the smaller quick-icons, named after the season and its show, beside its community rating', async () => {
    const root = await renderCard(SILO_SEASON);

    const strip = await findPart(root, '.trakt-quick-actions');
    const rating = (await within(strip).findByText('82%'))
      .closest('.trakt-community-rating');

    expect(strip).toHaveAttribute('data-size', 'smaller');
    expect(rating).toHaveAttribute('data-variant', 'smaller');
    expect(
      within(strip).getByRole('button', {
        name: 'Mark "Season 3 of Silo" as watched',
      }),
    ).toHaveAttribute('data-action', 'watch');
  });

  it('should set the badges inside the poster link', async () => {
    const root = await renderCard({ ...HERETIC, badges });

    expect(root.querySelector('a.poster .ribbon')).toHaveTextContent(
      'Series Premiere',
    );
  });

  it('should set the progress in the titles', async () => {
    const root = await renderCard({ ...HERETIC, progress });

    expect(root.querySelector('.titles .card-progress')).toHaveTextContent(
      '3 of 8 watched',
    );
  });

  it('should set the subtitle under the title', async () => {
    await renderCard({ ...HERETIC, subtitle });

    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent(
      'Hide',
    );
  });

  it('should set the lines under the title, an empty one held blank', async () => {
    const root = await renderCard({ ...HERETIC, lines: [line, undefined] });

    expect(root.querySelectorAll('.card-subtitle')).toHaveLength(2);
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent(
      'Added 3 days ago',
    );
  });

  it("should lead the show line with the caller's show link and lead", async () => {
    await renderCard({
      ...DRAGON_EPISODE,
      showHref: DRAGON_EPISODE.card.showHref,
      showLead,
    });

    const showLine = screen.getByRole('heading', { level: 4 });
    expect(within(showLine).getByRole('link', { name: 'House of the Dragon' }))
      .toHaveAttribute('href', '/shows/house-of-the-dragon');
    expect(within(showLine).getByRole('button', { name: 'Drop' }))
      .toBeVisible();
  });

  it("should draw no show line unless the caller passes the card's show link", async () => {
    await renderCard(DRAGON_EPISODE);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'The Heirs of the Dragon',
    );
    expect(screen.queryAllByRole('heading', { level: 4 })).toEqual([]);
  });

  it('should keep the subtitle choices of the poster card', () => {
    type Base = Pick<MediaPosterCardProps, 'card' | 'poster' | 'posterTitle'>;

    expectTypeOf<MediaPosterCardProps>().toExtend<PosterCardSubtitles>();
    expectTypeOf<Base & PosterCardSubtitles>().toExtend<MediaPosterCardProps>();
  });
});
