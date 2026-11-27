import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { UpNextResponseMock } from '$mocks/data/sync/response/UpNextResponseMock.ts';
import { UP_NEXT_URL } from '$mocks/data/sync/UP_NEXT_URL.ts';
import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { ShowDevsResponseMock } from '$mocks/data/summary/shows/devs/ShowDevsResponseMock.ts';
import { DROP_URL } from '$mocks/data/users/DROP_URL.ts';
import { DROPPED_URL } from '$mocks/data/users/DROPPED_URL.ts';
import { HIDE_PROGRESS_URL } from '$mocks/data/users/HIDE_PROGRESS_URL.ts';
import { HiddenSeasonsAllSiloResponseMock } from '$mocks/data/users/response/HiddenSeasonsAllSiloResponseMock.ts';
import { HiddenSeasonsResponseMock } from '$mocks/data/users/response/HiddenSeasonsResponseMock.ts';
import { EarlyRatingsUserSettingsResponseMock } from '$mocks/data/users/response/EarlyRatingsUserSettingsResponseMock.ts';
import { USER_SETTINGS_URL } from '$mocks/data/users/USER_SETTINGS_URL.ts';
import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { server } from '$mocks/server.ts';
import { settledButton } from '$test/beds/buttons/settledButton.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { cards } from '$test/beds/dashboard/cards.ts';
import { readyCards } from '$test/beds/dashboard/readyCards.ts';
import { renderSection } from '$test/beds/dashboard/renderSection.ts';
import { serveUpNext } from '$test/beds/dashboard/serveUpNext.ts';
import { ariaLabelsOf } from '$test/beds/dom/ariaLabelsOf.ts';
import { REMOVALS } from '$test/beds/focus/REMOVALS.ts';
import { applyDateField } from '$test/beds/forms/applyDateField.ts';
import { DATE_FIELD_CLOSES } from '$test/beds/forms/DATE_FIELD_CLOSES.ts';
import { fixNow } from '$test/beds/date/fixNow.ts';
import { dateField } from '$test/beds/forms/dateField.ts';
import { dateFieldDialog } from '$test/beds/forms/dateFieldDialog.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { collapsedCells } from '$test/beds/pagination/collapsedCells.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { holdPost } from '$test/beds/request/holdPost.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { recordBodies } from '$test/beds/request/recordBodies.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { watchedProgressRow } from '$test/beds/request/watchedProgressRow.ts';
import { stubScrollIntoView } from '$test/beds/scroll/stubScrollIntoView.ts';
import { cleanup, screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import type { UpNextResponse } from '@trakt/api';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, onTestFinished } from 'vitest';
import UpNextSection from './UpNextSection.svelte';

// The list icon renders only once a layout matches.
const setLayout = fakeLayouts({ desktop: WELL_KNOWN_MEDIA_QUERY.desktop });

const SILO = UpNextResponseMock.at(0);
if (!SILO) throw new Error('UpNextResponseMock has no Silo row');

// Devs with the episodes before `number` watched; the mocks hold no play of it.
function devsAt(number: number): UpNextResponse {
  return watchedProgressRow({
    show: ShowDevsResponseMock,
    lastWatchedAt: null,
    aired: 8,
    completed: number - 1,
    nextEpisode: {
      ...EpisodeSiloResponseMock,
      ids: { ...EpisodeSiloResponseMock.ids, trakt: 7000 + number },
      number,
      title: `Episode ${number}`,
      episode_type: 'standard',
    },
  });
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
  const watch = await settledButton('Mark "Episode 2" as watched', card);

  return { region, card, watch };
}

const DROP_LABEL = 'When did you drop this?';

// Silo's card, its Drop field open, among the entries served.
async function openSiloDropField(entries = [devsAt(2), SILO]) {
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
  await waitFor(() => expect(dateField(DROP_LABEL)).toHaveFocus());
  const dialog = assertDefined(dateFieldDialog(DROP_LABEL));

  return { region, silo, trigger, dialog };
}

async function readyDevsWatchButton(region: HTMLElement, silo: HTMLElement) {
  const devs = cards(region, CARD_SELECTOR).find((card) => card !== silo);
  if (!devs) throw new Error('no Devs card');
  const watch = await settledButton('Mark "Episode 2" as watched', devs);

  return watch;
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

  it('should link the header to the progress page by Watched Date, watched shows hidden', async () => {
    const region = await renderSection(SECTION);

    expect(within(region).getByRole('link', { name: 'Progress' }))
      .toHaveAttribute(
        'href',
        '/users/me/progress/watched/added/asc?hide_completed=true',
      );
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
      const title = assertDefined(
        within(card).getByRole('heading', { level: 3 }).querySelector('a'),
      );
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

    it('should show the show poster, the episode type and the progress bar linking to the show on the progress page', async () => {
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
      expect(card.querySelector('.trakt-art-ribbon'))
        .toHaveTextContent('Series Premiere');
      expect(progress).toHaveAttribute(
        'href',
        '/users/me/progress?show=180770',
      );
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

      expect(ariaLabelsOf(icons)).toEqual([
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
    it('should remove the card before the drop lands, and keep it out after a failed refetch of the dropped list', async () => {
      const drop = holdPost(DROP_URL);
      const { region, silo } = await openSiloDropField();
      const titles = () =>
        cards(region, CARD_SELECTOR).map((card) =>
          card.querySelector('h3')?.textContent
        );

      await applyDateField();

      await waitFor(() => expect(silo.isConnected).toBe(false));
      const whilePosting = titles();
      const refetch = holdRequest({
        method: 'get',
        url: DROPPED_URL,
        answer: notFound,
      });
      drop.release();
      await refetch.requested;
      refetch.release();
      await waitNegativeClaim();

      expect(whilePosting).toEqual(['1x02 Episode 2']);
      expect(titles()).toEqual(['1x02 Episode 2']);
    });

    it('should keep the card out after a failed Up Next refetch, though the dropped list reads', async () => {
      const { region, silo } = await openSiloDropField();
      const titles = () =>
        cards(region, CARD_SELECTOR).map((card) =>
          card.querySelector('h3')?.textContent
        );
      const dropped = holdRequest({ method: 'get', url: DROPPED_URL });
      const upNext = holdRequest({
        method: 'get',
        url: UP_NEXT_URL,
        answer: notFound,
      });

      await applyDateField();
      await waitFor(() => expect(silo.isConnected).toBe(false));
      await Promise.all([dropped.requested, upNext.requested]);
      dropped.release();
      upNext.release();
      await waitNegativeClaim();

      expect(titles()).toEqual(['1x02 Episode 2']);
    });

    it('should post the drop for the show on the card, at the minute applied', async () => {
      fixNow(new Date('2026-03-15T09:41:27.000Z'));
      const bodies = recordBodies(DROP_URL, { status: 201 });
      await openSiloDropField();

      await applyDateField();

      await waitFor(() =>
        expect(bodies).toEqual([{
          shows: [{
            ids: { trakt: SILO.show.ids.trakt },
            hidden_at: '2026-03-15T09:41:00.000Z',
          }],
        }])
      );
    });

    it('should bring the card back and show the error toast when the drop fails', async () => {
      const drop = holdPost(DROP_URL, 500);
      const { region, silo } = await openSiloDropField();

      await applyDateField();
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
      holdPost(DROP_URL);
      const { region } = await openSiloDropField([SILO]);

      await applyDateField();

      expect(
        await within(region).findByText(
          'Nothing up next. Start watching a show and it will appear here.',
        ),
      ).toBeVisible();
      expect(cards(region, CARD_SELECTOR)).toEqual([]);
    });

    it.each(REMOVALS)(
      'should hand the focus to the section when the drop is applied, where removal $removal',
      async ({ emulate }) => {
        holdPost(DROP_URL);
        const { region, silo, dialog } = await openSiloDropField();
        emulate();

        await applyDateField();

        await waitFor(() => expect(silo.isConnected).toBe(false));
        await waitFor(() => expect(dialog).not.toBeInTheDocument());
        await waitFor(() => expect(document.activeElement).toBe(region));
      },
    );

    it.each(DATE_FIELD_CLOSES)(
      'should hand the focus to the section when a card leaves after $name closed its field',
      async ({ close }) => {
        const { region, silo, trigger, dialog } = await openSiloDropField();
        const watch = await readyDevsWatchButton(region, silo);

        await close();
        await waitFor(() => expect(dialog).not.toBeInTheDocument());
        await waitFor(() => expect(trigger).toHaveFocus());
        serveUpNext(() => HttpResponse.json([devsAt(3)]));
        watch.click();

        await waitFor(() => expect(silo.isConnected).toBe(false));
        expect(document.activeElement).toBe(region);
      },
    );
  });

  describe('hidden seasons', () => {
    // Silo with episodes watched, its next episode still 1x01.
    const siloWatched = {
      ...SILO,
      progress: { ...SILO.progress, completed: 3 },
    };

    async function readyRegion(count: number) {
      const region = await renderSection(SECTION);
      await readyCards({ region, selector: CARD_SELECTOR, count });

      return region;
    }

    const showLink = (region: HTMLElement, name: string) =>
      within(region).queryByRole('link', { name });

    it('should leave out a show with nothing watched whose next episode is in a hidden season', async () => {
      servePaged({
        url: HIDE_PROGRESS_URL,
        body: HiddenSeasonsAllSiloResponseMock,
      });
      serveUpNext(() => HttpResponse.json([devsAt(2), SILO]));

      const region = await readyRegion(1);

      expect(showLink(region, 'Devs')).not.toBeNull();
      expect(showLink(region, 'Silo')).toBeNull();
    });

    it('should keep a show with nothing watched whose next episode is in a season not hidden', async () => {
      servePaged({ url: HIDE_PROGRESS_URL, body: HiddenSeasonsResponseMock });
      serveUpNext(() => HttpResponse.json([SILO]));

      expect(showLink(await readyRegion(1), 'Silo')).not.toBeNull();
    });

    it('should keep a show with episodes watched whose next episode is in a hidden season', async () => {
      servePaged({
        url: HIDE_PROGRESS_URL,
        body: HiddenSeasonsAllSiloResponseMock,
      });
      serveUpNext(() => HttpResponse.json([siloWatched]));

      expect(showLink(await readyRegion(1), 'Silo')).not.toBeNull();
    });

    it('should keep every show, with no error box, when the hidden seasons fail', async () => {
      server.use(http.get(HIDE_PROGRESS_URL, notFound));
      serveUpNext(() => HttpResponse.json([devsAt(2), SILO]));

      const region = await readyRegion(2);

      expect(showLink(region, 'Devs')).not.toBeNull();
      expect(showLink(region, 'Silo')).not.toBeNull();
      expect(within(region).queryByRole('button', { name: 'Retry' }))
        .toBeNull();
    });

    it('should show no card until the hidden seasons are known', async () => {
      const hidden = holdResponse(() =>
        pagedResponse({ body: HiddenSeasonsAllSiloResponseMock })
      );
      server.use(http.get(HIDE_PROGRESS_URL, hidden.answer));
      const upNext = holdResponse(() => HttpResponse.json([devsAt(2), SILO]));
      serveUpNext(upNext.answer);
      const region = await renderSection(SECTION);
      await hidden.requested;
      await upNext.requested;
      upNext.release();

      await waitNegativeClaim();
      expect(region).toHaveAttribute('aria-busy', 'true');
      expect(cards(region, CARD_SELECTOR)).toEqual([]);

      hidden.release();
      await readyCards({ region, selector: CARD_SELECTOR, count: 1 });
      expect(showLink(region, 'Silo')).toBeNull();
    });
  });
});
