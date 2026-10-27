import { useToasts } from '$lib/features/action-toast/stores/useToasts.ts';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ToastRegion from './ToastRegion.svelte';

const notifyAll = async (...messages: ReadonlyArray<string>) => {
  const { notify } = useToasts();
  messages.forEach(notify);
  await tick();
};

const dismissButtons = () =>
  screen.queryAllByRole('button', { name: 'Dismiss' });

const focusStrip = (index: number) => {
  const button = dismissButtons().at(index);
  button?.focus();
  return button;
};

describe('section: ToastRegion', () => {
  let main: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    main = document.createElement('main');
    document.body.append(main);
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    main.remove();
  });

  it('should render the status region while it holds no toast', () => {
    render(ToastRegion);

    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('should announce only the added strip, not the whole region', () => {
    render(ToastRegion);

    expect(screen.getByRole('status').getAttribute('aria-atomic')).toBe(
      'false',
    );
  });

  it('should render one strip per toast, newest first', async () => {
    render(ToastRegion);

    await notifyAll('first', 'second');

    expect(screen.getByRole('status').textContent).toMatch(/second.*first/s);
    expect(dismissButtons()).toHaveLength(2);
  });

  it('should dismiss the strip whose button is clicked', async () => {
    render(ToastRegion);
    await notifyAll('first', 'second');

    await fireEvent.click(dismissButtons().at(0) ?? document.body);

    expect(screen.getByRole('status').textContent).not.toContain('second');
    expect(dismissButtons()).toHaveLength(1);
  });

  describe('focus after a strip leaves', () => {
    it('should move to the strip now in its position', async () => {
      render(ToastRegion);
      await notifyAll('first', 'second', 'third');
      const second = focusStrip(1);

      await fireEvent.click(second ?? document.body);
      await tick();

      expect(document.activeElement).toBe(dismissButtons().at(1));
      expect(dismissButtons()).toHaveLength(2);
    });

    it('should move to the new last strip when the last one left', async () => {
      render(ToastRegion);
      await notifyAll('first', 'second', 'third');
      const last = focusStrip(2);

      await fireEvent.click(last ?? document.body);
      await tick();

      expect(document.activeElement).toBe(dismissButtons().at(1));
    });

    it('should move when the timer removes the focused strip', async () => {
      render(ToastRegion);
      await notifyAll('first');
      vi.advanceTimersByTime(1000);
      await notifyAll('second');
      focusStrip(1);
      // Focus queues zero-delay timers in Svelte and jsdom; run them so the next is the store's.
      await vi.advanceTimersByTimeAsync(0);

      await vi.advanceTimersToNextTimerAsync();
      await tick();

      expect(screen.getByRole('status')).toHaveTextContent(/^second$/);
      expect(dismissButtons()).toHaveLength(1);
      expect(document.activeElement).toBe(dismissButtons().at(0));
    });

    it('should move when the cap evicts the focused strip', async () => {
      render(ToastRegion);
      await notifyAll('first', 'second', 'third');
      focusStrip(2);

      await notifyAll('fourth');
      await tick();

      expect(screen.getByRole('status').textContent).not.toContain('first');
      expect(document.activeElement).toBe(dismissButtons().at(2));
    });

    it('should move to the main content when the last strip left and no prior element is known', async () => {
      render(ToastRegion);
      await notifyAll('first');
      const only = focusStrip(0);

      await fireEvent.click(only ?? document.body);
      await tick();

      expect(dismissButtons()).toHaveLength(0);
      expect(document.activeElement).toBe(main);
    });

    it('should move to the main content when focus entered from the body', async () => {
      render(ToastRegion);
      await notifyAll('first');
      document.body.tabIndex = -1;

      try {
        document.body.focus();
        await fireEvent.click(focusStrip(0) ?? document.body);
        await tick();

        expect(dismissButtons()).toHaveLength(0);
        expect(document.activeElement).toBe(main);
      } finally {
        document.body.removeAttribute('tabindex');
      }
    });

    it("should drop the main content's tabindex once it loses focus", async () => {
      render(ToastRegion);
      await notifyAll('first');

      await fireEvent.click(focusStrip(0) ?? document.body);
      await tick();
      const focusedMain = document.activeElement === main;
      main.blur();
      await tick();

      expect(focusedMain).toBe(true);
      expect(main.hasAttribute('tabindex')).toBe(false);
    });

    it('should return to the prior element when the last strip is dismissed', async () => {
      render(ToastRegion);
      await notifyAll('first');
      const prior = document.createElement('button');
      document.body.append(prior);

      try {
        prior.focus();
        const only = focusStrip(0);

        await fireEvent.click(only ?? document.body);
        await tick();

        expect(dismissButtons()).toHaveLength(0);
        expect(document.activeElement).toBe(prior);
      } finally {
        prior.remove();
      }
    });

    it('should return to the prior element when the last strip times out', async () => {
      render(ToastRegion);
      await notifyAll('first');
      const prior = document.createElement('button');
      document.body.append(prior);

      try {
        prior.focus();
        focusStrip(0);

        await vi.runAllTimersAsync();
        await tick();

        expect(dismissButtons()).toHaveLength(0);
        expect(document.activeElement).toBe(prior);
      } finally {
        prior.remove();
      }
    });

    it('should return to the prior element after moving through the remaining strips', async () => {
      render(ToastRegion);
      await notifyAll('first', 'second');
      const prior = document.createElement('button');
      document.body.append(prior);

      try {
        prior.focus();
        await fireEvent.click(focusStrip(0) ?? document.body);
        await tick();
        await fireEvent.click(dismissButtons().at(0) ?? document.body);
        await tick();

        expect(dismissButtons()).toHaveLength(0);
        expect(document.activeElement).toBe(prior);
      } finally {
        prior.remove();
      }
    });

    it('should keep the prior element while focus moves between strips', async () => {
      render(ToastRegion);
      await notifyAll('first', 'second');
      const prior = document.createElement('button');
      document.body.append(prior);

      try {
        prior.focus();
        focusStrip(0);
        focusStrip(1);
        await fireEvent.click(dismissButtons().at(0) ?? document.body);
        await tick();
        await fireEvent.click(focusStrip(0) ?? document.body);
        await tick();

        expect(dismissButtons()).toHaveLength(0);
        expect(document.activeElement).toBe(prior);
      } finally {
        prior.remove();
      }
    });

    it('should move to the main content when the prior element left the document', async () => {
      render(ToastRegion);
      await notifyAll('first');
      const prior = document.createElement('button');
      document.body.append(prior);
      prior.focus();
      const only = focusStrip(0);
      prior.remove();

      await fireEvent.click(only ?? document.body);
      await tick();

      expect(dismissButtons()).toHaveLength(0);
      expect(document.activeElement).toBe(main);
    });

    it('should move to the main content when the prior element cannot take focus', async () => {
      render(ToastRegion);
      await notifyAll('first');
      const prior = document.createElement('button');
      document.body.append(prior);

      try {
        prior.focus();
        const only = focusStrip(0);
        prior.disabled = true;

        await fireEvent.click(only ?? document.body);
        await tick();

        expect(dismissButtons()).toHaveLength(0);
        expect(document.activeElement).toBe(main);
      } finally {
        prior.remove();
      }
    });

    it('should return to the prior element without scrolling to it', async () => {
      render(ToastRegion);
      await notifyAll('first');
      const prior = document.createElement('button');
      document.body.append(prior);

      try {
        prior.focus();
        const only = focusStrip(0);
        const focus = vi.spyOn(prior, 'focus');

        await fireEvent.click(only ?? document.body);
        await tick();

        expect(document.activeElement).toBe(prior);
        expect(focus).toHaveBeenCalledWith({ preventScroll: true });
      } finally {
        prior.remove();
      }
    });

    it("should keep focus where the prior element's own focus handler moved it", async () => {
      render(ToastRegion);
      await notifyAll('first');
      const prior = document.createElement('button');
      const moved = document.createElement('button');
      document.body.append(prior, moved);

      try {
        prior.focus();
        const only = focusStrip(0);
        prior.addEventListener('focus', () => moved.focus());

        await fireEvent.click(only ?? document.body);
        await tick();

        expect(dismissButtons()).toHaveLength(0);
        expect(document.activeElement).toBe(moved);
      } finally {
        prior.remove();
        moved.remove();
      }
    });

    it('should move to the main content when focus last entered with no related target', async () => {
      render(ToastRegion);
      await notifyAll('first');
      const prior = document.createElement('button');
      document.body.append(prior);

      try {
        prior.focus();
        focusStrip(0)?.blur();
        const only = focusStrip(0);

        await fireEvent.click(only ?? document.body);
        await tick();

        expect(dismissButtons()).toHaveLength(0);
        expect(document.activeElement).toBe(main);
      } finally {
        prior.remove();
      }
    });

    it('should leave focus on a strip that stays', async () => {
      render(ToastRegion);
      await notifyAll('first', 'second');
      const first = focusStrip(1);

      await fireEvent.click(dismissButtons().at(0) ?? document.body);
      await tick();

      expect(document.activeElement).toBe(first);
    });

    it('should keep focus moved outside the region while the update is pending', async () => {
      render(ToastRegion);
      await notifyAll('first', 'second');
      const second = focusStrip(1);
      const external = document.createElement('button');
      document.body.append(external);

      try {
        const dismissed = fireEvent.click(second ?? document.body);
        external.focus();
        await dismissed;
        await tick();

        expect(dismissButtons()).toHaveLength(1);
        expect(document.activeElement).toBe(external);
      } finally {
        external.remove();
      }
    });
  });

  describe('focus while a focused strip stays', () => {
    it('should keep focus moved outside the region during an update', async () => {
      render(ToastRegion);
      await notifyAll('existing');
      focusStrip(0);
      const external = document.createElement('button');
      document.body.append(external);

      try {
        useToasts().notify('new');
        external.focus();
        await tick();
        await tick();

        expect(document.activeElement).toBe(external);
      } finally {
        external.remove();
      }
    });
  });
});
