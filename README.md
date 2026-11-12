Hey, This is FridayBoards
A multi-collabrative board that is designed for students to study in groups .

I am building it to fill in some gaps and problems that i faced in my normal life.

## Video calls

Video calls use LiveKit. Create a LiveKit Cloud project, then add its WebSocket
URL (for example, `wss://your-project.livekit.cloud`), API key, and API secret
to `.env.local` as `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`.
Keep these values server-side; do not prefix them with `NEXT_PUBLIC_`. Add the
same variables to the deployment environment.

The **Video call** widget is available in the board's widget picker. To test,
join from two signed-in board members, verify that a non-member cannot join,
then leave and rejoin. Calls are limited to 8 participants, and each call room
closes after five minutes with no participants. Camera and microphone remain off
until a person joins. See [the integration notes](./files/INTEGRATION-CALL.md)
for the detailed setup and test checklist.

## Shared notes

Add a **Notes** widget from the board's left toolbar to write together. Each
notes widget has its own Liveblocks-backed document, so its contents sync among
people in the same board room. Its top toolbar provides font family and size,
paragraph and heading styles, text emphasis and color, highlighting, alignment,
lists, and undo/redo. Type `/` in the editor to insert headings, lists, to-do
checkboxes, quotes, code blocks, or a divider.
