import { describe, expect, it } from 'vitest';
import { toWriterValues } from './toWriterValues.ts';

describe('toWriterValues', () => {
  it('should link each writer to their page', () => {
    expect(
      toWriterValues([
        { key: 'graham-yost', name: 'Graham Yost', jobs: ['Writer'] },
      ]),
    ).toEqual([
      { key: 'graham-yost', text: 'Graham Yost', href: '/people/graham-yost' },
    ]);
  });

  it("should add a writer's jobs other than Writer, lowercased and joined", () => {
    expect(
      toWriterValues([
        {
          key: 'ehren-kruger',
          name: 'Ehren Kruger',
          jobs: ['Screenplay', 'Writer', 'Story'],
        },
      ]),
    ).toEqual([{
      key: 'ehren-kruger',
      text: 'Ehren Kruger',
      href: '/people/ehren-kruger',
      alt: '(screenplay, story)',
    }]);
  });

  it('should add a lone job other than Writer', () => {
    expect(
      toWriterValues([
        { key: 'ehren-kruger', name: 'Ehren Kruger', jobs: ['Screenplay'] },
      ]),
    ).toEqual([{
      key: 'ehren-kruger',
      text: 'Ehren Kruger',
      href: '/people/ehren-kruger',
      alt: '(screenplay)',
    }]);
  });

  it('should read nothing without writers', () => {
    expect(toWriterValues([])).toEqual([]);
  });
});
