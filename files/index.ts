// _widgets/notes/index.ts  -> add to your widget registry
import { NotebookPen } from "lucide-react";
import { NotesWidget } from "./NotesWidget";

export const notesWidget = {
  type: "notes",
  name: "Notes",
  icon: NotebookPen,
  defaultSize: { width: 420, height: 520 },
  minSize: { width: 280, height: 240 },
  initialData: {},          // content lives in the Yjs field "notes-<widgetId>", NOT here
  Component: NotesWidget,   // pass widgetId, scale, isLocked from your widget shell
};
