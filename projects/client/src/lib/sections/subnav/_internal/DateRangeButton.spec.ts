import { useHistoryParams } from '$lib/features/history/stores/useHistoryParams.ts';
import { HISTORY_PATH } from '$mocks/data/users/HISTORY_PATH.ts';
import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { glyphClasses } from '$test/beds/menus/glyphClasses.ts';
import { openDialogByClick } from '$test/beds/menus/openDialogByClick.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { valueObservable } from '$test/beds/store/valueObservable.ts';
import { expectOneReplace } from '$test/beds/url/expectOneReplace.ts';
import { followReplaces } from '$test/beds/url/followReplaces.svelte.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import DateRangeButton from './DateRangeButton.svelte';

const TRIGGER_NAME = /^Date Range/;
const trigger = () => screen.getByRole('button', { name: TRIGGER_NAME });
const dialog = () => screen.queryByRole('dialog', { name: 'Date Range' });
const button = (name: string) => screen.getByRole('button', { name });
const startField = () => screen.getByLabelText('Start Date');
const endField = () => screen.getByLabelText('End Date');

async function renderButton(search = '') {
  openAt(`${HISTORY_PATH}${search}`);
  const params = await renderStore(() => useHistoryParams(valueObservable('')));

  render(DateRangeButton, { props: { params } });

  return params;
}

const openPopover = () => openDialogByClick(TRIGGER_NAME, 'Date Range');

async function closePopover() {
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(dialog()).not.toBeInTheDocument());
}

function fixToday(today: Date) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(today);
  onTestFinished(() => {
    vi.useRealTimers();
  });
}

beforeEach(() => {
  stubClientRects();
});

describe('section: DateRangeButton', () => {
  describe('the button', () => {
    it('should show a calendar and a caret on a trigger for a dialog', async () => {
      await renderButton();

      expect(glyphClasses(trigger())).toEqual([
        expect.stringContaining('tabler-icon-calendar'),
        expect.stringContaining('tabler-icon-chevron-down'),
      ]);
      expect(trigger()).toHaveAttribute('data-variant', 'icon');
      expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
      expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('should read as off and carry its label with no range', async () => {
      await renderButton('?genres=drama&page=2');

      expect(trigger()).not.toHaveClass('is-selected');
      expect(trigger()).toHaveAttribute('title', 'Date Range');
      expect(trigger()).toHaveAttribute('aria-label', 'Date Range');
    });

    it.each([
      {
        name: 'both ends',
        search: '?start_at=2026-06-07&end_at=2026-06-30',
        title: '7 Jun 2026 – 30 Jun 2026',
      },
      {
        name: 'a start alone',
        search: '?start_at=2026-06-07',
        title: 'Since 7 Jun 2026',
      },
      {
        name: 'an end alone',
        search: '?end_at=2026-06-30',
        title: 'Until 30 Jun 2026',
      },
      {
        name: 'a days landing',
        search: '?start_at=2026-06-07&days=1',
        title: '7 Jun 2026 – 7 Jun 2026',
      },
    ])(
      'should turn accent and name the range in its tooltip and name for $name',
      async ({ search, title }) => {
        await renderButton(search);

        expect(trigger()).toHaveClass('is-selected');
        expect(trigger()).toHaveAttribute('data-selected-tint', 'accent');
        expect(trigger()).toHaveAttribute('title', title);
        expect(trigger()).toHaveAttribute(
          'aria-label',
          `Date Range: ${title}`,
        );
      },
    );

    it('should read as off for a range the URL cannot hold', async () => {
      await renderButton('?start_at=2026-06-30&end_at=2026-06-07');

      expect(trigger()).not.toHaveClass('is-selected');
      expect(trigger()).toHaveAttribute('title', 'Date Range');
      expect(trigger()).toHaveAttribute('aria-label', 'Date Range');
    });
  });

  describe('the fields', () => {
    it.each([
      {
        search: '?start_at=2026-06-07&end_at=2026-06-30',
        start: '2026-06-07',
        end: '2026-06-30',
      },
      { search: '?start_at=2026-06-07', start: '2026-06-07', end: '' },
      { search: '?end_at=2026-06-30', start: '', end: '2026-06-30' },
      {
        search: '?start_at=2026-06-07&days=3',
        start: '2026-06-07',
        end: '2026-06-09',
      },
      { search: '', start: '', end: '' },
    ])('should show the days of "$search"', async ({ search, start, end }) => {
      await renderButton(search);

      await openPopover();

      expect(startField()).toHaveValue(start);
      expect(endField()).toHaveValue(end);
    });

    it('should show the inclusive end of a days landing before a day with no midnight', async () => {
      setTimeZone('America/Havana');
      await renderButton('?start_at=2026-03-07&days=1');

      await openPopover();

      expect(startField()).toHaveValue('2026-03-07');
      expect(endField()).toHaveValue('2026-03-07');
      expect(trigger()).toHaveAttribute('title', '7 Mar 2026 – 7 Mar 2026');
    });

    it('should show the new days when it opens after the range changed', async () => {
      followReplaces(HISTORY_PATH);
      const params = await renderButton();
      await openPopover();
      await closePopover();

      await params.setRange({ start: '2026-06-07', end: '2026-06-30' });
      await waitFor(() => expect(trigger()).toHaveClass('is-selected'));
      await openPopover();

      expect(startField()).toHaveValue('2026-06-07');
      expect(endField()).toHaveValue('2026-06-30');
    });
  });

  describe('the presets', () => {
    it("should reach back from today's date", async () => {
      fixToday(new Date(2026, 5, 15));
      await renderButton();
      await openPopover();

      await userEvent.click(button('Last 7 days'));

      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      expectOneReplace();
      expect(lastReplace())
        .toBe(`${HISTORY_PATH}?start_at=2026-06-09&end_at=2026-06-15`);
    });

    it('should read today on each open', async () => {
      fixToday(new Date(2026, 5, 15));
      await renderButton();
      await openPopover();
      await closePopover();

      vi.setSystemTime(new Date(2026, 6, 15));
      await openPopover();
      await userEvent.click(button('Last month'));

      await waitFor(() =>
        expect(lastReplace())
          .toBe(`${HISTORY_PATH}?start_at=2026-06-01&end_at=2026-06-30`)
      );
    });

    it('should tick the preset on the range once it lands', async () => {
      fixToday(new Date(2026, 5, 15));
      followReplaces(HISTORY_PATH);
      await renderButton();
      await openPopover();

      await userEvent.click(button('Last 30 days'));
      await waitFor(() => expect(trigger()).toHaveClass('is-selected'));
      await openPopover();

      expect(button('Last 30 days')).toHaveAttribute('aria-pressed', 'true');
      expect(button('Last 7 days')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('the writes', () => {
    it('should write the typed days on Apply, dropping days and the page', async () => {
      await renderButton('?start_at=2026-06-07&days=3&page=4');
      await openPopover();

      await userEvent.click(button('Apply'));

      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      expectOneReplace();
      expect(lastReplace())
        .toBe(`${HISTORY_PATH}?start_at=2026-06-07&end_at=2026-06-09`);
    });

    it('should drop the range on Clear', async () => {
      await renderButton(
        '?genres=drama&start_at=2026-06-07&end_at=2026-06-30&page=4',
      );
      await openPopover();

      await userEvent.click(button('Clear'));

      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      expectOneReplace();
      expect(lastReplace()).toBe(`${HISTORY_PATH}?genres=drama`);
    });

    it.each(['Clear', 'Last 7 days'])(
      'should hand the focus back to the button after %s',
      async (name) => {
        await renderButton();
        await openPopover();

        await userEvent.click(button(name));

        await waitFor(() => expect(dialog()).not.toBeInTheDocument());
        expect(trigger()).toHaveFocus();
      },
    );
  });
});
