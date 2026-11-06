export type DateDividerProps = {
  date: Date;
  // Left out, the divider shows no time spent.
  minutes?: number;
  expanded: boolean;
  // The id of the element holding the day's cards.
  controls: string;
  onToggle: () => void;
};
