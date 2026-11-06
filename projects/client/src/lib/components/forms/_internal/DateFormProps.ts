import type { Snippet } from 'svelte';

export type DateFormProps = {
  children: Snippet;
  dismissLabel: string;
  onDismiss: () => void;
  onSubmit: (form: HTMLFormElement) => void;
  noValidate?: boolean;
};
