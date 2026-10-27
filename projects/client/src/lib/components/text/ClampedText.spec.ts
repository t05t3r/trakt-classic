import { stubOverflow } from '$test/beds/layout/stubOverflow.ts';
import { controlResize } from '$test/beds/resize/controlResize.ts';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { createRawSnippet, tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import ClampedText from './ClampedText.svelte';

const TEXT = 'Short text';

const children = createRawSnippet(() => ({
  render: () => `<span>${TEXT}</span>`,
}));

function textBox() {
  return screen.getByText(TEXT).parentElement;
}

function shade() {
  return textBox()?.querySelector('.clamped-shade') ?? null;
}

function readMore() {
  return screen.queryByRole('button', { name: 'Read more' });
}

describe('ClampedText', () => {
  it('should render text', () => {
    render(ClampedText, { props: { children } });

    expect(screen.getByText(TEXT)).toBeInTheDocument();
  });

  it('should apply the class list to the box that holds the text', () => {
    render(ClampedText, { props: { children, classList: 'custom-class' } });

    expect(textBox()).toHaveClass('custom-class');
  });

  it('should clamp the text', () => {
    render(ClampedText, { props: { children } });

    expect(textBox()).toHaveClass('is-clamped');
  });

  it('should not offer Read more when the text fits', () => {
    render(ClampedText, { props: { children } });

    expect(readMore()).not.toBeInTheDocument();
  });

  it('should offer a collapsed Read more when the text overflows', () => {
    stubOverflow();
    render(ClampedText, { props: { children } });

    expect(readMore()).toHaveAttribute('aria-expanded', 'false');
  });

  it('should offer Read more and shade the text once a later resize makes it overflow', async () => {
    const { resize } = controlResize();
    render(ClampedText, { props: { children } });
    const box = textBox() ?? document.body;

    expect(readMore()).not.toBeInTheDocument();

    stubOverflow();
    resize(box);
    await tick();

    expect(readMore()).toBeInTheDocument();
    expect(shade()).toBeInTheDocument();
  });

  it('should shade the text only while it is truncated', async () => {
    stubOverflow();
    render(ClampedText, { props: { children } });

    expect(shade()).toBeInTheDocument();

    await userEvent.click(readMore() ?? document.body);

    expect(shade()).not.toBeInTheDocument();
  });

  it('should remove the clamp and Read more once Read more is pressed', async () => {
    stubOverflow();
    render(ClampedText, { props: { children } });

    await userEvent.click(readMore() ?? document.body);

    expect(textBox()).not.toHaveClass('is-clamped');
    expect(readMore()).not.toBeInTheDocument();
  });

  it('should move the focus to the text once Read more is pressed', async () => {
    stubOverflow();
    render(ClampedText, { props: { children } });

    await userEvent.click(readMore() ?? document.body);

    expect(document.activeElement).toBe(textBox());
  });

  it('should not scroll the page to the text it focuses', async () => {
    stubOverflow();
    render(ClampedText, { props: { children } });
    const focus = vi.spyOn(textBox() ?? document.body, 'focus');

    await userEvent.click(readMore() ?? document.body);

    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });
});
