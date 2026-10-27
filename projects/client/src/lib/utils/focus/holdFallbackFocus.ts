export function holdFallbackFocus(target: HTMLElement): void {
  if (!target.hasAttribute('tabindex')) addTabindexWhileFocused(target);
  target.focus({ preventScroll: true });
}

// Kept only while focused, so a click on its text cannot move Tab's start.
function addTabindexWhileFocused(target: HTMLElement) {
  const dropOnLeave = () => {
    // A window or tab switch blurs it but leaves it active, to refocus on return.
    if (document.activeElement === target) return;

    target.removeAttribute('tabindex');
    target.removeEventListener('blur', dropOnLeave);
  };

  target.tabIndex = -1;
  target.addEventListener('blur', dropOnLeave);
}
