import DateRangePopoverHost from '$test/beds/forms/DateRangePopoverHost.svelte';
import { closeFromOutside } from '$test/beds/menus/closeFromOutside.ts';
import { openDialogByClick } from '$test/beds/menus/openDialogByClick.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DateRangePreset } from './DateRangePopoverProps.ts';

const LAST_SEVEN: DateRangePreset = {
  key: 'last-7',
  label: 'Last 7',
  start: '2026-03-25',
  end: '2026-03-31',
};
// A second preset over the same days, as this month is on a month's seventh.
const THIS_WEEK: DateRangePreset = {
  ...LAST_SEVEN,
  key: 'week',
  label: 'Week',
};
const LAST_MONTH: DateRangePreset = {
  key: 'last-month',
  label: 'Previous',
  start: '2026-02-01',
  end: '2026-02-28',
};
const PRESETS = [LAST_SEVEN, THIS_WEEK, LAST_MONTH];
const OPEN_VALUE = { start: '', end: '' };

const trigger = () => screen.getByRole('button', { name: 'Dates' });
const dialog = () => screen.queryByRole('dialog', { name: 'Date Range' });
const button = (name: string) => screen.getByRole('button', { name });
const startField = () => screen.getByLabelText<HTMLInputElement>('Start Date');
const endField = () => screen.getByLabelText<HTMLInputElement>('End Date');
const type = (field: HTMLInputElement, day: string) =>
  fireEvent.input(field, { target: { value: day } });

const openPopover = async () => {
  await openDialogByClick('Dates', 'Date Range');
  await waitFor(() => expect(button('Last 7')).toHaveFocus());
};

const openFromParent = () => openDialogByClick('Open', 'Date Range');

const expectClosedOnTrigger = async () => {
  await waitFor(() => expect(dialog()).not.toBeInTheDocument());
  expect(trigger()).toHaveFocus();
};

const renderPopover = (value = OPEN_VALUE) => {
  const onApply = vi.fn();
  const onClear = vi.fn();
  const rendered = render(DateRangePopoverHost, {
    props: { presets: PRESETS, value, onApply, onClear },
  });
  const rerenderValue = (next: typeof value) =>
    rendered.rerender({ presets: PRESETS, value: next, onApply, onClear });

  return { onApply, onClear, rerenderValue };
};

beforeEach(() => {
  stubClientRects();
});

describe('component: DateRangePopover', () => {
  it('should open as a flush dialog with its focus on the first row', async () => {
    renderPopover();

    await openPopover();

    expect(dialog()).toHaveAttribute('data-variant', 'flush');
    expect(button('Last 7')).toHaveFocus();
  });

  describe('presets', () => {
    it('should emit only the pair of a pressed row and close', async () => {
      const { onApply, onClear } = renderPopover();
      await openPopover();

      await userEvent.click(button('Previous'));

      await expectClosedOnTrigger();
      expect(onApply.mock.calls).toEqual([[{
        start: '2026-02-01',
        end: '2026-02-28',
      }]]);
      expect(onClear).not.toHaveBeenCalled();
    });

    it('should tick only the first of two presets over the same days', async () => {
      renderPopover({ start: LAST_SEVEN.start, end: LAST_SEVEN.end });
      await openPopover();

      expect(button('Last 7')).toHaveAttribute('aria-pressed', 'true');
      expect(button('Week')).toHaveAttribute('aria-pressed', 'false');
      expect(button('Previous')).toHaveAttribute('aria-pressed', 'false');
    });

    it('should tick nothing when no preset matches both days', async () => {
      renderPopover({ start: LAST_SEVEN.start, end: LAST_MONTH.end });
      await openPopover();

      expect(button('Last 7')).toHaveAttribute('aria-pressed', 'false');
      expect(button('Week')).toHaveAttribute('aria-pressed', 'false');
      expect(button('Previous')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('fields', () => {
    it('should open on the value', async () => {
      renderPopover({ start: '2026-01-05', end: '2026-01-09' });
      await openPopover();

      expect(startField().value).toBe('2026-01-05');
      expect(endField().value).toBe('2026-01-09');
    });

    it('should emit the pair on Apply and close', async () => {
      const { onApply, onClear } = renderPopover();
      await openPopover();

      await type(startField(), '2026-01-05');
      await type(endField(), '2026-01-09');
      await userEvent.click(button('Apply'));

      await expectClosedOnTrigger();
      expect(onApply.mock.calls).toEqual([[{
        start: '2026-01-05',
        end: '2026-01-09',
      }]]);
      expect(onClear).not.toHaveBeenCalled();
    });

    it('should emit an empty string for an empty field', async () => {
      const { onApply } = renderPopover({
        start: '2026-01-05',
        end: '2026-01-09',
      });
      await openPopover();

      await type(endField(), '');
      await userEvent.click(button('Apply'));

      expect(onApply.mock.calls).toEqual([[{
        start: '2026-01-05',
        end: '',
      }]]);
    });

    it('should leave a swapped pair for its caller', async () => {
      const { onApply } = renderPopover();
      await openPopover();

      await type(startField(), '2026-01-09');
      await type(endField(), '2026-01-05');
      await userEvent.click(button('Apply'));

      expect(onApply.mock.calls).toEqual([[{
        start: '2026-01-09',
        end: '2026-01-05',
      }]]);
    });

    it.each(
      [
        { name: 'start', field: startField },
        { name: 'end', field: endField },
      ],
    )('should apply on Enter in the $name field', async ({ field }) => {
      const { onApply } = renderPopover();
      await openPopover();

      await type(startField(), '2026-01-05');
      field().focus();
      await userEvent.keyboard('{Enter}');

      await expectClosedOnTrigger();
      expect(onApply.mock.calls).toEqual([[{
        start: '2026-01-05',
        end: '',
      }]]);
    });

    it('should drop a draft abandoned by a close', async () => {
      renderPopover({ start: '2026-01-05', end: '2026-01-09' });
      await openPopover();
      await type(startField(), '2025-12-25');

      await userEvent.keyboard('{Escape}');
      await expectClosedOnTrigger();
      await openPopover();

      expect(startField().value).toBe('2026-01-05');
      expect(endField().value).toBe('2026-01-09');
    });

    it('should open on a value that changed while it was closed', async () => {
      const { rerenderValue } = renderPopover({
        start: '2026-01-05',
        end: '2026-01-09',
      });
      await openPopover();
      await userEvent.keyboard('{Escape}');
      await expectClosedOnTrigger();

      await rerenderValue({ start: '2026-02-01', end: '' });
      await openPopover();

      expect(startField().value).toBe('2026-02-01');
      expect(endField().value).toBe('');
    });

    it('should apply a value that changed while it was open', async () => {
      const { onApply, rerenderValue } = renderPopover({
        start: '2026-01-05',
        end: '2026-01-09',
      });
      await openPopover();

      await rerenderValue({ start: '2026-02-01', end: '2026-02-28' });

      expect(startField().value).toBe('2026-02-01');
      expect(endField().value).toBe('2026-02-28');

      await userEvent.click(button('Apply'));

      expect(onApply.mock.calls).toEqual([[{
        start: '2026-02-01',
        end: '2026-02-28',
      }]]);
    });

    it('should apply the value when its parent opened it', async () => {
      const { onApply } = renderPopover({
        start: '2026-01-05',
        end: '2026-01-09',
      });

      await openFromParent();

      expect(startField().value).toBe('2026-01-05');
      expect(endField().value).toBe('2026-01-09');

      await userEvent.click(button('Apply'));

      expect(onApply.mock.calls).toEqual([[{
        start: '2026-01-05',
        end: '2026-01-09',
      }]]);
    });

    it('should apply the value when its parent reopens it on an abandoned draft', async () => {
      const { onApply } = renderPopover({
        start: '2026-01-05',
        end: '2026-01-09',
      });
      await openPopover();
      await type(startField(), '2025-12-25');
      await userEvent.keyboard('{Escape}');
      await expectClosedOnTrigger();

      await openFromParent();

      expect(startField().value).toBe('2026-01-05');
      expect(endField().value).toBe('2026-01-09');

      await userEvent.click(button('Apply'));

      expect(onApply.mock.calls).toEqual([[{
        start: '2026-01-05',
        end: '2026-01-09',
      }]]);
    });

    it.each(
      [
        { name: 'start', field: startField },
        { name: 'end', field: endField },
      ],
    )('should cap the $name field at a four-digit year', async ({ field }) => {
      renderPopover();
      await openPopover();

      expect(field()).toHaveAttribute('max', '9999-12-31');
    });
  });

  it('should call onClear on Clear and close', async () => {
    const { onApply, onClear } = renderPopover({
      start: '2026-01-05',
      end: '2026-01-09',
    });
    await openPopover();

    await userEvent.click(button('Clear'));

    await expectClosedOnTrigger();
    expect(onClear).toHaveBeenCalledOnce();
    expect(onApply).not.toHaveBeenCalled();
  });

  it('should close on Escape, focus the trigger and emit nothing', async () => {
    const { onApply, onClear } = renderPopover();
    await openPopover();

    await userEvent.keyboard('{Escape}');

    await expectClosedOnTrigger();
    await waitNegativeClaim();
    expect(onApply).not.toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
  });

  it('should close on a press outside, focus the trigger and emit nothing', async () => {
    const { onApply, onClear } = renderPopover();
    await openPopover();

    await closeFromOutside(dialog);

    expect(trigger()).toHaveFocus();
    await waitNegativeClaim();
    expect(onApply).not.toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
  });
});
