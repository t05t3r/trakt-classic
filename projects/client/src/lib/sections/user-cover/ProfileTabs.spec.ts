import { USER_NAV_LINKS } from '$mocks/data/navigation/USER_NAV_LINKS.ts';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ProfileTabs from './ProfileTabs.svelte';

describe('component: ProfileTabs', () => {
  it("should link the four tabs to the signed-in user's pages", () => {
    render(ProfileTabs, { props: { selected: 'lists' } });

    expect(
      screen.getAllByRole('link').map((link) => [
        link.textContent?.trim(),
        link.getAttribute('href'),
      ]),
    ).toEqual(USER_NAV_LINKS);
  });

  it.each(
    [
      ['history', 'History'],
      ['lists', 'Lists'],
    ] as const,
  )(
    'should mark only the %s tab as the current page',
    (selected, label) => {
      render(ProfileTabs, { props: { selected } });

      expect(
        screen.queryAllByRole('link', { current: 'page' })
          .map((link) => link.textContent?.trim()),
      ).toEqual([label]);
    },
  );

  it('should name its navigation landmark', () => {
    render(ProfileTabs, { props: { selected: 'lists' } });

    expect(screen.getByRole('navigation', { name: 'Profile' }))
      .toBeInTheDocument();
  });
});
