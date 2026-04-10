
Optimize the graph and connection part:
1. The searched item (only one) should be enlarged and highlighted in the graph, it should be the center of the graph and connected item arranged around it.
2. Set 1 hop as default
3. Put the area tag(e.g algebra, probablity, analysis) as the effect of light color background in node within same area. More specifically: ### Area clusters (“amorphous”)

- Parent nodes use `shape: ellipse` instead of rectangles so each area reads as a soft blob around its concepts.
- Per-area colors from a stable hash of the area name: pastel `hsla` fill + border + label (no single dark block).
- More compound padding so the ellipse wraps content more loosely.
