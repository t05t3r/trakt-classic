import { UpNextResponseMock } from '$mocks/data/sync/response/UpNextResponseMock.ts';
import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { ShowDevsResponseMock } from '$mocks/data/summary/shows/devs/ShowDevsResponseMock.ts';
import { DROP_URL } from '$mocks/data/users/DROP_URL.ts';
import { EarlyRatingsUserSettingsResponseMock } from '$mocks/data/users/response/EarlyRatingsUserSettingsResponseMock.ts';
import { USER_SETTINGS_URL } from '$mocks/data/users/USER_SETTINGS_URL.ts';
import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { safeLocalStorage } from '$lib/utils/storage/safeLocalStorage.ts';
import { server } from '$mocks/server.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { cards } from '$test/beds/dashboard/cards.ts';
import { readyCards } from '$test/beds/dashboard/readyCards.ts';
import { renderSection } from '$test/beds/dashboard/renderSection.ts';
import { serveUpNext } from '$test/beds/dashboard/serveUpNext.ts';
import { REMOVALS } from '$test/beds/focus/REMOVALS.ts';
import { openMenuFromKeyboard } from '$test/beds/menus/openMenuFromKeyboard.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { collapsedCells } from '$test/beds/pagination/collapsedCells.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { stubScrollIntoView } from '$test/beds/scroll/stubScrollIntoView.ts';
import { cleanup, screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import type { UpNextResponse } from '@trakt/api';
import { http, HttpResponse } from 'msw';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
} from 'vitest';
import UpNextSection from './UpNextSection.svelte';

// The list icon renders only once a layout matches.
const setLayout = fakeLayouts({ desktop: WELL_KNOWN_MEDIA_QUERY.desktop });

const SILO = UpNextResponseMock.at(0);
if (!SILO) throw new Error('UpNextResponseMock has no Silo row');

// Devs with the episodes before `number` watched; the mocks hold no play of it.
function devsAt(number: number): UpNextResponse {
  return {
    show: ShowDevsResponseMock,
    progress: {
      aired: 8,
      completed: number - 1,
      last_watched_at: null,
      reset_at: null,
      next_episode: {
        ...EpisodeSiloResponseMock,
        ids: { ...EpisodeSiloResponseMock.ids, trakt: 7000 + number },
        number,
        title: `Episode ${number}`,
        episode_type: 'standard',
      },
      last_episode: null,
    },
  };
}

const SECTION = { component: UpNextSection, name: 'Up Next' };

const CARD_SELECTOR = '.trakt-poster-card';

// Thirteen shows fill two desktop rows of six and one more.
const THREE_ROWS = Array.from({ length: 13 }, (_, index) => devsAt(index + 2));

// One Devs card whose watch button takes a click.
async function readyWatchButton() {
  serveUpNext(() => HttpResponse.json([devsAt(2)]));
  const region = await renderSection(SECTION);
  const [card] = await readyCards({
    region,
    selector: CARD_SELECTOR,
    count: 1,
  });
  if (!card) throw new Error('no card');
  const watch = await within(card).findByRole('button', {
    name: 'Mark "Episode 2" as watched',
  });
  await waitFor(() => expect(watch).toHaveAttribute('aria-disabled', 'false'));

  return { region, card, watch };
}

// Silo's card, its Drop menu open, among the entries served.
async function openSiloDropMenu(entries = [devsAt(2), SILO]) {
  stubClientRects();
  serveUpNext(() => HttpResponse.json(entries));
  const region = await renderSection(SECTION);
  const silo = (await readyCards({
    region,
    selector: CARD_SELECTOR,
    count: entries.length,
  })).find((card) => within(card).queryByRole('link', { name: 'Silo' }));
  if (!silo) throw new Error('no Silo card');
  const trigger = within(silo).getByRole('button', {
    name: 'Flag show "Silo" as dropped',
  });
  await userEvent.click(trigger);
  await screen.findByRole('menu', { name: 'When did you drop this?' });

  return { region, silo, trigger };
}

async function readyDevsWatchButton(region: HTMLElement, silo: HTMLElement) {
  const devs = cards(region, CARD_SELECTOR).find((card) => card !== silo);
  if (!devs) throw new Error('no Devs card');
  const watch = await within(devs).findByRole('button', {
    name: 'Mark "Episode 2" as watched',
  });
  await waitFor(() => expect(watch).toHaveAttribute('aria-disabled', 'false'));

  return watch;
}

// Holds the drop in flight until its release or the test ends.
function holdDrop(status = 201) {
  return holdRequest({
    method: 'post',
    url: DROP_URL,
    answer: () => new HttpResponse(null, { status }),
  });
}

describe('section: UpNextSection', () => {
  beforeEach(() => setLayout('desktop'));

  it('should hold the header with its spinner and no body while loading', async () => {
    serveUpNext(holdResponse(() => HttpResponse.json([])).answer);

    const region = await renderSection(SECTION);

    const heading = within(region).getByRole('heading', { level: 2 });
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(heading).toHaveTextContent('Up Next');
    expect(heading.querySelector('.section-title-spinner')).not.toBeNull();
    expect(region.querySelector('.help-text'))
      .toHaveTextContent('Sorted by activity date.');
    expect(region.querySelector('.trakt-empty-state')).toBeNull();
    expect(cards(region, CARD_SELECTOR)).toEqual([]);
  });

  it('should drop the gap under its help text', async () => {
    const region = await renderSection(SECTION);

    expect(region.querySelector('.trakt-section-header'))
      .toHaveAttribute('data-help-text-gap', 'none');
  });

  it('should link the header to the progress page', async () => {
    const region = await renderSection(SECTION);

    expect(within(region).getByRole('link', { name: 'Progress' }))
      .toHaveAttribute('href', '/users/me/progress');
  });

  it.each([
    { answer: 'no shows', respond: () => HttpResponse.json([]) },
    {
      answer: 'no content',
      respond: () => new HttpResponse(null, { status: 204 }),
    },
  ])('should show the empty box for $answer', async ({ respond }) => {
    serveUpNext(respond);

    const region = await renderSection(SECTION);

    expect(
      await within(region).findByText(
        'Nothing up next. Start watching a show and it will appear here.',
      ),
    ).toBeVisible();
    expect(region).toHaveAttribute('aria-busy', 'false');
  });

  it('should show the error box and load the cards on Retry', async () => {
    serveUpNext(notFound);
    const region = await renderSection(SECTION);
    const retry = await within(region).findByRole('button', { name: 'Retry' });
    expect(region).toHaveTextContent("Couldn't load this section.");

    serveUpNext(() => HttpResponse.json([SILO]));
    await userEvent.click(retry);

    const [card] = await readyCards({
      region,
      selector: CARD_SELECTOR,
      count: 1,
    });
    expect(card?.querySelector('h3')).toHaveTextContent('1x01 Freedom Day');
  });

  describe('row count', () => {
    afterEach(() => safeLocalStorage.clear());

    it('should open the stored rows after a remount, on less and on more', async () => {
      // "less" scrolls its controls into view, which jsdom cannot do.
      stubScrollIntoView();
      serveUpNext(() => HttpResponse.json(THREE_ROWS));
      const first = await renderSection(SECTION);
      await readyCards({ region: first, selector: CARD_SELECTOR, count: 13 });
      await userEvent.click(
        within(first).getByRole('button', { name: 'less' }),
      );
      cleanup();

      const second = await renderSection(SECTION);
      await readyCards({ region: second, selector: CARD_SELECTOR, count: 13 });
      expect(collapsedCells(second)).toHaveLength(1);
      await userEvent.click(
        within(second).getByRole('button', { name: 'more' }),
      );
      cleanup();

      const region = await renderSection(SECTION);
      await readyCards({ region, selector: CARD_SELECTOR, count: 13 });
      expect(collapsedCells(region)).toHaveLength(0);
    });

    it('should render the cards with the stored rows from the start, with no jump', async () => {
      // "less" scrolls its controls into view, which jsdom cannot do.
      stubScrollIntoView();
      serveUpNext(() => HttpResponse.json(THREE_ROWS));
      const first = await renderSection(SECTION);
      await readyCards({ region: first, selector: CARD_SELECTOR, count: 13 });
      const less = within(first).getByRole('button', { name: 'less' });
      await userEvent.click(less);
      await userEvent.click(less);
      cleanup();
      const seen = new Set<number>();
      const observer = new MutationObserver(() => {
        const region = document.querySelector<HTMLElement>(
          '.trakt-up-next-section',
        );
        if (region && cards(region, CARD_SELECTOR).length === 13) {
          seen.add(collapsedCells(region).length);
        }
      });
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
      });
      onTestFinished(() => observer.disconnect());

      const region = await renderSection(SECTION);
      await readyCards({ region, selector: CARD_SELECTOR, count: 13 });
      await waitFor(() => expect(collapsedCells(region)).toHaveLength(7));

      expect([...seen]).toEqual([7]);
    });
  });

  describe('cards', () => {
    it('should render one card per show, in the order served', async () => {
      serveUpNext(() => HttpResponse.json([devsAt(2), SILO]));

      const region = await renderSection(SECTION);

      expect(
        (await readyCards({ region, selector: CARD_SELECTOR, count: 2 })).map((
          card,
        ) => card.querySelector('h3')?.textContent?.trim()),
      ).toEqual(['1x02 Episode 2', '1x01 Freedom Day']);
      expect(region).toHaveAttribute('aria-busy', 'false');
    });

    it('should lay the cards out as a poster grid', async () => {
      serveUpNext(() => HttpResponse.json([SILO]));
      const region = await renderSection(SECTION);
      await readyCards({ region, selector: CARD_SELECTOR, count: 1 });

      expect(region.querySelector('.trakt-row-reveal-grid'))
        .toHaveAttribute('data-variant', 'posters');
    });

    it('should link the poster and title to the episode and the subtitle to its show', async () => {
      serveUpNext(() => HttpResponse.json([SILO]));
      const region = await renderSection(SECTION);
      const [card] = await readyCards({
        region,
        selector: CARD_SELECTOR,
        count: 1,
      });
      if (!card) throw new Error('no card');

      const poster = card.querySelector('a.poster');
      const title = within(card).getByRole('link', {
        name: '1x01 Freedom Day',
      });
      const show = within(card).getByRole('link', { name: 'Silo' });

      expect(poster).toHaveAttribute(
        'href',
        '/shows/silo/seasons/1/episodes/1',
      );
      expect(title).toHaveAttribute('href', '/shows/silo/seasons/1/episodes/1');
      expect(show).toHaveAttribute('href', '/shows/silo');
      expect(card.querySelector('h4')).toContainElement(show);
    });

    it('should put the Drop icon before the show name, inside the card', async () => {
      serveUpNext(() => HttpResponse.json([SILO]));
      const region = await renderSection(SECTION);
      const [card] = await readyCards({
        region,
        selector: CARD_SELECTOR,
        count: 1,
      });
      if (!card) throw new Error('no card');

      const subtitle = within(card).getByRole('heading', { level: 4 });
      const drop = within(subtitle).getByRole('button', {
        name: 'Flag show "Silo" as dropped',
      });

      expect(drop.closest('.trakt-poster-card')).not.toBeNull();
      expect(
        drop.compareDocumentPosition(within(subtitle).getByRole('link')),
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    // A heading that clipped the ellipsis would clip its link's focus ring too.
    it('should clip a long show name on its link, not on the subtitle heading', async () => {
      serveUpNext(() => HttpResponse.json([SILO]));
      const region = await renderSection(SECTION);
      const [card] = await readyCards({
        region,
        selector: CARD_SELECTOR,
        count: 1,
      });
      if (!card) throw new Error('no card');

      const subtitle = within(card).getByRole('heading', { level: 4 });
      expect(subtitle).not.toHaveClass('ellipsis');
      expect(within(subtitle).getByRole('link')).toHaveClass('ellipsis');
    });

    it('should show the show poster, the episode type and the progress bar linking to the progress page', async () => {
      serveUpNext(() => HttpResponse.json([SILO]));
      const region = await renderSection(SECTION);
      const [card] = await readyCards({
        region,
        selector: CARD_SELECTOR,
        count: 1,
      });
      if (!card) throw new Error('no card');

      const progress = within(card).getByRole('link', {
        name: '0 of 20 episodes watched',
      });

      expect(within(card).getByRole('img', { name: '"Silo" poster' }))
        .toHaveAttribute(
          'src',
          '/img/shows/000/180/770/posters/thumb/5312f1d1cf.jpg.webp',
        );
      expect(card.querySelector('.trakt-episode-type-ribbon'))
        .toHaveTextContent('Series Premiere');
      expect(progress).toHaveAttribute('href', '/users/me/progress');
      expect(within(progress).getByRole('progressbar'))
        .toHaveAttribute('aria-valuenow', '0');
    });

    it('should show the community rating of an unreleased episode to a user who displays early ratings', async () => {
      server.use(
        http.get(
          USER_SETTINGS_URL,
          () => HttpResponse.json(EarlyRatingsUserSettingsResponseMock),
        ),
      );
      const row = devsAt(2);
      const { next_episode } = row.progress;
      if (!next_episode) throw new Error('no next episode');
      serveUpNext(() =>
        HttpResponse.json([{
          ...row,
          progress: {
            ...row.progress,
            next_episode: {
              ...next_episode,
              first_aired: '2999-01-01T00:00:00.000Z',
              effective_release_date: '2999-01-01T00:00:00.000Z',
            },
          },
        }])
      );
      const region = await renderSection(SECTION);
      const [card] = await readyCards({
        region,
        selector: CARD_SELECTOR,
        count: 1,
      });
      if (!card) throw new Error('no card');

      await within(card).findByRole('button', {
        name: 'Add or remove "Episode 2" from lists',
      });

      expect(card.querySelector('.trakt-community-rating'))
        .toHaveTextContent('78%');
    });

    it('should give the card the smaller watch and list icons and the community rating, with no favourite', async () => {
      serveUpNext(() => HttpResponse.json([devsAt(2)]));
      const region = await renderSection(SECTION);
      const [card] = await readyCards({
        region,
        selector: CARD_SELECTOR,
        count: 1,
      });
      if (!card) throw new Error('no card');

      const icons = await waitFor(() => {
        const found = [...card.querySelectorAll('.trakt-quick-icon')];
        expect(found).toHaveLength(2);
        return found;
      });

      expect(icons.map((icon) => icon.getAttribute('aria-label'))).toEqual([
        'Mark "Episode 2" as watched',
        'Add or remove "Episode 2" from lists',
      ]);
      expect(card.querySelector('.trakt-quick-actions'))
        .toHaveAttribute('data-size', 'smaller');
      expect(card.querySelector('.trakt-community-rating'))
        .toHaveTextContent('78%');
      expect(card.querySelector('.trakt-community-rating'))
        .toHaveAttribute('data-variant', 'smaller');
    });

    it('should hide the community rating of an aired episode whose effective release date is still to come', async () => {
      const row = devsAt(2);
      const { next_episode } = row.progress;
      if (!next_episode) throw new Error('no next episode');
      serveUpNext(() =>
        HttpResponse.json([{
          ...row,
          progress: {
            ...row.progress,
            next_episode: {
              ...next_episode,
              effective_release_date: '2999-01-01T00:00:00.000Z',
            },
          },
        }])
      );
      const region = await renderSection(SECTION);
      const [card] = await readyCards({
        region,
        selector: CARD_SELECTOR,
        count: 1,
      });
      if (!card) throw new Error('no card');

      await waitFor(() =>
        expect(card.querySelectorAll('.trakt-quick-icon')).toHaveLength(2)
      );

      expect(card.querySelector('.trakt-community-rating')).toBeNull();
    });

    it('should show the community rating of an episode released before its air date', async () => {
      const row = devsAt(2);
      const { next_episode } = row.progress;
      if (!next_episode) throw new Error('no next episode');
      serveUpNext(() =>
        HttpResponse.json([{
          ...row,
          progress: {
            ...row.progress,
            next_episode: {
              ...next_episode,
              first_aired: '2999-01-01T00:00:00.000Z',
              effective_release_date: '2023-05-05T01:00:00.000Z',
            },
          },
        }])
      );
      const region = await renderSection(SECTION);
      const [card] = await readyCards({
        region,
        selector: CARD_SELECTOR,
        count: 1,
      });
      if (!card) throw new Error('no card');

      await within(card).findByRole('button', {
        name: 'Add or remove "Episode 2" from lists',
      });

      expect(card.querySelector('.trakt-community-rating'))
        .toHaveTextContent('78%');
    });

    it('should replace a card whose show moves on to its next episode', async () => {
      const { region, card, watch } = await readyWatchButton();

      serveUpNext(() => HttpResponse.json([devsAt(3)]));
      await userEvent.click(watch);

      await waitFor(() =>
        expect(region.querySelector('h3')).toHaveTextContent('1x03 Episode 3')
      );
      expect(card.isConnected).toBe(false);
    });

    it.each(REMOVALS)(
      'should hand the focus to the section when the focused card leaves, where removal $removal',
      async ({ emulate }) => {
        const { region, card, watch } = await readyWatchButton();
        emulate();

        serveUpNext(() => HttpResponse.json([devsAt(3)]));
        watch.focus();
        await userEvent.keyboard('{Enter}');

        await waitFor(() => expect(card.isConnected).toBe(false));
        expect(document.activeElement).toBe(region);
      },
    );

    it.each(REMOVALS)(
      'should hand the focus to the section when the last card leaves for the empty box, where removal $removal',
      async ({ emulate }) => {
        const { region, card, watch } = await readyWatchButton();
        emulate();

        serveUpNext(() => HttpResponse.json([]));
        watch.focus();
        await userEvent.keyboard('{Enter}');

        expect(
          await within(region).findByText(
            'Nothing up next. Start watching a show and it will appear here.',
          ),
        ).toBeVisible();
        expect(card.isConnected).toBe(false);
        expect(document.activeElement).toBe(region);
      },
    );

    it('should leave the focus where it moved before the card leaves', async () => {
      const { region, card, watch } = await readyWatchButton();
      const refetch = holdResponse(() => HttpResponse.json([devsAt(3)]));
      serveUpNext(refetch.answer);

      watch.focus();
      await userEvent.keyboard('{Enter}');
      const progress = within(region).getByRole('link', { name: 'Progress' });
      progress.focus();
      refetch.release();

      await waitFor(() => expect(card.isConnected).toBe(false));
      expect(document.activeElement).toBe(progress);
    });

    it('should leave the focus on the page when it left the card before the card leaves', async () => {
      const { card, watch } = await readyWatchButton();

      watch.focus();
      watch.blur();
      serveUpNext(() => HttpResponse.json([devsAt(3)]));
      watch.click();

      await waitFor(() => expect(card.isConnected).toBe(false));
      expect(document.activeElement).toBe(document.body);
    });

    // As a Safari click does, which focuses no button.
    it('should not take the focus when a card that never held it leaves', async () => {
      const { card, watch } = await readyWatchButton();

      serveUpNext(() => HttpResponse.json([devsAt(3)]));
      watch.click();

      await waitFor(() => expect(card.isConnected).toBe(false));
      expect(document.activeElement).toBe(document.body);
    });
  });

  describe('drop', () => {
    it('should remove the card before the drop lands', async () => {
      holdDrop();
      const { region, silo } = await openSiloDropMenu();

      await userEvent.click(
        screen.getByRole('menuitem', { name: 'Right now' }),
      );

      await waitFor(() => expect(silo.isConnected).toBe(false));
      expect(
        cards(region, CARD_SELECTOR).map((card) =>
          card.querySelector('h3')?.textContent
        ),
      ).toEqual(['1x02 Episode 2']);
    });

    it('should post the drop for the show on the card', async () => {
      const bodies: unknown[] = [];
      server.use(
        http.post(DROP_URL, async ({ request }) => {
          bodies.push(await request.json());
          return new HttpResponse(null, { status: 201 });
        }),
      );
      await openSiloDropMenu();

      await userEvent.click(
        screen.getByRole('menuitem', { name: 'Right now' }),
      );

      await waitFor(() =>
        expect(bodies).toEqual([{
          shows: [{ ids: { trakt: SILO.show.ids.trakt } }],
        }])
      );
    });

    it('should bring the card back and show the error toast when the drop fails', async () => {
      const drop = holdDrop(500);
      const { region, silo } = await openSiloDropMenu();

      await userEvent.click(
        screen.getByRole('menuitem', { name: 'Right now' }),
      );
      await waitFor(() => expect(silo.isConnected).toBe(false));
      drop.release();

      expect(
        await within(screen.getByRole('status')).findByText(
          "Couldn't save. Try again.",
        ),
      ).toBeVisible();
      await waitFor(() =>
        expect(within(region).getByRole('link', { name: 'Silo' }))
          .toBeVisible()
      );
      expect(cards(region, CARD_SELECTOR)).toHaveLength(2);
    });

    it('should show the empty box when the last card is dropped', async () => {
      holdDrop();
      const { region } = await openSiloDropMenu([SILO]);

      await userEvent.click(
        screen.getByRole('menuitem', { name: 'Right now' }),
      );

      expect(
        await within(region).findByText(
          'Nothing up next. Start watching a show and it will appear here.',
        ),
      ).toBeVisible();
      expect(cards(region, CARD_SELECTOR)).toEqual([]);
    });

    it.each(REMOVALS)(
      'should hand the focus to the section when Right now is chosen by keyboard, where removal $removal',
      async ({ emulate }) => {
        holdDrop();
        stubClientRects();
        serveUpNext(() => HttpResponse.json([devsAt(2), SILO]));
        const region = await renderSection(SECTION);
        const [, silo] = await readyCards({
          region,
          selector: CARD_SELECTOR,
          count: 2,
        });
        if (!silo) throw new Error('no Silo card');
        emulate();

        await openMenuFromKeyboard(
          within(silo).getByRole('button', {
            name: 'Flag show "Silo" as dropped',
          }),
          'Right now',
        );
        await userEvent.keyboard('{Enter}');

        await waitFor(() => expect(silo.isConnected).toBe(false));
        await waitFor(() =>
          expect(
            screen.queryByRole('menu', { name: 'When did you drop this?' }),
          ).not.toBeInTheDocument()
        );
        expect(document.activeElement).toBe(region);
      },
    );

    it('should hand the focus to the section when a card leaves after an outside click closed its menu', async () => {
      const { region, silo, trigger } = await openSiloDropMenu();
      const watch = await readyDevsWatchButton(region, silo);
      const menu = screen.getByRole('menu', {
        name: 'When did you drop this?',
      });
      await waitFor(() =>
        expect(menu.contains(document.activeElement)).toBe(true)
      );

      await userEvent.pointer({
        keys: '[MouseLeft]',
        target: document.documentElement,
        coords: { clientX: 100, clientY: 100 },
      });
      await waitFor(() => expect(menu).not.toBeInTheDocument());
      expect(trigger).toHaveFocus();
      serveUpNext(() => HttpResponse.json([devsAt(3)]));
      watch.click();

      await waitFor(() => expect(silo.isConnected).toBe(false));
      expect(document.activeElement).toBe(region);
    });

    it('should hand the focus to the section when a card leaves after Escape closed its menu', async () => {
      stubClientRects();
      serveUpNext(() => HttpResponse.json([devsAt(2), SILO]));
      const region = await renderSection(SECTION);
      const [, silo] = await readyCards({
        region,
        selector: CARD_SELECTOR,
        count: 2,
      });
      if (!silo) throw new Error('no Silo card');
      const watch = await readyDevsWatchButton(region, silo);
      const trigger = within(silo).getByRole('button', {
        name: 'Flag show "Silo" as dropped',
      });

      await openMenuFromKeyboard(trigger, 'Right now');
      const menu = screen.getByRole('menu', {
        name: 'When did you drop this?',
      });
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(menu).not.toBeInTheDocument());
      await waitFor(() => expect(trigger).toHaveFocus());
      serveUpNext(() => HttpResponse.json([devsAt(3)]));
      watch.click();

      await waitFor(() => expect(silo.isConnected).toBe(false));
      expect(document.activeElement).toBe(region);
    });
  });
});
