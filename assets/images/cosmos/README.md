# Cosmic journey imagery

Generated 2026-10-13 for the cosmic-journey redesign with `google/gemini-3-pro-image` through the
JWS OpenRouter connection (`jws-or`, One CLI, Create a Chat Completion with image output, 2K).
Nine images were generated for $1.25 in total; the first nebula (a near-copy of Hubble's
"Pillars of Creation", with its missing-data notch) was replaced by an original one.

Every prompt opened with the same lock: black-and-white fine-art photograph, strict monochrome,
pure black background, crisp detail, no lens flare, bloom, vignette, text or watermark.
Prompts, raw responses and source PNGs: `../../../Tasks/2026-10-13-cosmic-journey/` (payloads/, generated/).

Processing (`process-images.cjs` in that folder): forced greyscale, a soft black clip (6–12 levels)
to remove generator haze and seams, black lifted to the #0b0b0b ground, WebP.
`*-map.png` files are small unlifted luminance maps the particle engine samples.

| File | Used on | Subject |
|---|---|---|
| drop.webp, drop-map.png | Home (scroll) | A single water drop holding a starfield |
| splash.webp | Home (scroll), Services band | Crown splash from a mirror-black surface |
| galaxy.webp, galaxy-map.png | Home (scroll) | Grand-design spiral galaxy |
| ripples.webp | Home (no-WebGL fallback), Contact | Ripple rings on still black water |
| nebula.webp | About | Rim-lit dust cloud in a stellar nursery |
| eclipse.webp | Projects | Ringed planet in eclipse |
| blackhole.webp, deepfield.webp | Blog film source | Lensed black hole; ultra-deep field |

These are illustrations, not astronomical data.
