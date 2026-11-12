"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

type Point = { x: number; y: number };

/**
 * Makes `ref` a drop target for files.
 * `onFiles` gets the files and the drop point in pixels, relative to the element.
 * Returns true while a file is being dragged over it (use it to show a drop hint).
 */
export function usePdfDrop(
  ref: RefObject<HTMLElement | null>,
  onFiles: (files: File[], point: Point) => void,
) {
  const [isOver, setIsOver] = useState(false);
  const callback = useRef(onFiles);
  callback.current = onFiles;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let depth = 0;
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");

    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth += 1;
      setIsOver(true);
    };
    const onOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setIsOver(false);
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setIsOver(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length === 0) return;
      const rect = el.getBoundingClientRect();
      callback.current(files, { x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    el.addEventListener("dragenter", onEnter);
    el.addEventListener("dragover", onOver);
    el.addEventListener("dragleave", onLeave);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragenter", onEnter);
      el.removeEventListener("dragover", onOver);
      el.removeEventListener("dragleave", onLeave);
      el.removeEventListener("drop", onDrop);
    };
  }, [ref]);

  return isOver;
}
