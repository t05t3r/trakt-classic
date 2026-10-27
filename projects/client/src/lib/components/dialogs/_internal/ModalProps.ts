import type { Snippet } from 'svelte';

export type ModalProps = {
  title: string;
  // Called on Escape, × or an outside press; the modal stays open until its
  // owner unmounts it, and calls this again on every further press until then.
  onClose: () => void;
  children: Snippet;
  footer?: Snippet;
};
