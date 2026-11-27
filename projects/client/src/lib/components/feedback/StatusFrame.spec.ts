import { mountElement } from '$test/beds/dom/mountElement.ts';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import type { SectionStatus } from './SectionStatus.ts';
import StatusFrame from './StatusFrame.svelte';

const empty = createRawSnippet(() => ({
  render: () => '<p>Nothing here.</p>',
}));

const items = createRawSnippet((names: () => ReadonlyArray<string>) => ({
  render: () => `<p>${names().join(', ')}</p>`,
}));

function renderFrame(
  status: SectionStatus<ReadonlyArray<string>>,
  describedBy?: string,
) {
  const { container, rerender } = render(StatusFrame<ReadonlyArray<string>>, {
    props: { status, empty, children: items, describedBy },
  });
  const frame = container.querySelector<HTMLElement>('.trakt-status-frame');

  return { frame, rerender };
}

describe('component: StatusFrame', () => {
  it('should spin, and read busy, while it loads', () => {
    const { frame } = renderFrame({ kind: 'loading' });

    expect(frame).toHaveAttribute('aria-busy', 'true');
    expect(frame?.querySelector('.trakt-pending-spinner')).not.toBeNull();
    expect(frame).toHaveTextContent(/^$/);
  });

  it('should render its empty content when the status holds nothing', () => {
    const { frame } = renderFrame({ kind: 'empty' });

    expect(frame).toHaveAttribute('aria-busy', 'false');
    expect(frame).toHaveTextContent(/^Nothing here\.$/);
  });

  it('should render its content from the data once ready', () => {
    const { frame } = renderFrame({ kind: 'ready', data: ['Silo', 'Devs'] });

    expect(frame).toHaveAttribute('aria-busy', 'false');
    expect(frame).toHaveTextContent(/^Silo, Devs$/);
    expect(frame?.querySelector('.trakt-pending-spinner')).toBeNull();
  });

  it('should offer a retry, described by what it is handed', () => {
    const heading = mountElement('h3');
    heading.id = 'replied-heading';
    heading.textContent = 'Shout by User 1';
    const retry = vi.fn();
    renderFrame({ kind: 'error', retry }, heading.id);

    const button = screen.getByRole('button', { name: 'Retry' });
    expect(button).toHaveAccessibleDescription('Shout by User 1');
  });

  it('should hold the focus in the frame while a pressed retry reloads it', async () => {
    const retry = vi.fn();
    const { frame, rerender } = renderFrame({ kind: 'error', retry });

    screen.getByRole('button', { name: 'Retry' }).focus();
    await userEvent.keyboard('{Enter}');
    await rerender({ status: { kind: 'loading' } });

    expect(retry).toHaveBeenCalledOnce();
    expect(frame).toHaveFocus();
  });
});
