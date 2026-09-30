# About animation masks

The sequence uses the existing `../websitelogo-blackbg1.svg` for Jan's personal
logo. WithOne is a separate SVG tracing of the supplied concentric oval reference.
Antigravity is the arch silhouette (which appeared twice in the attachments).

Claude, OpenAI (ChatGPT), DeepSeek, Qwen, and Antigravity SVG geometry comes from
[Lobe Icons](https://github.com/lobehub/lobe-icons/tree/master/packages/static-svg/icons),
under the included MIT license. Their silhouettes correspond to the supplied
references. The renderer samples these local masks once and retains the existing
white particle palette; reference backgrounds and brand colors are not rendered.

Each mask produces its own equal-sized target array. No logo shares another
logo's target array. Assets are local, with no runtime CDN or package dependency.
