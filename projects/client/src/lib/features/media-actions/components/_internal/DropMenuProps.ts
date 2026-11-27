export type DropMenuStatus = {
  // Caught Up rather than Watching, while the show is not dropped.
  isComplete: boolean;
  // Unknown right after a drop made here, until the dropped shows are read again.
  droppedAt?: Date;
};

export type DropMenuProps =
  & {
    // Read once, when the menu is made: a new show needs a new menu.
    show: { id: number; title: string };
  }
  & (
    // A card's title-row icon.
    | { variant?: 'card'; status?: never; describedBy?: never }
    // A progress row's status button, whose menu holds the drop and the undrop.
    | {
      variant: 'status';
      status: DropMenuStatus;
      // The id of the row's title, which tells one row's status from another's.
      describedBy?: string;
    }
  );
