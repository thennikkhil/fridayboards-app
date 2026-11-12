/**
 * Anything inside a widget body carries this attribute. The canvas checks it so
 * its pointer and keyboard handlers (tools, Delete, Ctrl+Z, ...) leave widgets alone.
 */
export const CANVAS_IGNORE_ATTR = "data-canvas-ignore";

export function isFromWidgetBody(event: Event): boolean {
  const target = event.target;
  return target instanceof Element && target.closest(`[${CANVAS_IGNORE_ATTR}]`) !== null;
}
