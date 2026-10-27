import { describe, expect, it } from 'vitest';

import { slideFade } from './slideFade.ts';

describe('transition: slideFade', () => {
  it('should transition the width correctly', () => {
    const node = { style: { opacity: '1' } } as unknown as Element;

    globalThis.getComputedStyle = () => ({
      opacity: '1',
      width: '100',
      height: '50',
    } as CSSStyleDeclaration);

    const transition = slideFade(node, { axis: 'x' });

    expect(transition.css(0)).toContain('transform: translate(100px, 0);');
    expect(transition.css(0)).toContain('opacity: 0;');
    expect(transition.css(0.5)).toContain('transform: translate(0px, 0);');
    expect(transition.css(0.5)).toContain('opacity: 0;');
    expect(transition.css(1)).toContain('transform: translate(0px, 0);');
    expect(transition.css(1)).toContain('opacity: 1;');
  });

  it('should transition the height correctly', () => {
    const node = { style: { opacity: '1' } } as unknown as Element;

    globalThis.getComputedStyle = () => ({
      opacity: '1',
      width: '100',
      height: '50',
    } as CSSStyleDeclaration);

    const transition = slideFade(node, { axis: 'y' });

    expect(transition.css(0)).toContain('transform: translate(0, 50px);');
    expect(transition.css(0)).toContain('opacity: 0;');
    expect(transition.css(0.5)).toContain('transform: translate(0, 0px);');
    expect(transition.css(0.5)).toContain('opacity: 0;');
    expect(transition.css(1)).toContain('transform: translate(0, 0px);');
    expect(transition.css(1)).toContain('opacity: 1;');
  });
});
