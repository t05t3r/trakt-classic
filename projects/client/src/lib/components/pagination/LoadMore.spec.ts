import { mountElement } from '$test/beds/dom/mountElement.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { stubScrollIntoView } from '$test/beds/scroll/stubScrollIntoView.ts';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoadMore from './LoadMore.svelte';

function renderLoadMore(
  { showLess = true, showMore = true }: {
    showLess?: boolean;
    showMore?: boolean;
  } = {},
) {
  const onless = vi.fn();
  const onmore = vi.fn();
  render(LoadMore, { props: { showLess, showMore, onless, onmore } });

  return { onless, onmore };
}

describe('component: LoadMore', () => {
  // "less" scrolls its controls into view, which jsdom cannot do.
  beforeEach(() => {
    stubScrollIntoView();
  });

  it('should call onless and onmore from their controls', async () => {
    const { onless, onmore } = renderLoadMore();

    await userEvent.click(screen.getByRole('button', { name: 'less' }));
    await userEvent.click(screen.getByRole('button', { name: 'more' }));

    expect(onless).toHaveBeenCalledOnce();
    expect(onmore).toHaveBeenCalledOnce();
  });

  it('should hide less at its limit', () => {
    renderLoadMore({ showLess: false });

    expect(screen.queryByRole('button', { name: 'less' })).not
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'more' })).toBeInTheDocument();
  });

  it('should hide more at its limit', () => {
    renderLoadMore({ showMore: false });

    expect(screen.queryByRole('button', { name: 'more' })).not
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'less' })).toBeInTheDocument();
  });

  it('should render nothing when neither control applies', () => {
    const { container } = render(LoadMore, {
      props: {
        showLess: false,
        showMore: false,
        onless: vi.fn(),
        onmore: vi.fn(),
      },
    });

    expect(container.querySelector('.trakt-load-more')).toBeNull();
  });

  it('should carry the dark variant', () => {
    const { container } = render(LoadMore, {
      props: {
        showLess: true,
        showMore: true,
        onless: vi.fn(),
        onmore: vi.fn(),
        variant: 'dark',
      },
    });

    expect(container.querySelector('.trakt-load-more')).toHaveAttribute(
      'data-variant',
      'dark',
    );
  });

  it.each([
    { focused: 'more', remaining: 'less', limit: { showMore: false } },
    { focused: 'less', remaining: 'more', limit: { showLess: false } },
  ])(
    'should hand the focus from $focused to $remaining as $focused reaches its limit',
    async ({ focused, remaining, limit }) => {
      const props = {
        showLess: true,
        showMore: true,
        onless: vi.fn(),
        onmore: vi.fn(),
      };
      const { rerender } = render(LoadMore, { props });
      screen.getByRole('button', { name: focused }).focus();

      await rerender({ ...props, ...limit });
      await tick();

      expect(screen.getByRole('button', { name: remaining })).toHaveFocus();
    },
  );

  // jsdom does not scroll, so the spy shows the option that keeps the page still.
  it('should hand the focus on without scrolling to the remaining control', async () => {
    const props = {
      showLess: true,
      showMore: true,
      onless: vi.fn(),
      onmore: vi.fn(),
    };
    const { rerender } = render(LoadMore, { props });
    const less = screen.getByRole('button', { name: 'less' });
    const focus = vi.spyOn(less, 'focus');
    screen.getByRole('button', { name: 'more' }).focus();

    await rerender({ ...props, showMore: false });
    await tick();

    expect(less).toHaveFocus();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('should bring its controls into view at once after less', async () => {
    const scroll = stubScrollIntoView();
    renderLoadMore();
    const navigator = screen.getByRole('button', { name: 'less' })
      .parentElement;

    await userEvent.click(screen.getByRole('button', { name: 'less' }));

    expect(scroll.mock.contexts).toEqual([navigator]);
    expect(scroll).toHaveBeenCalledWith({
      block: 'nearest',
      behavior: 'instant',
    });
  });

  it('should leave the scroll where it is after more', async () => {
    const scroll = stubScrollIntoView();
    renderLoadMore();

    await userEvent.click(screen.getByRole('button', { name: 'more' }));
    await waitNegativeClaim();

    expect(scroll).not.toHaveBeenCalled();
  });

  it('should leave the focus where it is when a control it is not on leaves', async () => {
    const props = {
      showLess: true,
      showMore: true,
      onless: vi.fn(),
      onmore: vi.fn(),
    };
    const { rerender } = render(LoadMore, { props });
    screen.getByRole('button', { name: 'less' }).focus();

    await rerender({ ...props, showMore: false });
    await tick();

    expect(screen.getByRole('button', { name: 'less' })).toHaveFocus();
  });

  it('should leave focus moved elsewhere in the same tick as its control leaves', async () => {
    const props = {
      showLess: true,
      showMore: true,
      onless: vi.fn(),
      onmore: vi.fn(),
    };
    const { rerender } = render(LoadMore, { props });
    const elsewhere = mountElement('button');
    screen.getByRole('button', { name: 'more' }).focus();

    elsewhere.focus();
    await rerender({ ...props, showMore: false });

    expect(elsewhere).toHaveFocus();
  });

  it('should give the focus back to a control that stays when an update drops it', async () => {
    const props = {
      showLess: true,
      showMore: true,
      onless: vi.fn(),
      onmore: vi.fn(),
    };
    const { rerender } = render(LoadMore, { props });
    const more = screen.getByRole('button', { name: 'more' });
    more.focus();

    more.blur();
    await rerender({ ...props, showLess: false });

    expect(more).toHaveFocus();
  });

  // jsdom, as Firefox does, fires no focusout as the navigator leaves.
  it('should leave the focus on the page when the navigator comes back after leaving with it', async () => {
    const props = {
      showLess: true,
      showMore: true,
      onless: vi.fn(),
      onmore: vi.fn(),
    };
    const { rerender } = render(LoadMore, { props });
    screen.getByRole('button', { name: 'more' }).focus();

    await rerender({ ...props, showLess: false, showMore: false });
    await tick();
    await userEvent.click(document.body);
    expect(document.body).toHaveFocus();

    await rerender(props);
    await tick();

    expect(document.body).toHaveFocus();
  });
});
