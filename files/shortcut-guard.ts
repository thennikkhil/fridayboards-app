// lib/utils/shortcut-guard.ts
// Call at the top of your canvas keydown handler:
//   if (isTypingTarget(e.target)) return;
export function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  return (
    t.isContentEditable ||
    t.tagName === "INPUT" ||
    t.tagName === "TEXTAREA" ||
    t.closest("[data-no-shortcuts]") !== null
  );
}
