export function movieListItem(id: number) {
  return { type: 'movie', movie: { ids: { trakt: id } } };
}
