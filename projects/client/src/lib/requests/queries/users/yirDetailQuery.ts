import { defineQuery } from '$lib/features/query/defineQuery.ts';
import type { ApiParams } from '$lib/requests/api.ts';
import { time } from '$lib/utils/timing/time.ts';
import { fetchReviewResource } from '$lib/requests/_internal/fetchReviewResource.ts';
import { mapToYirDetail } from '$lib/requests/_internal/mapToYirDetail.ts';
import { YirDetailSchema } from '$lib/requests/models/YirDetail.ts';
import type { YirYear } from '$lib/requests/models/YirYear.ts';

type YirDetailParams = {
  slug: string;
  year: YirYear;
  slurm?: string;
} & ApiParams;

const yirDetailRequest = async (
  { fetch, slug, year, slurm }: YirDetailParams,
) => {
  const response = await fetchReviewResource({
    fetch,
    path: `/users/${slug}/yir/${year}`,
    slurm,
  });

  return response.ok
    ? { body: await response.json(), status: 200 }
    : { body: null, status: response.status };
};

export const yirDetailQuery = defineQuery({
  key: 'yirDetail',
  invalidations: [],
  dependencies: (params) => [params.slug, params.year, params.slurm],
  request: yirDetailRequest,
  mapper: (response) => response.body ? mapToYirDetail(response.body) : null,
  schema: YirDetailSchema.nullable(),
  ttl: time.hours(1),
});
