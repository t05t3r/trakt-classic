export type SectionErrorProps = {
  retry: () => void;
  // Takes the focus a pressed retry drops when it leaves: an element shown with the error.
  fallback: HTMLElement | Nil;
  describedBy?: string;
};
