export type DateTimePopoverProps = {
  label: string;
  anchor: HTMLElement | Nil;
  onApply: (at: Date) => void;
  open?: boolean;
};
