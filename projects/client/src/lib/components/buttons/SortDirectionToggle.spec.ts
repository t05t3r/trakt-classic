import { glyphClasses } from '$test/beds/menus/glyphClasses.ts';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SortDirectionToggle from './SortDirectionToggle.svelte';

const toggle = () => screen.getByRole('button', { name: 'Direction' });

describe('component: SortDirectionToggle', () => {
  it.each([
    { pressed: false, glyph: 'arrow-down' },
    { pressed: true, glyph: 'arrow-up' },
  ])(
    'should point its arrow $glyph while pressed is $pressed',
    ({ pressed, glyph }) => {
      render(SortDirectionToggle, { props: { pressed, onToggle: vi.fn() } });

      expect(toggle()).toHaveAttribute('aria-pressed', String(pressed));
      expect(glyphClasses(toggle())).toEqual([
        expect.stringContaining(`tabler-icon-${glyph}`),
      ]);
    },
  );

  it('should hide its arrow from assistive technology', () => {
    render(SortDirectionToggle, {
      props: { pressed: false, onToggle: vi.fn() },
    });

    expect(toggle().querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('should report a press', async () => {
    const onToggle = vi.fn();
    render(SortDirectionToggle, { props: { pressed: false, onToggle } });

    await userEvent.click(toggle());

    expect(onToggle).toHaveBeenCalledOnce();
  });

  it.each(
    [
      { size: undefined, drawn: 'toolbar' },
      { size: 'heading', drawn: 'heading' },
    ] as const,
  )('should draw at the $drawn size', ({ size, drawn }) => {
    render(SortDirectionToggle, {
      props: { pressed: false, onToggle: vi.fn(), size },
    });

    expect(toggle()).toHaveAttribute('data-size', drawn);
  });
});
