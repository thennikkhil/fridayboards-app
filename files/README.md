# Notes widget (Tiptap + Liveblocks)

Install:
  pnpm add @tiptap/react @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/suggestion \
           @tiptap/extension-list @tiptap/extensions @tiptap/extension-highlight \
           @liveblocks/react-tiptap @liveblocks/react-ui

Steps
1. Copy this folder to app/(app)/board/[boardId]/_widgets/notes/
2. Register `notesWidget` (index.ts) in your widget registry; add "notes" to the widget picker.
3. In your shell, render <Component widgetId={layerId} scale={camera.scale} isLocked={isLocked} />.
4. Put isTypingTarget() from shortcut-guard.ts at the top of the canvas keydown handler.
5. Make sure your Liveblocks <RoomProvider> wraps the canvas, and the room auth route allows the user.

Check against the versions you install
- Tiptap v3: StarterKit option is `undoRedo: false`. Tiptap v2: `history: false`, and
  TaskList/TaskItem/Placeholder come from their own @tiptap/extension-* packages.
- `useLiveblocksExtension({ field })`: confirm the `field` option in the current
  Liveblocks Tiptap docs. It is what lets several notes widgets share one room.
