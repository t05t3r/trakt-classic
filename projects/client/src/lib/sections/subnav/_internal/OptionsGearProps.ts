export type OptionsGearProps = {
  // Found by id, so the focus can return to it after the panel closes.
  id: string;
  open: boolean;
  panelId: string;
  ontoggle: () => void;
};
