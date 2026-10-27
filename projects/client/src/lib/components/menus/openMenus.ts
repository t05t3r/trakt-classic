import { BehaviorSubject, pairwise } from 'rxjs';

export type OpenMenu = {
  trigger: HTMLElement;
  contains: (node: Node | null) => boolean;
  close: () => void;
};

const openMenus = new BehaviorSubject<ReadonlySet<OpenMenu>>(new Set());

export function holdOpenMenu(menu: OpenMenu): () => void {
  openMenus.next(new Set(openMenus.value).add(menu));

  return () => {
    const remaining = new Set(openMenus.value);
    remaining.delete(menu);
    openMenus.next(remaining);
  };
}

export function openMenuIn(region: HTMLElement): OpenMenu | undefined {
  return [...openMenus.value].find((menu) => region.contains(menu.trigger));
}

export function watchMenusIn(
  region: HTMLElement,
  onToggle: (trigger: HTMLElement, open: boolean) => void,
): () => void {
  const isInRegion = (menu: OpenMenu) => region.contains(menu.trigger);
  // A destroyed menu's trigger has left the region by the time it closes.
  const reported = new Set<OpenMenu>();

  const subscription = openMenus.pipe(pairwise()).subscribe(
    ([previous, current]) => {
      previous.forEach((menu) => {
        if (current.has(menu) || !reported.has(menu)) return;
        reported.delete(menu);
        onToggle(menu.trigger, false);
      });
      current.forEach((menu) => {
        if (previous.has(menu) || !isInRegion(menu)) return;
        reported.add(menu);
        onToggle(menu.trigger, true);
      });
    },
  );

  return () => subscription.unsubscribe();
}
