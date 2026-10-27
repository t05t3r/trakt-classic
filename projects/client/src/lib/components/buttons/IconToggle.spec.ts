import { glyphSnippet } from '$test/beds/buttons/glyphSnippet.ts';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import IconToggle from './IconToggle.svelte';

describe('component: IconToggle', () => {
  it('should be a button named by its label', () => {
    render(IconToggle, {
      props: {
        label: 'Direction',
        pressed: false,
        onToggle: vi.fn(),
        children: glyphSnippet,
      },
    });

    expect(screen.getByRole('button', { name: 'Direction' })).toHaveAttribute(
      'type',
      'button',
    );
  });

  it.each([true, false])(
    'should report a pressed state of %s',
    (pressed) => {
      render(IconToggle, {
        props: {
          label: 'Direction',
          pressed,
          onToggle: vi.fn(),
          children: glyphSnippet,
        },
      });

      expect(screen.getByRole('button', { name: 'Direction' }))
        .toHaveAttribute('aria-pressed', String(pressed));
    },
  );

  it('should call onToggle on a click', async () => {
    const onToggle = vi.fn();
    render(IconToggle, {
      props: {
        label: 'Direction',
        pressed: false,
        onToggle,
        children: glyphSnippet,
      },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Direction' }));

    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('should render the glyph it is given', () => {
    const { container } = render(IconToggle, {
      props: {
        label: 'Direction',
        pressed: false,
        onToggle: vi.fn(),
        children: glyphSnippet,
      },
    });

    expect(container.querySelector('button svg')).not.toBeNull();
  });

  it.each([
    { size: undefined, expected: 'toolbar' },
    { size: 'toolbar' as const, expected: 'toolbar' },
    { size: 'heading' as const, expected: 'heading' },
  ])(
    'should mark the glyph size $expected for a size of $size',
    ({ size, expected }) => {
      render(IconToggle, {
        props: {
          label: 'Direction',
          pressed: false,
          onToggle: vi.fn(),
          size,
          children: glyphSnippet,
        },
      });

      expect(screen.getByRole('button', { name: 'Direction' }))
        .toHaveAttribute('data-size', expected);
    },
  );
});
