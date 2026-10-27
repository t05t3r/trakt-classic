import { createQueryClient } from '$lib/features/query/createQueryClient.ts';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = () => ({ queryClient: createQueryClient() });
