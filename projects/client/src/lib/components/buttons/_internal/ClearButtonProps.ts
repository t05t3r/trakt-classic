export type ClearButtonProps = {
  // The button's name: its title while hidden, its text when shown.
  label: string;
  isLabelShown?: boolean;
  onclick: () => void;
};
