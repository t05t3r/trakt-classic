import { MovieMatrixMappedMock } from '$mocks/data/summary/movies/matrix/MovieMatrixMappedMock.ts';
import { ExtendedUserSettingsMappedMock } from '$mocks/data/users/mapped/ExtendedUserSettingsMappedMock.ts';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import UserCover from './UserCover.svelte';

const COVER = MovieMatrixMappedMock.cover.url.full;
const USER = ExtendedUserSettingsMappedMock;

const tabs = createRawSnippet(() => ({
  render: () => '<nav>Profile tabs</nav>',
}));

const avatarImage = (container: HTMLElement) =>
  container.querySelector(`img[src="${USER.avatar.url}"]`);

describe('component: UserCover', () => {
  it("should title the cover with the user's name, linked to the dashboard", () => {
    render(UserCover, { props: { cover: COVER, user: USER, tabs } });

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(/^Harry Du Bois$/);
    expect(
      screen.getByRole('link', { name: 'Harry Du Bois' }),
    ).toHaveAttribute('href', '/dashboard');
  });

  it('should label a private profile as private', () => {
    render(UserCover, {
      props: { cover: COVER, user: USER, isPrivate: true, tabs },
    });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Harry Du Bois Private',
    );
  });

  it('should leave the private label off a public profile', () => {
    render(UserCover, {
      props: { cover: COVER, user: USER, isPrivate: false, tabs },
    });

    expect(screen.queryByText('Private')).toBeNull();
  });

  it("should show the user's avatar", () => {
    const { container } = render(UserCover, {
      props: { cover: COVER, user: USER, tabs },
    });

    expect(avatarImage(container)).not.toBeNull();
  });

  it('should draw the cover image as a backdrop at the cover position', () => {
    const { container } = render(UserCover, {
      props: { cover: COVER, user: USER, tabs },
    });
    const backdrop = container.querySelector(`img[src="${COVER}"]`);

    expect(backdrop).toHaveAttribute('data-position', 'cover');
  });

  it('should render the tabs it is given', () => {
    render(UserCover, { props: { cover: COVER, user: USER, tabs } });

    expect(screen.getByRole('navigation')).toHaveTextContent('Profile tabs');
  });

  it('should keep the cover and its tabs, with no name or avatar, before the user loads', () => {
    const { container } = render(UserCover, {
      props: { cover: COVER, user: null, tabs },
    });

    expect(screen.queryByRole('heading')).toBeNull();
    expect(avatarImage(container)).toBeNull();
    expect(container.querySelector(`img[src="${COVER}"]`)).not.toBeNull();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should draw no backdrop with no cover image', () => {
    const { container } = render(UserCover, {
      props: { cover: null, user: USER, tabs },
    });

    expect(container.querySelector('img[data-position]')).toBeNull();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
