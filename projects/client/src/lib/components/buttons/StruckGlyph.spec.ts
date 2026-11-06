import { glyphSnippet } from '$test/beds/buttons/glyphSnippet.ts';
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import StruckGlyph from './StruckGlyph.svelte';

function renderGlyph(struck: boolean) {
  const { container } = render(StruckGlyph, {
    props: { struck, children: glyphSnippet },
  });

  return {
    root: container.querySelector('.trakt-struck-glyph'),
    glyph: container.querySelector<SVGElement>('.glyph'),
  };
}

describe('component: StruckGlyph', () => {
  it('should render the glyph it is given', () => {
    const { root, glyph } = renderGlyph(false);

    expect(root).toContainElement(glyph);
  });

  // The strike's opacity is CSS keyed on this class.
  it.each([
    { struck: true, expected: true },
    { struck: false, expected: false },
  ])(
    'should mark the root as struck: $expected while struck is $struck',
    ({ struck, expected }) => {
      const { root } = renderGlyph(struck);

      expect(root?.classList.contains('is-struck')).toBe(expected);
    },
  );
});
