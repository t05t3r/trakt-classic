import { HERETIC } from '$mocks/data/media-actions/HERETIC.ts';
import { MATRIX } from '$mocks/data/media-actions/MATRIX.ts';
import { SYNC_RATINGS_REMOVE_URL } from '$mocks/data/sync/SYNC_RATINGS_REMOVE_URL.ts';
import { SYNC_RATINGS_URL } from '$mocks/data/sync/SYNC_RATINGS_URL.ts';
import { server } from '$mocks/server.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { emulateFocusVisible } from '$test/beds/focus/emulateFocusVisible.ts';
import RatingPopoverHost from '$test/beds/media-actions/RatingPopoverHost.svelte';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { recordWrites } from '$test/beds/request/recordWrites.ts';
import { screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

const HEART_NAMES = [
  '1 heart, Weak Sauce :(',
  '2 hearts, Terrible',
  '3 hearts, Bad',
  '4 hearts, Poor',
  '5 hearts, Meh',
  '6 hearts, Fair',
  '7 hearts, Good',
  '8 hearts, Great',
  '9 hearts, Superb',
  '10 hearts, Totally Ninja!',
];

const shown = () => JSON.parse(screen.getByTestId('shown').textContent ?? '');
const trigger = () => screen.findByRole('button', { name: 'Rating' });
const heart = (rating: number) =>
  screen.getByRole('button', { name: HEART_NAMES.at(rating - 1) });

const openPicker = async (focused: number) => {
  await userEvent.click(await trigger());
  const dialog = await screen.findByRole('dialog');
  await waitFor(() => expect(heart(focused)).toHaveFocus());
  return dialog;
};

const openFromKeyboard = async (focused: number) => {
  (await trigger()).focus();
  await userEvent.keyboard('{Enter}');
  await waitFor(() => expect(heart(focused)).toHaveFocus());
};

// Holds each rating write until released, keeping its body.
const holdWrites = ({ url, status }: { url: string; status: number }) => {
  const bodies: unknown[] = [];
  const held = holdResponse(() => new HttpResponse(null, { status }));
  server.use(
    http.post(url, async ({ request }) => {
      bodies.push(await request.json());
      return held.answer();
    }),
  );
  return { bodies, requested: held.requested, release: held.release };
};

const closed = async () => {
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(await trigger()).toHaveFocus();
};

beforeEach(() => {
  stubClientRects();
  emulateFocusVisible();
});

describe('component: RatingPopover', () => {
  describe('shown', () => {
    it('should hand the trigger no rating while the title is unrated', async () => {
      renderComponent(RatingPopoverHost, { props: { target: MATRIX } });

      await waitFor(() => expect(shown()).toBeNull());
    });

    it('should hand the trigger the stored rating and its label', async () => {
      renderComponent(RatingPopoverHost, { props: { target: HERETIC } });

      await waitFor(() =>
        expect(shown()).toEqual({
          value: 10,
          label: 'Totally Ninja!',
          kind: 'stored',
        })
      );
    });
  });

  describe('hearts', () => {
    it("should name the dialog with the caller's label", async () => {
      renderComponent(RatingPopoverHost, {
        props: { target: MATRIX, label: 'Rate The Matrix' },
      });

      expect(await openPicker(1)).toHaveAccessibleName('Rate The Matrix');
    });

    it('should name its ten hearts in reading order', async () => {
      renderComponent(RatingPopoverHost, { props: { target: MATRIX } });

      const dialog = await openPicker(1);

      expect(
        within(dialog).getAllByRole('button').map((button) =>
          button.getAttribute('aria-label')
        ),
      ).toEqual(HEART_NAMES);
    });

    it('should press only the current heart and focus it on open', async () => {
      renderComponent(RatingPopoverHost, { props: { target: HERETIC } });
      await waitFor(() => expect(shown()).not.toBeNull());

      const dialog = await openPicker(10);

      expect(
        within(dialog).getAllByRole('button').map((button) =>
          button.getAttribute('aria-pressed')
        ),
      ).toEqual([...Array(9).fill('false'), 'true']);
      expect(heart(10)).toHaveAttribute('tabindex', '0');
      expect(heart(1)).toHaveAttribute('tabindex', '-1');
    });

    it('should focus the first heart on open while unrated', async () => {
      renderComponent(RatingPopoverHost, { props: { target: MATRIX } });

      await openPicker(1);

      expect(heart(1)).toHaveAttribute('tabindex', '0');
      expect(heart(2)).toHaveAttribute('tabindex', '-1');
      expect(heart(1)).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('preview', () => {
    it('should keep the stored rating while a click opens the popover', async () => {
      renderComponent(RatingPopoverHost, { props: { target: HERETIC } });
      await waitFor(() => expect(shown()).not.toBeNull());

      await openPicker(10);

      expect(shown()).toEqual({
        value: 10,
        label: 'Totally Ninja!',
        kind: 'stored',
      });
    });

    it('should preview nothing while a click opens the popover on an unrated title', async () => {
      renderComponent(RatingPopoverHost, { props: { target: MATRIX } });

      await openPicker(1);

      expect(shown()).toBeNull();
    });

    it('should preview the focused heart once a key opens the popover, the current one as its removal', async () => {
      renderComponent(RatingPopoverHost, { props: { target: HERETIC } });
      await waitFor(() => expect(shown()).not.toBeNull());

      await openFromKeyboard(10);

      expect(shown()).toEqual({
        value: 10,
        label: 'Totally Ninja!',
        kind: 'unrate',
      });
    });

    it('should preview a hovered heart over the focused one until the pointer leaves', async () => {
      renderComponent(RatingPopoverHost, { props: { target: MATRIX } });
      await openFromKeyboard(1);

      await userEvent.hover(heart(8));
      const hovered = shown();
      await userEvent.unhover(heart(8));

      expect(hovered).toEqual({
        value: 8,
        label: 'Great',
        kind: 'preview',
      });
      expect(shown()).toEqual({
        value: 1,
        label: 'Weak Sauce :(',
        kind: 'preview',
      });
    });

    it('should paint the previewed heart and every lower one in its rating', async () => {
      renderComponent(RatingPopoverHost, { props: { target: HERETIC } });
      await waitFor(() => expect(shown()).not.toBeNull());
      const dialog = await openPicker(10);
      const ratings = () =>
        within(dialog).getAllByRole('button').map((button) =>
          button.dataset.rating ?? null
        );
      const stored = ratings();

      await userEvent.hover(heart(4));

      expect(stored).toEqual(Array(10).fill('10'));
      expect(ratings()).toEqual([
        ...Array(4).fill('4'),
        ...Array(6).fill(null),
      ]);
    });

    it('should hand back the stored rating once the popover closes', async () => {
      renderComponent(RatingPopoverHost, { props: { target: HERETIC } });
      await waitFor(() => expect(shown()).not.toBeNull());
      await openPicker(10);
      await userEvent.hover(heart(3));

      await userEvent.keyboard('{Escape}');

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(await trigger()).toHaveFocus();
      expect(shown()).toEqual({
        value: 10,
        label: 'Totally Ninja!',
        kind: 'stored',
      });
    });
  });

  describe('keyboard', () => {
    it.each(
      [
        ['ArrowRight', 1, 2],
        ['ArrowLeft', 1, 10],
        ['End', 1, 10],
      ] as const,
    )('should move %s from heart %i to heart %i', async (key, from, to) => {
      renderComponent(RatingPopoverHost, { props: { target: MATRIX } });
      await openFromKeyboard(from);

      await userEvent.keyboard(`{${key}}`);

      expect(heart(to)).toHaveFocus();
      expect(shown()).toMatchObject({
        value: to,
        kind: 'preview',
      });
    });

    it.each(
      [
        ['ArrowRight', 1],
        ['Home', 1],
        ['ArrowLeft', 9],
      ] as const,
    )('should move %s from the current heart to heart %i', async (key, to) => {
      renderComponent(RatingPopoverHost, { props: { target: HERETIC } });
      await waitFor(() => expect(shown()).not.toBeNull());
      await openPicker(10);

      await userEvent.keyboard(`{${key}}`);

      expect(heart(to)).toHaveFocus();
    });

    it.each(['Alt', 'Meta', 'Control'])(
      'should leave an arrow key alone while %s is held',
      async (modifier) => {
        renderComponent(RatingPopoverHost, {
          props: { target: MATRIX },
        });
        await openPicker(1);

        await userEvent.keyboard(`{${modifier}>}{ArrowRight}{/${modifier}}`);

        expect(heart(1)).toHaveFocus();
      },
    );

    it('should rate nothing while the arrows move the focus', async () => {
      const writes = recordWrites();
      renderComponent(RatingPopoverHost, { props: { target: MATRIX } });
      await openPicker(1);

      await userEvent.keyboard('{ArrowRight}{ArrowRight}{End}');
      await waitNegativeClaim();

      expect(heart(10)).toHaveFocus();
      expect(writes).toEqual([]);
    });
  });

  describe('pick', () => {
    it('should close, then rate the clicked heart', async () => {
      const writes = recordWrites();
      const write = holdWrites({ url: SYNC_RATINGS_URL, status: 201 });
      renderComponent(RatingPopoverHost, { props: { target: MATRIX } });
      await openPicker(1);

      await userEvent.click(heart(8));

      await closed();
      await write.requested;
      expect(writes).toEqual(['POST /sync/ratings']);
      expect(write.bodies).toEqual([
        { movies: [{ ids: { trakt: MATRIX.id }, rating: 8 }] },
      ]);
      expect(shown()).toEqual({
        value: 8,
        label: 'Great',
        kind: 'stored',
      });
    });

    it.each([['Enter', '{Enter}'], ['Space', ' ']])(
      'should rate the focused heart on %s',
      async (_name, key) => {
        const write = holdWrites({ url: SYNC_RATINGS_URL, status: 201 });
        renderComponent(RatingPopoverHost, {
          props: { target: MATRIX },
        });
        await openPicker(1);
        await userEvent.keyboard('{ArrowLeft}');

        await userEvent.keyboard(key);

        await closed();
        await write.requested;
        expect(write.bodies).toEqual([
          { movies: [{ ids: { trakt: MATRIX.id }, rating: 10 }] },
        ]);
      },
    );

    it('should close, then remove the rating on the current heart', async () => {
      const writes = recordWrites();
      const write = holdWrites({ url: SYNC_RATINGS_REMOVE_URL, status: 200 });
      renderComponent(RatingPopoverHost, { props: { target: HERETIC } });
      await waitFor(() => expect(shown()).not.toBeNull());
      await openPicker(10);

      await userEvent.keyboard('{Enter}');

      await closed();
      await write.requested;
      expect(writes).toEqual(['POST /sync/ratings/remove']);
      expect(write.bodies).toEqual([
        { movies: [{ ids: { trakt: HERETIC.id } }] },
      ]);
      expect(shown()).toBeNull();
    });

    it('should hand back the stored rating when the write fails', async () => {
      holdWrites({ url: SYNC_RATINGS_URL, status: 500 }).release();
      renderComponent(RatingPopoverHost, { props: { target: HERETIC } });
      await waitFor(() => expect(shown()).not.toBeNull());
      await openPicker(10);

      await userEvent.click(heart(3));

      await closed();
      await waitFor(() =>
        expect(
          within(screen.getByRole('status')).getByText(
            "Couldn't save. Try again.",
          ),
        ).toBeVisible()
      );
      expect(shown()).toEqual({
        value: 10,
        label: 'Totally Ninja!',
        kind: 'stored',
      });
    });
  });
});
