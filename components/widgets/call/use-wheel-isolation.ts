"use client";

import { useEffect, type RefObject } from "react";

/** Prevents widget scroll gestures from panning or zooming the board canvas. */
export function useWheelIsolation(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const stopPropagation = (event: WheelEvent) => event.stopPropagation();
    element.addEventListener("wheel", stopPropagation, { passive: true });
    return () => element.removeEventListener("wheel", stopPropagation);
  }, [ref]);
}
