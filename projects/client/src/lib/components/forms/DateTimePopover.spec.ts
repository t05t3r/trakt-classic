import { fixNow } from '$test/beds/date/fixNow.ts';
import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { applyDateField } from '$test/beds/forms/applyDateField.ts';
import { DATE_FIELD_CLOSES } from '$test/beds/forms/DATE_FIELD_CLOSES.ts';
import { dateField } from '$test/beds/forms/dateField.ts';
import { dateFieldDialog } from '$test/beds/forms/dateFieldDialog.ts';
import DateTimePopoverHost from '$test/beds/forms/DateTimePopoverHost.svelte';
import { openDialogByClick } from '$test/beds/menus/openDialogByClick.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';

const NOW = new Date('2026-03-15T09:41:27.000Z');
const NOW_MINUTE = '2026-03-15T09:41';

const anchor = () => screen.getByRole('button', { name: 'Anchor' });
const dialog = () => dateFieldDialog('When was it?');
const field = () => dateField('When was it?');
const type = (value: string) => fireEvent.input(field(), { target: { value } });

const openPopover = async () => {
  await openDialogByClick('Open', 'When was it?');
  await waitFor(() => expect(field()).toHaveFocus());
};

const expectClosedOnAnchor = async () => {
  await waitFor(() => expect(dialog()).not.toBeInTheDocument());
  expect(anchor()).toHaveFocus();
};

const renderPopover = () => {
  const onApply = vi.fn();
  render(DateTimePopoverHost, { props: { onApply } });

  return { onApply };
};

const spyOnReportValidity = () => {
  const spy = vi.spyOn(HTMLFormElement.prototype, 'reportValidity');
  onTestFinished(() => spy.mockRestore());

  return spy;
};

beforeEach(() => {
  stubClientRects();
});

describe('component: DateTimePopover', () => {
  it('should open as a flush dialog with its focus on a required date and time field', async () => {
    fixNow(NOW);
    renderPopover();

    await openPopover();

    expect(dialog()).toHaveAttribute('data-variant', 'flush');
    expect(field()).toHaveAttribute('type', 'datetime-local');
    expect(field()).toBeRequired();
    expect(field()).not.toHaveAttribute('step');
  });

  it('should default to the current minute and cap the field there', async () => {
    fixNow(NOW);
    renderPopover();

    await openPopover();

    expect(field().value).toBe(NOW_MINUTE);
    expect(field()).toHaveAttribute('max', NOW_MINUTE);
  });

  it('should floor the field at 1900', async () => {
    renderPopover();

    await openPopover();

    expect(field()).toHaveAttribute('min', '1900-01-01T00:00');
  });

  it('should read the default and the cap again on each open', async () => {
    fixNow(NOW);
    renderPopover();
    await openPopover();
    await userEvent.keyboard('{Escape}');
    await expectClosedOnAnchor();

    vi.setSystemTime(new Date('2026-03-15T10:05:00.000Z'));
    await openPopover();

    expect(field().value).toBe('2026-03-15T10:05');
    expect(field()).toHaveAttribute('max', '2026-03-15T10:05');
  });

  it('should drop a draft abandoned by a close', async () => {
    fixNow(NOW);
    renderPopover();
    await openPopover();
    await type('2026-01-15T12:00');

    await userEvent.keyboard('{Escape}');
    await expectClosedOnAnchor();
    await openPopover();

    expect(field().value).toBe(NOW_MINUTE);
  });

  describe('Apply', () => {
    it('should send the default minute, close and focus the anchor', async () => {
      fixNow(NOW);
      const { onApply } = renderPopover();
      await openPopover();

      await applyDateField();

      await expectClosedOnAnchor();
      expect(onApply.mock.calls).toEqual([[
        new Date('2026-03-15T09:41:00.000Z'),
      ]]);
    });

    it('should send a past date, close and focus the anchor', async () => {
      fixNow(NOW);
      const { onApply } = renderPopover();
      await openPopover();

      await type('2026-01-15T12:00');
      await applyDateField();

      await expectClosedOnAnchor();
      expect(onApply.mock.calls).toEqual([[
        new Date('2026-01-15T12:00:00.000Z'),
      ]]);
    });

    it('should read the field in the local time zone', async () => {
      setTimeZone('Asia/Tokyo');
      fixNow(NOW);
      const { onApply } = renderPopover();
      await openPopover();

      expect(field().value).toBe('2026-03-15T18:41');

      await type('2026-01-15T12:00');
      await applyDateField();

      await expectClosedOnAnchor();
      expect(onApply.mock.calls).toEqual([[
        new Date('2026-01-15T03:00:00.000Z'),
      ]]);
    });

    it('should apply on Enter in the field', async () => {
      fixNow(NOW);
      const { onApply } = renderPopover();
      await openPopover();

      await userEvent.keyboard('{Enter}');

      await expectClosedOnAnchor();
      expect(onApply).toHaveBeenCalledOnce();
    });

    it.each(
      [
        {
          name: 'a later minute',
          value: '2026-03-15T09:42',
          flaw: 'rangeOverflow',
        },
        {
          name: 'a later year',
          value: '2027-01-01T00:00',
          flaw: 'rangeOverflow',
        },
        {
          name: 'a part-typed year',
          value: '0202-03-15T09:41',
          flaw: 'rangeUnderflow',
        },
        {
          name: 'the minute before 1900',
          value: '1899-12-31T23:59',
          flaw: 'rangeUnderflow',
        },
        { name: 'an empty field', value: '', flaw: 'valueMissing' },
      ] as const,
    )('should report $name and stay open', async ({ value, flaw }) => {
      fixNow(NOW);
      const { onApply } = renderPopover();
      await openPopover();
      const reportValidity = spyOnReportValidity();

      await type(value);
      await applyDateField();
      await waitNegativeClaim();

      expect(reportValidity).toHaveBeenCalledOnce();
      expect(field().validity[flaw]).toBe(true);
      expect(onApply).not.toHaveBeenCalled();
      expect(dialog()).toBeInTheDocument();
    });

    it('should send 1900 itself', async () => {
      fixNow(NOW);
      const { onApply } = renderPopover();
      await openPopover();

      await type('1900-01-01T00:00');
      await applyDateField();

      await expectClosedOnAnchor();
      expect(onApply.mock.calls).toEqual([[
        new Date('1900-01-01T00:00:00.000Z'),
      ]]);
    });

    describe('in a field left open past its cap', () => {
      const openThenWait = async () => {
        fixNow(NOW);
        const opened = renderPopover();
        await openPopover();
        vi.setSystemTime(new Date('2026-03-15T10:05:00.000Z'));

        return opened;
      };

      it('should send a time that has since passed', async () => {
        const { onApply } = await openThenWait();

        await type('2026-03-15T10:03');
        await applyDateField();

        await expectClosedOnAnchor();
        expect(onApply.mock.calls).toEqual([[
          new Date('2026-03-15T10:03:00.000Z'),
        ]]);
      });

      it('should report a time still to come and stay open', async () => {
        const { onApply } = await openThenWait();
        const reportValidity = spyOnReportValidity();

        await type('2026-03-15T10:06');
        await applyDateField();
        await waitNegativeClaim();

        expect(reportValidity).toHaveBeenCalledOnce();
        expect(field().validity.rangeOverflow).toBe(true);
        expect(onApply).not.toHaveBeenCalled();
        expect(dialog()).toBeInTheDocument();
      });
    });

    it('should send the current minute itself', async () => {
      fixNow(NOW);
      const { onApply } = renderPopover();
      await openPopover();
      const reportValidity = spyOnReportValidity();

      await fireEvent.submit(field().form ?? field());

      await expectClosedOnAnchor();
      await waitNegativeClaim();
      expect(reportValidity).not.toHaveBeenCalled();
      expect(onApply).toHaveBeenCalledOnce();
    });
  });

  it.each(DATE_FIELD_CLOSES)(
    'should close on $name, focus the anchor and send nothing',
    async ({ close }) => {
      const { onApply } = renderPopover();
      await openPopover();

      await close();

      await expectClosedOnAnchor();
      await waitNegativeClaim();
      expect(onApply).not.toHaveBeenCalled();
    },
  );
});
