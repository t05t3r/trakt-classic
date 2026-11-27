export type OptionsGearProps = {
  // Found by id, so the focus can return to it after the panel closes.
  id: string;
  open: boolean;
  panelId: string;
  ontoggle: () => void;
  // A control in its panel is off its default, so the gear shows a dot.
  changed?: boolean;
};
