import { USER_SETTINGS_URL } from '$mocks/data/users/USER_SETTINGS_URL.ts';
import { EarlyRatingsUserSettingsResponseMock } from '$mocks/data/users/response/EarlyRatingsUserSettingsResponseMock.ts';
import { server } from '$mocks/server.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import CardCommunityRatingHost from '$test/beds/media-card/CardCommunityRatingHost.svelte';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { screen } from '@testing-library/svelte';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

const RELEASED = { value: 0.74, earliestReleaseDate: new Date('2020-05-01') };
const UNRELEASED = { value: 0.81, earliestReleaseDate: new Date('2999-05-01') };

function renderRatings() {
  return renderComponent(CardCommunityRatingHost, {
    props: { ratings: [RELEASED, UNRELEASED] },
  });
}

describe('component: CardCommunityRating', () => {
  it("should hide an unreleased title's rating from a user who does not display early ratings", async () => {
    const { container, userLoaded } = renderRatings();

    await userLoaded;

    expect(screen.getByText('74%')).toBeVisible();
    expect(container.querySelectorAll('.trakt-community-rating'))
      .toHaveLength(1);
    expect(screen.queryByText('81%')).not.toBeInTheDocument();
  });

  it("should show an unreleased title's rating to a user who displays early ratings", async () => {
    server.use(
      http.get(
        USER_SETTINGS_URL,
        () => HttpResponse.json(EarlyRatingsUserSettingsResponseMock),
      ),
    );
    renderRatings();

    expect(await screen.findByText('81%')).toBeVisible();
    expect(screen.getByText('74%')).toBeVisible();
  });

  it("should hide an unreleased title's rating while the user loads", async () => {
    const settings = holdRequest({
      method: 'get',
      url: USER_SETTINGS_URL,
      answer: () => HttpResponse.json(EarlyRatingsUserSettingsResponseMock),
    });
    renderRatings();

    await settings.requested;

    expect(screen.getByText('74%')).toBeVisible();
    expect(screen.queryByText('81%')).not.toBeInTheDocument();
  });
});
