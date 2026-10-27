import type { CastGroup } from '$lib/features/summary/_internal/CastGroup.ts';
import { MovieHereticPeopleMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticPeopleMappedMock.ts';
import { ShowSiloPeopleMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloPeopleMappedMock.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { screen, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { CastBlockProps } from './_internal/CastBlockProps.ts';
import CastBlock from './CastBlock.svelte';

const SHOW_PATH = '/shows/silo';
const MOVIE_PATH = '/movies/heretic-2024';
const SEASON_PATH = '/shows/silo/seasons/1';

const SHOW_GROUPS: ReadonlyArray<CastGroup> = [
  { key: 'regulars', members: ShowSiloPeopleMappedMock.cast },
  { key: 'guest', members: ShowSiloPeopleMappedMock.guestStars },
];

const MOVIE_GROUPS: ReadonlyArray<CastGroup> = [
  { key: 'cast', members: MovieHereticPeopleMappedMock.cast },
];

async function renderBlock(
  status: CastBlockProps['status'] = { kind: 'ready', data: SHOW_GROUPS },
) {
  const rendered = renderComponent(CastBlock, { props: { status } });
  await screen.findByRole('heading', { level: 2, name: 'Actors' });
  return rendered;
}

function panel() {
  return screen.getByRole('tabpanel');
}

function cellLinks() {
  return within(panel()).getAllByRole('link');
}

function selectedTab() {
  return screen.getByRole('tab', { selected: true });
}

function tabTexts() {
  return screen.getAllByRole('tab').map((tab) => tab.textContent?.trim());
}

describe('component: CastBlock', () => {
  it('should offer a tab per group with its member count', async () => {
    openAt(SHOW_PATH);
    await renderBlock();

    expect(screen.getByRole('tablist', { name: 'Actors' })).toBeVisible();
    expect(tabTexts()).toEqual(['Series Regulars 13', 'Guest Stars 2']);
  });

  it("should list the first group's members, each linking to the person", async () => {
    openAt(SHOW_PATH);
    await renderBlock();

    const links = cellLinks();
    expect(links).toHaveLength(13);
    expect(links.at(0)).toHaveAttribute('href', '/people/rebecca-ferguson');
    expect(links.at(0)).toHaveTextContent(
      /^Rebecca Ferguson\s*Juliette Nichols\s*19 episodes$/,
    );
  });

  it('should show the guest stars when the URL asks for them', async () => {
    openAt(`${SHOW_PATH}?actors=guest`);
    await renderBlock();

    expect(selectedTab()).toHaveTextContent('Guest Stars 2');
    expect(panel()).toHaveAccessibleName('Guest Stars 2');
    expect(cellLinks().map((link) => link.getAttribute('href'))).toEqual([
      '/people/rashida-jones',
      '/people/david-oyelowo',
    ]);
  });

  it("should name a season's regulars Season Regulars, beside the guest stars", async () => {
    openAt(SEASON_PATH);
    await renderBlock({
      kind: 'ready',
      data: [
        { key: 'seasonRegulars', members: ShowSiloPeopleMappedMock.cast },
        { key: 'guest', members: ShowSiloPeopleMappedMock.guestStars },
      ],
    });

    expect(tabTexts()).toEqual(['Season Regulars 13', 'Guest Stars 2']);
    expect(selectedTab()).toHaveTextContent('Season Regulars 13');
  });

  it('should show the cast alone on a page with no guest stars', async () => {
    openAt(`${MOVIE_PATH}?actors=guest`);
    await renderBlock({ kind: 'ready', data: MOVIE_GROUPS });

    expect(tabTexts()).toEqual(['Cast 15']);
    expect(selectedTab()).toHaveTextContent('Cast 15');
    expect(cellLinks()).toHaveLength(15);
  });

  it('should put the guest stars in the URL when their tab is chosen', async () => {
    openAt(`${SHOW_PATH}#actors`);
    await renderBlock();

    await userEvent.click(screen.getByRole('tab', { name: 'Guest Stars 2' }));

    expect(lastReplace()).toBe(`${SHOW_PATH}?actors=guest#actors`);
  });

  it('should take the tab out of the URL when the first group is chosen', async () => {
    openAt(`${SHOW_PATH}?actors=guest`);
    await renderBlock();

    await userEvent.click(
      screen.getByRole('tab', { name: 'Series Regulars 13' }),
    );

    expect(lastReplace()).toBe(SHOW_PATH);
  });

  it("should give a show cell's tooltip the name, character and episodes", async () => {
    openAt(SHOW_PATH);
    await renderBlock();

    expect(cellLinks().at(0)).toHaveAttribute(
      'title',
      'Rebecca Ferguson\nJuliette Nichols\n19 episodes',
    );
  });

  it("should give a movie cell's tooltip the name and character", async () => {
    openAt(MOVIE_PATH);
    await renderBlock({ kind: 'ready', data: MOVIE_GROUPS });

    expect(cellLinks().at(0)).toHaveAttribute('title', 'Hugh Grant\nMr. Reed');
  });

  it("should keep an empty group's tab and say so in its pane", async () => {
    openAt(`${SHOW_PATH}?actors=guest`);
    await renderBlock({
      kind: 'ready',
      data: [
        { key: 'regulars', members: ShowSiloPeopleMappedMock.cast },
        { key: 'guest', members: [] },
      ],
    });

    expect(selectedTab()).toHaveTextContent('Guest Stars 0');
    expect(panel()).toHaveTextContent(/^No cast listed\.$/);
    expect(within(panel()).queryByRole('list')).toBeNull();
  });

  it("should show each member's headshot thumbnail", async () => {
    openAt(SHOW_PATH);
    await renderBlock();

    const headshot = cellLinks().at(0)?.querySelector('img:not(.placeholder)');
    expect(headshot).toHaveAttribute(
      'src',
      ShowSiloPeopleMappedMock.cast.at(0)?.headshot.url.thumb,
    );
    expect(headshot).toHaveAttribute('alt', '');
  });

  it('should say so under the title, with no tabs, when nobody is listed', async () => {
    openAt(SHOW_PATH);
    await renderBlock({ kind: 'empty' });

    expect(screen.getByText('No cast listed.')).toBeVisible();
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('should keep the title, with no tabs, while the cast loads', async () => {
    openAt(SHOW_PATH);
    await renderBlock({ kind: 'loading' });

    expect(screen.getByRole('region', { name: 'Actors' }))
      .toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('tablist')).toBeNull();
  });
});
