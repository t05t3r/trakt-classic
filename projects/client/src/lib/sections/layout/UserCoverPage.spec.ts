import { MovieMatrixMappedMock } from '$mocks/data/summary/movies/matrix/MovieMatrixMappedMock.ts';
import { ExtendedUserSettingsResponseMock } from '$mocks/data/users/response/ExtendedUserSettingsResponseMock.ts';
import { USER_SETTINGS_URL } from '$mocks/data/users/USER_SETTINGS_URL.ts';
import { server } from '$mocks/server.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { screen } from '@testing-library/svelte';
import { http, HttpResponse } from 'msw';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import UserCoverPage from './UserCoverPage.svelte';

const COVER = MovieMatrixMappedMock.cover.url.full;

const children = createRawSnippet(() => ({
  render: () => '<section>Stats toolbar</section>',
}));

const renderPage = async () => {
  const { container, userLoaded } = renderComponent(UserCoverPage, {
    props: { cover: COVER, selected: 'lists', children },
  });
  await userLoaded;

  return container;
};

describe('component: UserCoverPage', () => {
  it("should title the cover with the signed-in user's name", async () => {
    await renderPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /^Harry Du Bois$/,
    );
  });

  it('should draw the cover image it is given', async () => {
    const container = await renderPage();

    expect(container.querySelector(`img[src="${COVER}"]`)).toHaveAttribute(
      'data-position',
      'cover',
    );
  });

  it('should mark the selected profile tab as the current page', async () => {
    await renderPage();

    expect(
      screen.getByRole('link', { current: 'page' }),
    ).toHaveTextContent('Lists');
  });

  it('should render its children after the cover', async () => {
    await renderPage();

    const cover = screen.getByRole('heading', { level: 1 }).closest('section');
    const toolbar = screen.getByText('Stats toolbar');
    expect(cover?.compareDocumentPosition(toolbar)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("should label the cover private when the user's profile is private", async () => {
    server.use(
      http.get(USER_SETTINGS_URL, () =>
        HttpResponse.json({
          ...ExtendedUserSettingsResponseMock,
          user: { ...ExtendedUserSettingsResponseMock.user, private: true },
        })),
    );
    await renderPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Harry Du Bois Private',
    );
  });
});
