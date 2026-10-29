import { render, screen } from '@testing-library/svelte';
import { mountElement } from '$test/beds/dom/mountElement.ts';
import { userEvent } from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import SpoilerReveal from './SpoilerReveal.svelte';

const TEXT = 'The twist';

const children = createRawSnippet(() => ({
  render: () => `<span>${TEXT}</span>`,
}));

const DISPLAYS: ReadonlyArray<{ display: 'block' | 'inline'; tag: string }> = [
  { display: 'block', tag: 'DIV' },
  { display: 'inline', tag: 'SPAN' },
];

function content() {
  return screen.getByText(TEXT).parentElement;
}

function showSpoiler() {
  return screen.queryByRole('button', { name: 'Show spoiler' });
}

describe('SpoilerReveal', () => {
  it('should blur the content and keep it inert', () => {
    render(SpoilerReveal, { props: { children, display: 'block' } });

    expect(content()).toHaveClass('is-blurred');
    expect(content()).toHaveAttribute('inert');
  });

  it('should offer a collapsed Show spoiler button', () => {
    render(SpoilerReveal, { props: { children, display: 'block' } });

    expect(showSpoiler()).toHaveAttribute('aria-expanded', 'false');
  });

  it('should reveal the content and remove the button once pressed', async () => {
    render(SpoilerReveal, { props: { children, display: 'block' } });

    await userEvent.click(showSpoiler() ?? document.body);

    expect(content()).not.toHaveAttribute('inert');
    expect(content()).not.toHaveClass('is-blurred');
    expect(showSpoiler()).not.toBeInTheDocument();
  });

  it('should move the focus to the content it revealed', async () => {
    render(SpoilerReveal, { props: { children, display: 'block' } });

    await userEvent.click(showSpoiler() ?? document.body);

    expect(content()).toHaveFocus();
  });

  it.each(DISPLAYS)(
    'should hold $display content in a $tag',
    ({ display, tag }) => {
      render(SpoilerReveal, { props: { children, display } });

      expect(content()?.tagName).toBe(tag);
      expect(content()?.parentElement?.tagName).toBe(tag);
    },
  );

  it.each(DISPLAYS)(
    'should size the button to the box of $display content',
    ({ display }) => {
      render(SpoilerReveal, { props: { children, display } });

      expect(content()?.parentElement).toHaveAttribute('data-display', display);
    },
  );

  it('should box the spoiler only while it is concealed', async () => {
    render(SpoilerReveal, { props: { children, display: 'inline' } });
    const wrapper = content()?.parentElement;

    expect(wrapper).toHaveClass('is-concealed');

    await userEvent.click(showSpoiler() ?? document.body);

    expect(wrapper).not.toHaveClass('is-concealed');
  });
  it('should show the content revealed from the start, leaving the focus where it was', () => {
    const elsewhere = mountElement('button');
    elsewhere.focus();

    render(SpoilerReveal, {
      props: { children, display: 'block', revealed: true },
    });

    expect(content()).not.toHaveAttribute('inert');
    expect(content()).not.toHaveClass('is-blurred');
    expect(showSpoiler()).not.toBeInTheDocument();
    expect(elsewhere).toHaveFocus();
  });

  it('should reveal the content once revealed turns true, leaving the focus where it was', async () => {
    const elsewhere = mountElement('button');
    const { rerender } = render(SpoilerReveal, {
      props: { children, display: 'block' },
    });
    elsewhere.focus();

    await rerender({ children, display: 'block', revealed: true });

    expect(content()).not.toHaveClass('is-blurred');
    expect(showSpoiler()).not.toBeInTheDocument();
    expect(elsewhere).toHaveFocus();
  });

  it('should stay revealed once revealed turns back to false', async () => {
    const { rerender } = render(SpoilerReveal, {
      props: { children, display: 'block', revealed: true },
    });

    await rerender({ children, display: 'block', revealed: false });

    expect(content()).not.toHaveAttribute('inert');
    expect(content()).not.toHaveClass('is-blurred');
    expect(showSpoiler()).not.toBeInTheDocument();
  });

  it('should move the focus to the content once revealed turns true while the button holds it', async () => {
    const { rerender } = render(SpoilerReveal, {
      props: { children, display: 'block' },
    });
    showSpoiler()?.focus();

    await rerender({ children, display: 'block', revealed: true });

    expect(showSpoiler()).not.toBeInTheDocument();
    expect(content()).toHaveFocus();
  });
});
