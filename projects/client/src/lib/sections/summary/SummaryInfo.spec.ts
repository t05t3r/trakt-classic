import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import type { RatingStoreProps } from '$lib/features/media-actions/stores/useRating.ts';
import { HERETIC } from '$mocks/data/media-actions/HERETIC.ts';
import { MATRIX } from '$mocks/data/media-actions/MATRIX.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { controlResize } from '$test/beds/resize/controlResize.ts';
import { stubScrollIntoView } from '$test/beds/scroll/stubScrollIntoView.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { controlViewport } from '$test/beds/viewport/controlViewport.ts';
import { screen, waitFor } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import type { InfoSection } from './InfoSection.ts';
import type { ExternalLink } from './SummaryInfoProps.ts';
import SummaryInfo from './SummaryInfo.svelte';

const viewport = controlViewport();

const setLayout = fakeLayouts({
  desktop: WELL_KNOWN_MEDIA_QUERY.desktop,
  mobile: WELL_KNOWN_MEDIA_QUERY.mobile,
});

function content(text: string) {
  return createRawSnippet(() => ({ render: () => `<p>${text}</p>` }));
}

const SECTIONS: ReadonlyArray<InfoSection> = [
  { id: 'overview', label: 'Overview', content: content('The overview') },
  {
    id: 'comments',
    label: 'Comments',
    count: 1233,
    content: content('The comments'),
  },
  { id: 'lists', label: 'Lists', content: content('The lists') },
];

const LINKS: ReadonlyArray<ExternalLink> = [
  {
    key: 'imdb',
    label: 'IMDb',
    href: 'https://www.imdb.com/title/tt28015403',
  },
  {
    key: 'tmdb',
    label: 'TMDB',
    href: 'https://www.themoviedb.org/movie/1138194',
  },
];

function infoProps(ratingTarget?: RatingStoreProps) {
  return {
    poster: {
      src: MovieHereticMappedMock.poster.url.thumb,
      title: MovieHereticMappedMock.title,
      ratingTarget,
    },
    links: LINKS,
    sections: SECTIONS,
  };
}

function renderInfo(
  sections: ReadonlyArray<InfoSection> = SECTIONS,
  links: ReadonlyArray<ExternalLink> = LINKS,
) {
  return renderComponent(SummaryInfo, {
    props: { ...infoProps(), links, sections },
  });
}

function entry(name: string | RegExp) {
  return screen.findByRole('link', { name });
}

describe('SummaryInfo', () => {
  it('should render one section per entry, under its anchor id', async () => {
    setLayout('desktop');
    const { container } = renderInfo();

    await screen.findByText('The overview');
    const sections = [...container.querySelectorAll('section[id]')];

    expect(sections.map((section) => section.id)).toEqual([
      'overview',
      'comments',
      'lists',
    ]);
    expect(sections.map((section) => section.textContent)).toEqual([
      'The overview',
      'The comments',
      'The lists',
    ]);
  });

  it('should link each sidebar entry to its section', async () => {
    setLayout('desktop');
    renderInfo();

    expect(await entry('Overview')).toHaveAttribute('href', '#overview');
    expect(await entry('1,233 Comments')).toHaveAttribute('href', '#comments');
  });

  // Safari drops the list role of a list with no markers unless it is explicit.
  it('should keep an explicit list role on the sidebar lists', async () => {
    setLayout('desktop');
    renderInfo();
    await entry('IMDb');

    expect(
      screen.getAllByRole('list').map((list) => list.getAttribute('role')),
    ).toEqual(['list', 'list']);
  });

  it('should leave the count blank while it loads', async () => {
    setLayout('desktop');
    renderInfo();

    expect(await entry('Lists')).toHaveAttribute('href', '#lists');
  });

  it('should open the external links in a new tab', async () => {
    setLayout('desktop');
    renderInfo();

    const imdb = await entry('IMDb');

    expect(imdb).toHaveAttribute('href', LINKS.at(0)?.href);
    expect(imdb).toHaveAttribute('target', '_blank');
  });

  it('should list an official site that shares its address with another chip', async () => {
    setLayout('desktop');
    const imdb = LINKS.at(0)?.href ?? '';
    renderInfo(SECTIONS, [
      { key: 'official', label: 'Official Site', href: imdb },
      ...LINKS,
    ]);

    expect(await entry('Official Site')).toHaveAttribute('href', imdb);
    expect(await entry('IMDb')).toHaveAttribute('href', imdb);
  });

  it('should mark the entry of the section in view', async () => {
    setLayout('desktop');
    const { container } = renderInfo();
    const comments = await entry('1,233 Comments');
    const section = container.querySelector('#comments');
    if (!section) throw new Error('no comments section');

    viewport.enter(section);

    await waitFor(() => expect(comments).toHaveClass('is-active'));
    expect(await entry('Overview')).not.toHaveClass('is-active');
  });

  it('should mark no entry after the sidebar comes back until a section is in view', async () => {
    setLayout('desktop');
    const { container } = renderInfo();
    const before = await entry('1,233 Comments');
    const section = container.querySelector('#comments');
    if (!section) throw new Error('no comments section');
    viewport.enter(section);
    await waitFor(() => expect(before).toHaveClass('is-active'));

    setLayout('mobile');
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'Overview' })).toBeNull()
    );
    setLayout('desktop');
    const comments = await entry('1,233 Comments');

    expect(comments).not.toHaveClass('is-active');
    viewport.enter(section);
    await waitFor(() => expect(comments).toHaveClass('is-active'));
  });

  it("should scroll the URL hash's section into view on render", async () => {
    setLayout('desktop');
    openAt('/movies/heretic-2024#comments');
    const scroll = stubScrollIntoView();
    const { container } = renderInfo();

    await screen.findByText('The comments');

    expect(scroll).toHaveBeenCalledWith({ block: 'start' });
    expect(scroll.mock.contexts.at(0)).toBe(
      container.querySelector('#comments'),
    );
  });

  it("should stop holding the URL hash's section once it unmounts", async () => {
    setLayout('desktop');
    openAt('/movies/heretic-2024#comments');
    const { resize } = controlResize();
    const scroll = stubScrollIntoView();
    const { unmount } = renderInfo();
    await screen.findByText('The comments');

    unmount();
    const before = scroll.mock.calls.length;
    resize(document.body);

    expect(scroll).toHaveBeenCalledTimes(before);
  });

  // The grid's gutter rule takes its direct children only, so the sidebar's class carries it.
  it('should render the sidebar as a grandchild of the grid', async () => {
    setLayout('desktop');
    const { container } = renderInfo();
    await entry('Overview');

    const sidebar = container.querySelector('.info-sidebar');
    const grid = container.querySelector("[data-layout='grid']");

    expect(grid).not.toBeNull();
    expect(sidebar?.parentElement?.parentElement).toBe(grid);
  });

  it("should render the switcher as the info wrapper's first child", async () => {
    setLayout('desktop');
    const switcher = createRawSnippet(() => ({
      render: () => '<nav aria-label="Season">4 3 2 1</nav>',
    }));
    const { container } = renderComponent(SummaryInfo, {
      props: { ...infoProps(), switcher },
    });
    await entry('Overview');

    const wrapper = container.querySelector('#info-wrapper');
    expect(wrapper?.firstElementChild).toBe(
      screen.getByRole('navigation', { name: 'Season' }),
    );
  });

  // The sidebar's poster reaches higher over the hero to clear the switcher.
  it('should mark the info wrapper as holding a switcher when given one', async () => {
    setLayout('desktop');
    const switcher = createRawSnippet(() => ({
      render: () => '<nav aria-label="Season"></nav>',
    }));
    const { container } = renderComponent(SummaryInfo, {
      props: { ...infoProps(), switcher },
    });
    await entry('Overview');

    expect(container.querySelector('#info-wrapper')).toHaveClass(
      'has-switcher',
    );
  });

  it('should not mark the info wrapper without a switcher', async () => {
    setLayout('desktop');
    const { container } = renderInfo();
    await entry('Overview');

    expect(container.querySelector('#info-wrapper')).not.toHaveClass(
      'has-switcher',
    );
  });

  it('should not render the sidebar on phones', async () => {
    setLayout('mobile');
    const { container } = renderInfo();

    await waitFor(() =>
      expect(container.querySelector('#overview')).not.toBeNull()
    );
    await waitNegativeClaim();

    expect(screen.queryByRole('link', { name: 'Overview' })).toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it("should show the viewer's rating in the sidebar poster's corner", async () => {
    setLayout('desktop');
    renderComponent(SummaryInfo, { props: infoProps(HERETIC) });

    expect(await screen.findByRole('img', { name: 'Your rating: 10' }))
      .toBeVisible();
  });

  it("should show the new target's own rating once the target changes", async () => {
    setLayout('desktop');
    const { rerender } = renderComponent(SummaryInfo, {
      props: infoProps(HERETIC),
    });
    await screen.findByRole('img', { name: 'Your rating: 10' });

    await rerender(infoProps(MATRIX));

    await waitFor(() =>
      expect(screen.queryByRole('img', { name: /^Your rating/ })).toBeNull()
    );
  });
});
