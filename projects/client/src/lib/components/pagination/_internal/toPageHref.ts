import { withSearchParams } from '$lib/utils/url/withSearchParams.ts';

export function toPageHref({ url, page }: { url: URL; page: number }): string {
  const next = withSearchParams({
    url,
    params: { page: page === 1 ? null : String(page) },
  });

  return `${next.pathname}${next.search}`;
}
