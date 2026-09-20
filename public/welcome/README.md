# Welcome animation

Original character and motion generated through the official Dreamina CLI on 2026-09-20.
Image task: a9af37fb-4fa3-4a47-9572-0aeb6ece3925.
Video task: 69a4811e-e1d1-42c9-a3ef-330d2a260ab0.

The video was segmented frame by frame with macOS Vision foreground masks,
then packed as two WebP RGBA sprite sheets. These are actual transparent
assets, not a colour-matched video rectangle. No video decoder or autoplay
permission is needed. The canvas plays 60 frames at 12fps and stops.

`frames.json` records sprite geometry and tracked sign centres/angles.
Welcome lettering is drawn in the browser, starting upside down and rotating
upright with the sign. `monster-poster.webp` is the transparent fallback.

The home page opens the greeting once per tab session. Enter/Skip/Escape
dismiss it; a home-page footer control replays it. Reduced-motion users see
the final frame. Asset failure leaves the poster and working entry controls.

Verification: mobile portrait/landscape and desktop, RGBA transparency,
touch reaction, entry, session reload, replay, Escape, reduced motion and
blocked animation assets. Existing project-wide TypeScript errors in old
routes remain; the new component passes targeted lint and the site builds.
