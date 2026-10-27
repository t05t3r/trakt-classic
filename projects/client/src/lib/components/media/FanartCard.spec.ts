import { cardActions } from '$test/beds/media/cardActions.ts';
import { controlViewport } from '$test/beds/viewport/controlViewport.ts';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import FanartCard from './FanartCard.svelte';
import type { FanartCardMedia, FanartCardProps } from './FanartCardProps.ts';

const viewport = controlViewport();

const EPISODE: FanartCardMedia = {
  type: 'episode',
  show: "Widow's Bay",
  season: 1,
  number: 5,
  title: 'What to Expect on Your Trip',
};

const EPISODE_HREF = '/shows/widow-s-bay/seasons/1/episodes/5';

const image = createRawSnippet(() => ({
  render: () =>
    '<img src="/img/fanart.jpg" alt="&quot;The Batman&quot; fanart">',
}));

const episodeImage = createRawSnippet(() => ({
  render: () =>
    '<img src="/img/screenshot.jpg" alt="Widow&#39;s Bay 1x05 screenshot">',
}));

// A placeholder hidden from assistive technology, as a missing image renders.
const placeholder = createRawSnippet(() => ({
  render: () => '<img src="/img/placeholder.svg" alt="" aria-hidden="true">',
}));

const caption = createRawSnippet(() => ({
  render: () => '<span class="tag">6 Jul 2026 20:04</span>',
}));

const badges = createRawSnippet(() => ({
  render: () => '<div class="corner">6</div>',
}));

function renderCard(props: Partial<FanartCardProps> = {}) {
  const { container } = render(FanartCard, {
    props: {
      media: { type: 'movie', title: 'The Batman', year: 2022 },
      href: '/movies/the-batman-2022',
      image: props.media?.type === 'episode' ? episodeImage : image,
      ...props,
    },
  });

  const root = container.querySelector('.trakt-fanart-card');
  if (!root) throw new Error('FanartCard rendered no root');

  return { root, fanart: root.querySelector('.fanart') };
}

describe('component: FanartCard', () => {
  describe('titles', () => {
    it('should title a movie with its year after the name, linked to the movie', () => {
      renderCard();

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('The Batman 2022');
      expect(title.querySelector('.year')).toHaveTextContent('2022');
      expect(title.querySelector('a')).toHaveAttribute(
        'href',
        '/movies/the-batman-2022',
      );
      expect(screen.queryByRole('heading', { level: 5 })).toBeNull();
    });

    it('should title a movie without a year by its name alone', () => {
      renderCard({ media: { type: 'movie', title: 'The Batman' } });

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent(/^The Batman$/);
      expect(title.querySelector('.year')).toBeNull();
    });

    it("should title an episode with its number in bold, under its show's name", () => {
      renderCard({ media: EPISODE, href: EPISODE_HREF });

      const title = screen.getByRole('heading', {
        level: 3,
        name: '1x05 What to Expect on Your Trip',
      });
      expect(title.querySelector('b')).toHaveTextContent('1x05');
      expect(title.querySelector('a')).toHaveAttribute('href', EPISODE_HREF);
      expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent(
        "Widow's Bay",
      );
    });

    it("should link an episode's show name to the show", () => {
      renderCard({
        media: EPISODE,
        href: EPISODE_HREF,
        showHref: '/shows/widow-s-bay',
      });

      const show = screen.getByRole('heading', { level: 5 });
      expect(show.querySelector('a')).toHaveAttribute(
        'href',
        '/shows/widow-s-bay',
      );
    });

    it("should leave an episode's show name unlinked without a show link", () => {
      renderCard({ media: EPISODE, href: EPISODE_HREF });

      expect(screen.getByRole('heading', { level: 5 }).querySelector('a'))
        .toBeNull();
    });

    it("should omit an episode's show line when asked, keeping the show in the tooltip", () => {
      const { fanart } = renderCard({
        media: EPISODE,
        href: EPISODE_HREF,
        showHref: '/shows/widow-s-bay',
        omitShowLine: true,
      });

      expect(screen.queryByRole('heading', { level: 5 })).toBeNull();
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
        '1x05 What to Expect on Your Trip',
      );
      expect(fanart).toHaveAttribute(
        'title',
        `Widow's Bay\n1x05 "What to Expect on Your Trip"`,
      );
    });
  });

  // Hiding the titles off phones is CSS keyed on this attribute.
  describe('titles option', () => {
    it('should show the titles at every width by default', () => {
      const { root } = renderCard();

      expect(root).toHaveAttribute('data-titles', 'always');
    });

    it('should mark the titles for phones only when asked, still rendering them', () => {
      const { root } = renderCard({
        media: EPISODE,
        href: EPISODE_HREF,
        caption,
        titles: 'phone',
      });

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
        '1x05 What to Expect on Your Trip',
      );
      expect(screen.getByText('6 Jul 2026 20:04')).toBeInTheDocument();
      expect(root).toHaveAttribute('data-titles', 'phone');
    });
  });

  describe('tooltip', () => {
    it.each<[string, FanartCardMedia, string]>([
      [
        'movie',
        { type: 'movie', title: 'The Batman', year: 2022 },
        'The Batman (2022)',
      ],
      [
        'movie without a year',
        { type: 'movie', title: 'The Batman' },
        'The Batman',
      ],
      [
        'episode',
        EPISODE,
        `Widow's Bay\n1x05 "What to Expect on Your Trip"`,
      ],
    ])(
      'should title the art box and its link of a %s card',
      (_, media, tooltip) => {
        const { fanart } = renderCard({ media });

        expect(fanart).toHaveAttribute('title', tooltip);
        expect(fanart?.querySelector('a.fanart-link'))
          .toHaveAttribute('title', tooltip);
      },
    );

    it('should name the art link by its image when the image has a name', () => {
      renderCard();

      expect(screen.getByRole('link', { name: '"The Batman" fanart' }))
        .toHaveClass('fanart-link');
    });

    it('should name the art link by its tooltip when the image has no name', () => {
      renderCard({ image: placeholder });

      expect(screen.getByRole('link', { name: 'The Batman (2022)' }))
        .toHaveClass('fanart-link');
    });
  });

  describe('slots', () => {
    it('should set the image inside the link to the item and the badges on the art before it', () => {
      const { fanart } = renderCard({ badges });

      const link = fanart?.querySelector('a.fanart-link');
      expect(link).toHaveAttribute('href', '/movies/the-batman-2022');
      expect(link?.querySelector('img')).not.toBeNull();
      expect(link?.querySelector('.corner')).toBeNull();
      expect(link?.previousElementSibling).toHaveClass('corner');
    });

    it('should set the caption on the art before the titles, outside both links', () => {
      const { fanart } = renderCard({
        media: EPISODE,
        href: EPISODE_HREF,
        showHref: '/shows/widow-s-bay',
        caption,
      });

      const titles = fanart?.querySelector('.titles');
      const tag = screen.getByText('6 Jul 2026 20:04');
      expect(titles?.firstElementChild).toContainElement(tag);
      expect(tag.closest('a')).toBeNull();
    });

    it('should leave the caption line out without a caption', () => {
      const { fanart } = renderCard();

      expect(fanart?.querySelector('.caption')).toBeNull();
    });

    it('should carry the media type', () => {
      const { root } = renderCard({ media: EPISODE, href: EPISODE_HREF });

      expect(root).toHaveAttribute('data-type', 'episode');
    });
  });

  describe('viewport gate', () => {
    it('should keep the strip and hold the actions back until the card is in view', async () => {
      const { root } = renderCard({ actions: cardActions });

      expect(root.querySelector('.fanart-strip')).not.toBeNull();
      expect(screen.queryByRole('button', { name: 'Mark as watched' }))
        .toBeNull();

      viewport.enter(root);
      await tick();

      expect(screen.getByRole('button', { name: 'Mark as watched' }))
        .toBeVisible();
    });
  });
});
