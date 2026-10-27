import { join } from 'node:path';
import { compileAsync } from 'sass-embedded';
import { describe, expect, it } from 'vitest';

const RULE = /([^{}]+)\{([^{}]*)\}/g;

const propertiesDeclaredOn = async (selector: string) => {
  const { css } = await compileAsync(join(import.meta.dirname, 'index.scss'), {
    style: 'compressed',
  });

  return [...css.matchAll(RULE)]
    .filter(([, selectors = '']) =>
      selectors.split(',').some((each) => each.trim() === selector)
    )
    .flatMap(([, , body = '']) =>
      body.split(';').map((declaration) =>
        declaration.split(':').at(0)?.trim() ?? ''
      )
    );
};

describe('style: typography', () => {
  it('should leave every font property of a bare span to inheritance', async () => {
    const properties = await propertiesDeclaredOn('span');

    expect(properties).toContain('margin');
    expect(properties.filter((property) => /^font\b/.test(property)))
      .toEqual([]);
  });
});
