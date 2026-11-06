import type {
  HistoryEntry,
  HistoryRow,
} from '$lib/features/history/stores/useHistoryItems.ts';
import { toHistoryCard } from '$lib/features/history/toHistoryCard.ts';
import { SYNC_HISTORY_REMOVE_URL } from '$mocks/data/sync/SYNC_HISTORY_REMOVE_URL.ts';
import { EPISODE_PLAY } from '$mocks/data/users/EPISODE_PLAY.ts';
import { MOVIE_PLAY } from '$mocks/data/users/MOVIE_PLAY.ts';
import { NO_DATE } from '$mocks/data/users/NO_DATE.ts';
import { SHOW_PLAYS } from '$mocks/data/users/SHOW_PLAYS.ts';
import { settledButton } from '$test/beds/buttons/settledButton.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { answerDialog } from '$test/beds/dialogs/answerDialog.ts';
import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { blankCardLines } from '$test/beds/media-card/blankCardLines.ts';
import { cardLines } from '$test/beds/media-card/cardLines.ts';
import { recordBodies } from '$test/beds/request/recordBodies.ts';
import { screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import HistoryGridCard from './HistoryGridCard.svelte';

const WATCHED = '31 Jan 2025 23:12';

function rowOf(entry: HistoryEntry, isFaded = false): HistoryRow {
  return { entry, card: toHistoryCard(entry), isFaded };
}

async function renderCard(row: HistoryRow, art?: 'fanart') {
  const { container, userLoaded } = renderComponent(HistoryGridCard, {
    props: { row, art },
  });
  await userLoaded;
  emulateHydrated();
  await tick();

  return container;
}

describe('component: HistoryGridCard', () => {
  describe('watched line', () => {
    it.each(
      [
        { type: 'movie', entry: MOVIE_PLAY, title: 'Heretic' },
        { type: 'episode', entry: EPISODE_PLAY, title: '1x01 Freedom Day' },
        { type: 'show', entry: SHOW_PLAYS, title: 'Silo' },
      ] as const,
    )(
      'should set the watched time alone under the title of a $type card',
      async ({ entry, title }) => {
        const container = await renderCard(rowOf(entry));

        expect(screen.getByRole('heading', { level: 3 }))
          .toHaveTextContent(title);
        expect(cardLines(container)).toEqual([WATCHED]);
        expect(blankCardLines(container)).toHaveLength(0);
      },
    );

    it('should not swap the watched time to a relative one', async () => {
      await renderCard(rowOf(MOVIE_PLAY));

      expect(screen.getByText(WATCHED)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: WATCHED }))
        .not.toBeInTheDocument();
    });

    it('should leave the line blank until the page has hydrated', async () => {
      const { container, userLoaded } = renderComponent(HistoryGridCard, {
        props: { row: rowOf(MOVIE_PLAY) },
      });
      await userLoaded;

      expect(cardLines(container)).toEqual([]);
      expect(blankCardLines(container)).toHaveLength(1);
    });
  });

  describe('badges', () => {
    it("should ribbon an episode card with its episode's type", async () => {
      await renderCard(rowOf(EPISODE_PLAY));

      expect(screen.getByText('Series Premiere')).toBeInTheDocument();
    });

    it('should draw no ribbon on a movie card', async () => {
      const container = await renderCard(rowOf(MOVIE_PLAY));

      expect(container.querySelector('.trakt-episode-type-ribbon'))
        .not.toBeInTheDocument();
    });

    it("should set the viewer's rating in the corner", async () => {
      await renderCard(rowOf(MOVIE_PLAY));

      expect(await screen.findByRole('img', { name: 'Your rating: 10' }))
        .toBeInTheDocument();
    });

    it("should badge a show card with its row's dropped date", async () => {
      const container = await renderCard({
        ...rowOf(SHOW_PLAYS),
        droppedAt: new Date(2026, 2, 4, 21, 5),
      });

      expect(container.querySelector('.trakt-poster-card'))
        .toHaveClass('is-dropped');
    });
  });

  describe('watch icon', () => {
    it.each(
      [
        {
          type: 'movie',
          entry: { ...MOVIE_PLAY, movie: { ...MOVIE_PLAY.movie, runtime: 53 } },
          title: 'Heretic',
        },
        {
          type: 'episode',
          entry: {
            ...EPISODE_PLAY,
            episode: { ...EPISODE_PLAY.episode, runtime: 53 },
          },
          title: 'Freedom Day',
        },
      ] as const,
    )(
      "should give a $type card the Play's date and time on a hover",
      async ({ entry, title }) => {
        await renderCard(rowOf(entry));
        const watch = await settledButton(
          `Remove "${title}" from your History`,
        );

        await userEvent.hover(watch);

        await waitFor(() =>
          expect(watch).toHaveAccessibleDescription(
            'Watched on 31 Jan 2025 53m',
          )
        );
      },
    );

    it.each(
      [
        { type: 'movie', entry: MOVIE_PLAY, title: 'Heretic' },
        { type: 'episode', entry: EPISODE_PLAY, title: 'Freedom Day' },
      ] as const,
    )(
      "should ask about the Play on a $type card and post that row's id",
      async ({ entry, title }) => {
        const bodies = recordBodies(SYNC_HISTORY_REMOVE_URL);
        await renderCard(rowOf({ ...entry, id: 4242 }));

        const watch = await settledButton(
          `Remove "${title}" from your History`,
        );
        await userEvent.click(watch);
        const dialog = await screen.findByRole('dialog', {
          name: 'Remove from history?',
        });
        expect(
          within(dialog).getAllByRole('button').map((button) =>
            button.textContent?.trim()
          ),
        ).toEqual(
          expect.arrayContaining(['Only this play', 'All plays', 'No']),
        );
        await answerDialog('Remove from history?', 'Only this play');

        await waitFor(() => expect(bodies).toEqual([{ ids: [4242] }]));
      },
    );

    it('should read a show card selected and ask with the count, with no single-play choice', async () => {
      await renderCard(rowOf(SHOW_PLAYS));

      const watch = await settledButton('Remove "Silo" from your History');
      expect(watch).toHaveClass('is-selected');
      await userEvent.click(watch);

      expect(
        await screen.findByText('Remove the play of "Silo" from your history?'),
      ).toBeVisible();
      expect(screen.queryByRole('button', { name: 'Only this play' }))
        .toBeNull();
    });

    it.each(
      [
        { state: 'undated', fields: NO_DATE },
        { state: 'unaired', fields: { episode: { count: 0 } } },
      ],
    )(
      'should read an $state show card selected, since it has a Play',
      async ({ fields }) => {
        await renderCard(
          rowOf({ ...SHOW_PLAYS, show: { ...SHOW_PLAYS.show, ...fields } }),
        );

        expect(await settledButton('Remove "Silo" from your History'))
          .toHaveClass('is-selected');
      },
    );
  });

  describe('fanart', () => {
    const artKind = (container: HTMLElement) =>
      container.querySelector('.trakt-lazy-image')?.getAttribute('data-kind');

    it("should draw an episode's own screenshot in place of the poster", async () => {
      const container = await renderCard(rowOf(EPISODE_PLAY), 'fanart');

      expect(screen.getByRole('img', { name: 'Silo 1x01 screenshot' }))
        .toHaveAttribute(
          'src',
          '/img/episodes/005/165/667/screenshots/thumb/e035db5f06.jpg.webp',
        );
      expect(artKind(container)).toBe('fanart');
    });

    it('should set the title, then the show linked, then the watched time', async () => {
      const container = await renderCard(rowOf(EPISODE_PLAY), 'fanart');

      expect(screen.getByRole('heading', { level: 3 }))
        .toHaveTextContent('1x01 Freedom Day');
      expect(cardLines(container)).toEqual(['Silo', WATCHED]);
      expect(screen.getByRole('link', { name: 'Silo' }))
        .toHaveAttribute('href', '/shows/silo');
      expect(blankCardLines(container)).toHaveLength(0);
    });

    it('should hold the watched line blank under the show until the page has hydrated', async () => {
      const { container, userLoaded } = renderComponent(HistoryGridCard, {
        props: { row: rowOf(EPISODE_PLAY), art: 'fanart' },
      });
      await userLoaded;

      expect(cardLines(container)).toEqual(['Silo']);
      expect(blankCardLines(container)).toHaveLength(1);
    });

    it('should keep the watch icon on the Play and the rating control', async () => {
      const bodies = recordBodies(SYNC_HISTORY_REMOVE_URL);
      const container = await renderCard(
        rowOf({ ...EPISODE_PLAY, id: 4242 }),
        'fanart',
      );

      expect(
        await within(container).findByRole('button', { name: /^\d+%/ }),
      ).toBeVisible();

      await userEvent.click(
        await settledButton('Remove "Freedom Day" from your History'),
      );
      await answerDialog('Remove from history?', 'Only this play');

      await waitFor(() => expect(bodies).toEqual([{ ids: [4242] }]));
    });

    it.each(
      [
        { type: 'movie', entry: MOVIE_PLAY },
        { type: 'show', entry: SHOW_PLAYS },
      ] as const,
    )('should keep the poster of a $type row', async ({ entry }) => {
      const container = await renderCard(rowOf(entry), 'fanart');

      expect(artKind(container)).toBe('poster');
      expect(cardLines(container)).toEqual([WATCHED]);
    });

    it('should keep the poster and leave the show out without the art', async () => {
      const container = await renderCard(rowOf(EPISODE_PLAY));

      expect(artKind(container)).toBe('poster');
      expect(cardLines(container)).toEqual([WATCHED]);
    });
  });

  describe('fade', () => {
    it('should fade the card of a faded row', async () => {
      const container = await renderCard(rowOf(MOVIE_PLAY, true));

      expect(container.querySelector('.trakt-user-grid-card'))
        .toHaveClass('is-faded');
    });
  });
});
