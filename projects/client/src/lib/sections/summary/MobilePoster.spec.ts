import { HERETIC } from '$mocks/data/media-actions/HERETIC.ts';
import { MATRIX } from '$mocks/data/media-actions/MATRIX.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import MobilePoster from './MobilePoster.svelte';

const POSTER = '/img/shows/000/196/791/posters/thumb/0a1b2c3d4e.jpg.webp';

const RATED = { poster: POSTER, title: 'Heretic', ratingTarget: HERETIC };

describe('component: MobilePoster', () => {
  it('should draw the poster named after its title', () => {
    render(MobilePoster, { props: { poster: POSTER, title: 'FROM' } });

    expect(screen.getByRole('img', { name: '"FROM" poster' }))
      .toHaveAttribute('src', POSTER);
  });

  it('should link the poster when given a destination', () => {
    render(MobilePoster, {
      props: { poster: POSTER, title: 'FROM', href: '/shows/from' },
    });

    expect(screen.getByRole('link', { name: '"FROM" poster' }))
      .toHaveAttribute('href', '/shows/from');
  });

  it('should link nowhere without a destination', () => {
    render(MobilePoster, { props: { poster: POSTER, title: 'FROM' } });

    expect(screen.queryByRole('link')).toBeNull();
  });

  describe('the corner rating', () => {
    it("should show the viewer's rating of the target", async () => {
      renderComponent(MobilePoster, { props: RATED });

      expect(await screen.findByRole('img', { name: 'Your rating: 10' }))
        .toBeVisible();
    });

    it("should keep the rating out of the link's name", async () => {
      renderComponent(MobilePoster, {
        props: { ...RATED, href: '/movies/heretic-2024' },
      });
      await screen.findByRole('img', { name: 'Your rating: 10' });

      expect(screen.getByRole('link', { name: '"Heretic" poster' }))
        .toBeVisible();
    });

    it('should show none while the target is unrated', async () => {
      renderComponent(MobilePoster, {
        props: { ...RATED, ratingTarget: MATRIX },
      });
      await screen.findByRole('img', { name: '"Heretic" poster' });
      await waitNegativeClaim();

      expect(screen.queryByRole('img', { name: /^Your rating/ })).toBeNull();
    });

    it("should show the new target's own rating once the target changes", async () => {
      const { rerender } = renderComponent(MobilePoster, { props: RATED });
      await screen.findByRole('img', { name: 'Your rating: 10' });

      await rerender({ ...RATED, ratingTarget: MATRIX });

      await waitFor(() =>
        expect(screen.queryByRole('img', { name: /^Your rating/ })).toBeNull()
      );
    });
  });
});
