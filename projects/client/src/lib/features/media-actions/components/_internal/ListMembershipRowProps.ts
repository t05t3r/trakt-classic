import type { ListMembershipStoreProps } from '$lib/features/media-actions/stores/useListMembership.ts';
import type { ListMenuRowProps } from './ListMenuRowProps.ts';

export type ListMembershipRowProps = ListMembershipStoreProps & {
  variant: ListMenuRowProps['variant'];
};
