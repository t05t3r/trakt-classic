import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type { MediaListSummary } from '$lib/requests/models/MediaListSummary.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { OfficialListsMappedMock } from '$mocks/data/lists/mapped/OfficialListsMappedMock.ts';
import { SiloListsMappedMock } from '$mocks/data/summary/shows/silo/mapped/SiloListsMappedMock.ts';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ListsBlock from './ListsBlock.svelte';

type ListsStatus = SectionStatus<ReadonlyArray<MediaListSummary>>;

const OFFICIAL = assertDefined(OfficialListsMappedMock.at(0));
const PERSONAL = assertDefined(SiloListsMappedMock.at(0));

function renderBlock(status: ListsStatus) {
  return render(ListsBlock, { props: { status } });
}

function renderLists(...lists: ReadonlyArray<MediaListSummary>) {
  return renderBlock({ kind: 'ready', data: lists });
}

describe('component: ListsBlock', () => {
  it('should head the block Lists', () => {
    renderLists(OFFICIAL);

    expect(screen.getByRole('heading', { level: 2 }))
      .toHaveTextContent(/^Lists$/);
  });

  it('should mark the block busy while the lists load', () => {
    renderBlock({ kind: 'loading' });

    expect(screen.getByRole('region', { name: 'Lists' }))
      .toHaveAttribute('aria-busy', 'true');
  });

  it('should say the title is on no lists when there are none', () => {
    renderBlock({ kind: 'empty' });

    expect(screen.getByText('Not on any lists yet.')).toBeInTheDocument();
  });

  it('should retry the lists once they fail', async () => {
    const retry = vi.fn();
    renderBlock({ kind: 'error', retry });

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(retry).toHaveBeenCalledOnce();
  });

  it('should render one row per list, in order', () => {
    renderLists(OFFICIAL, PERSONAL);

    expect(
      screen.getAllByRole('heading', { level: 3 }).map(({ textContent }) =>
        textContent?.trim()
      ),
    ).toEqual([OFFICIAL.name, PERSONAL.name]);
  });

  it('should link an official list to its official page', () => {
    renderLists(OFFICIAL);

    expect(screen.getByRole('link', { name: OFFICIAL.name }))
      .toHaveAttribute('href', `/lists/official/${OFFICIAL.slug}`);
  });

  it("should link a personal list to its owner's list page", () => {
    renderLists(PERSONAL);

    expect(screen.getByRole('link', { name: PERSONAL.name })).toHaveAttribute(
      'href',
      `/users/${PERSONAL.user.slug}/lists/${PERSONAL.slug}`,
    );
  });

  it('should render a personal list plain when its owner has no slug', () => {
    renderLists({ ...PERSONAL, user: { ...PERSONAL.user, slug: null } });

    expect(screen.getByRole('heading', { name: PERSONAL.name }))
      .toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it("should credit a personal list to its owner's display name, in bold", () => {
    renderLists(PERSONAL);

    const owner = screen.getByRole('heading', { name: 'by Harry Du Bois' });

    expect(owner.querySelector('b')).toHaveTextContent(/^Harry Du Bois$/);
  });

  it('should read an official list as Official List, in a pill', () => {
    renderLists(OFFICIAL);

    const owner = screen.getByRole('heading', { name: 'Official List' });

    expect(owner.querySelector('.trakt-pill'))
      .toHaveTextContent(/^Official List$/);
  });

  it("should show the list's item count", () => {
    renderLists({ ...PERSONAL, count: 1190 });

    expect(screen.getByTitle('Items')).toHaveTextContent(/^1,190 Items$/);
  });

  it("should show the list's description", () => {
    renderLists(PERSONAL);

    expect(screen.getByText(PERSONAL.description)).toBeInTheDocument();
  });

  it("should fan the list's first five posters", () => {
    const { container } = renderLists(PERSONAL);

    const fan = [...container.querySelectorAll('.trakt-poster-stack img.image')]
      .map((image) => image.getAttribute('src'));

    expect(fan).toEqual(
      PERSONAL.posters.slice(0, 5).map(({ url }) => url.thumb),
    );
  });

  it("should show the owner's avatar, not as a link", () => {
    const { container } = renderLists(PERSONAL);

    const avatar = container.querySelector(
      `.trakt-lazy-image[data-kind='avatar'] img.image`,
    );

    expect(avatar).toHaveAttribute('src', PERSONAL.user.avatar.url);
    expect(avatar?.closest('a')).toBeNull();
  });

  it("should render the rows as the detail page's variant", () => {
    const { container } = renderLists(OFFICIAL, PERSONAL);

    expect(
      [...container.querySelectorAll('.trakt-list-row')].map((row) =>
        row.getAttribute('data-variant')
      ),
    ).toEqual(['summary', 'summary']);
  });
});
