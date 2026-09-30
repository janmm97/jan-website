# Services particle sculpture

The Services hero uses the site's Canvas 2D particle rendering approach. Its figure is a reference-based, articulated point cloud, not a rigged 3D model. No new runtime dependencies or build step are required.

## Sequence

Particles physically assemble over 3.6 seconds. The following 15-second cycle repeats continuously:

| Cycle time | Action |
| --- | --- |
| 0–3.2 s | Right hand types on the laptop |
| 3.2–4.6 s | Head turns toward the visitor; typing stops |
| 4.6–6 s | Right arm rises |
| 6–8.2 s | Right hand waves |
| 8.2–9.8 s | Right hand moves into the downward pointing pose |
| 9.8–12 s | Downward gesture holds with a subtle emphasis |
| 12–15 s | Right arm and head return to typing |

The torso, laptop and left supporting hand share fixed targets across all poses. Each moving region uses spatially matched particle identities, quintic easing and sampled shading. Settled poses are cached on offscreen canvases; formation and pose transitions move individual particles. The source photographs are compressed to WebP and loaded only when the panel enters view.

## Accessibility and lifecycle

- The existing motion button pauses and resumes the timeline.
- Reduced motion shows a fully formed, still waving pose.
- Offscreen panels and hidden tabs suspend animation; resuming does not reset the sequence.
- Canvas resolution is capped at 2× device pixel ratio; smaller panels use fewer particles.
- Asset preparation failure displays a static reference and disables motion controls.
- The canvas has a descriptive accessible label; the surrounding navigation, copy and buttons are unchanged.

## Verification

Reviewed formation, typing, waving, pointing and an intermediate return frame in local Chromium. Browser checks passed for sequence order, pause/resume, offscreen suspension, reduced motion, failed asset loading and horizontal overflow at 390, 768, 900, 1280 and 1852 CSS pixels. Desktop playback samples after pose caching averaged 16.7–19.2 ms between frames; these are local samples, not guarantees for every device or transition.

For deterministic visual inspection, open `/?sculpture-preview#/services` and dispatch a `sculpture:seek` CustomEvent on `#serviceGod`, with an elapsed time in seconds as `detail`. This pauses playback at the requested frame. Useful times: 1.6 (formation), 5 (typing), 7.5 (look up), 10 (wave), 14.2 (point), 17 (return). The seek listener is absent on normal visits.
