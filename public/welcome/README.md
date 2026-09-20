# Welcome animation

Original character and motion generated through the official Dreamina CLI on 2026-09-20.
Image task: a9af37fb-4fa3-4a47-9572-0aeb6ece3925.
Video task: 69a4811e-e1d1-42c9-a3ef-330d2a260ab0.

The video was segmented frame by frame with macOS Vision foreground masks,
then packed as two WebP RGBA sprite sheets. These are actual transparent
assets, not a colour-matched video rectangle. No video decoder or autoplay
permission is needed. The canvas uses the 60 source frames at 12fps inside
an 8.4-second sequence: 1.8-second entrance hops, five-second sign performance,
then two larger celebration jumps. Whole-character choreography is rendered
in canvas in addition to the Dreamina source motion, not newly generated video.
The timeline advances only while visible and caps long frame delays, so a
background tab or load stall cannot skip the performance.

`frames.json` records sprite geometry and tracked sign centres/angles.
Welcome lettering is drawn in the browser, starting upside down and rotating
upright with the sign. `monster-poster.webp` is the transparent fallback.

The home page opens the greeting once per tab session. Enter/Skip/Escape
dismiss it; a home-page footer control replays it. Reduced-motion users see
the final frame. Asset failure leaves the poster, an explicit retry message,
and working entry controls.

Verification: mobile portrait/landscape and desktop, RGBA transparency,
touch reaction, entry, session reload, replay, Escape, reduced motion and
blocked animation assets. Existing project-wide TypeScript errors in old
routes remain; the new component passes targeted lint and the site builds.
