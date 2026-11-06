import { glyphClasses } from '$test/beds/menus/glyphClasses.ts';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DateDivider from './DateDivider.svelte';
import type { DateDividerProps } from './DateDividerProps.ts';

const MONDAY = new Date(2026, 6, 6);

function renderDivider(props: Partial<DateDividerProps> = {}) {
  const onToggle = vi.fn();
  const { container } = render(DateDivider, {
    props: {
      date: MONDAY,
      expanded: true,
      controls: 'day-cards',
      onToggle,
      ...props,
    },
  });
  const timeSpent = () => container.querySelector('.time-spent');

  return { container, onToggle, timeSpent };
}

const divider = () => screen.getByRole('button');

describe('component: DateDivider', () => {
  describe('the label', () => {
    it('should be a level 2 heading holding one button', () => {
      renderDivider({ minutes: 148 });

      expect(screen.getByRole('heading', { level: 2 }))
        .toContainElement(divider());
      expect(screen.getAllByRole('button')).toHaveLength(1);
    });

    it('should read the weekday and the full date, the weekday bold', () => {
      const { container } = renderDivider();

      expect(divider()).toHaveTextContent(/^Monday 6 July 2026$/);
      expect(container.querySelector('b')).toHaveTextContent(/^Monday$/);
    });

    it('should lead with a clock hidden from assistive tech', () => {
      const { container } = renderDivider();

      expect(glyphClasses(divider())).toEqual([
        expect.stringContaining('tabler-icon-clock'),
      ]);
      expect(container.querySelector('svg'))
        .toHaveAttribute('aria-hidden', 'true');
    });

    it('should read the date before the time spent', () => {
      renderDivider({ minutes: 148 });

      expect(divider()).toHaveTextContent(/^Monday 6 July 2026\s*2h 28m$/);
    });
  });

  describe('the time spent', () => {
    it('should show no time spent without minutes', () => {
      const { timeSpent } = renderDivider();

      expect(timeSpent()).toBeNull();
    });

    it('should show 0m for minutes of zero', () => {
      const { timeSpent } = renderDivider({ minutes: 0 });

      expect(timeSpent()).toHaveTextContent(/^0m$/);
    });

    it('should toggle the day on a click, keeping the humanized minutes', async () => {
      const { onToggle, timeSpent } = renderDivider({ minutes: 148 });

      await userEvent.click(screen.getByText('2h 28m'));

      expect(onToggle).toHaveBeenCalledOnce();
      expect(timeSpent()).toHaveTextContent(/^2h 28m$/);
    });
  });

  describe('the toggle', () => {
    it('should toggle the day on a click on the date', async () => {
      const { onToggle } = renderDivider();

      await userEvent.click(screen.getByText('Monday'));

      expect(onToggle).toHaveBeenCalledOnce();
    });

    it('should toggle the day from the keyboard, keeping the focus', async () => {
      const { onToggle } = renderDivider();

      divider().focus();
      await userEvent.keyboard('{Enter}');

      expect(onToggle).toHaveBeenCalledOnce();
      expect(divider()).toHaveFocus();
    });

    it.each([true, false])(
      'should report an expanded state of %s',
      (expanded) => {
        renderDivider({ expanded });

        expect(divider()).toHaveAttribute('aria-expanded', String(expanded));
      },
    );

    it('should name the element it controls', () => {
      renderDivider({ controls: 'day-cards' });

      expect(divider()).toHaveAttribute('aria-controls', 'day-cards');
    });
  });
});
