"""Render a test town map from the grass-path Wang tileset.

Reuses the existing PixelLab tileset (zero new credits spent). Uses
flip-based fallbacks when the tileset lacks a specific corner pattern
(the tileset is tileset15 which is missing a couple of awkward corner
combinations).
"""
from __future__ import annotations

import json
from pathlib import Path
from PIL import Image

HERE = Path(__file__).parent
TILESET_PNG = HERE / "grass-path.png"
TILESET_META = HERE / "grass-path.json"
OUT_NATIVE = HERE / "town-preview.png"
OUT_SCALED = HERE / "town-preview-x8.png"

MAP_W, MAP_H = 20, 15
TILE = 16
SCALE = 8

CORNER_CODE = {"lower": 0, "upper": 1, "transition": 2}


def load_tile_images(meta: dict, src: Image.Image) -> dict[tuple[int, int, int, int], Image.Image]:
    """Binary corner pattern (NW,NE,SW,SE) -> 16x16 tile image.

    Uses flip-based fallbacks for patterns not present in the tileset.
    """
    by_binary: dict[tuple[int, int, int, int], Image.Image] = {}

    # First pass: direct matches for binary patterns (lower=0, upper=1)
    for t in meta["tileset_data"]["tiles"]:
        c = t["corners"]
        if any(v == "transition" for v in c.values()):
            continue
        key = (CORNER_CODE[c["NW"]], CORNER_CODE[c["NE"]], CORNER_CODE[c["SW"]], CORNER_CODE[c["SE"]])
        if key not in by_binary:
            bb = t["bounding_box"]
            by_binary[key] = src.crop((bb["x"], bb["y"], bb["x"] + TILE, bb["y"] + TILE))

    def flip_h(key):
        nw, ne, sw, se = key
        return (ne, nw, se, sw)

    def flip_v(key):
        nw, ne, sw, se = key
        return (sw, se, nw, ne)

    def rot_180(key):
        nw, ne, sw, se = key
        return (se, sw, ne, nw)

    all_keys = [(a, b, c, d) for a in (0, 1) for b in (0, 1) for c in (0, 1) for d in (0, 1)]
    for key in all_keys:
        if key in by_binary:
            continue
        for transform, op in (
            (flip_h, lambda im: im.transpose(Image.FLIP_LEFT_RIGHT)),
            (flip_v, lambda im: im.transpose(Image.FLIP_TOP_BOTTOM)),
            (rot_180, lambda im: im.transpose(Image.ROTATE_180)),
        ):
            sibling = transform(key)
            if sibling in by_binary:
                by_binary[key] = op(by_binary[sibling])
                break

    return by_binary


def build_vertex_grid() -> list[list[int]]:
    """Corners grid. 0 = grass, 1 = path. Shape (MAP_H+1) x (MAP_W+1).

    Simpler layout to exercise the tileset cleanly:
      - Wide horizontal main street (3 tiles high)
      - Wide vertical main street (3 tiles wide)
      - Central plaza at the crossroads
      - Two building pads in each quadrant, kept at least 2 tiles wide/tall
    """
    W, H = MAP_W + 1, MAP_H + 1
    v = [[0] * W for _ in range(H)]

    def paint(x, y, w, h):
        for j in range(y, y + h):
            for i in range(x, x + w):
                if 0 <= j < H and 0 <= i < W:
                    v[j][i] = 1

    paint(0, 7, W, 3)     # horizontal main street (rows 7-9)
    paint(9, 0, 3, H)     # vertical main street (cols 9-11)
    paint(7, 5, 7, 7)     # central plaza

    paint(2, 2, 4, 3)     # top-left house pad
    paint(15, 2, 4, 3)    # top-right house pad
    paint(2, 12, 4, 3)    # bottom-left house pad
    paint(15, 12, 4, 3)   # bottom-right house pad

    return v


def main() -> None:
    meta = json.loads(TILESET_META.read_text(encoding="utf-8"))
    src = Image.open(TILESET_PNG).convert("RGBA")
    tile_imgs = load_tile_images(meta, src)
    fallback = tile_imgs[(0, 0, 0, 0)]

    v = build_vertex_grid()

    out = Image.new("RGBA", (MAP_W * TILE, MAP_H * TILE))
    missing = 0
    for y in range(MAP_H):
        for x in range(MAP_W):
            nw = v[y][x]
            ne = v[y][x + 1]
            sw = v[y + 1][x]
            se = v[y + 1][x + 1]
            key = (nw, ne, sw, se)
            img = tile_imgs.get(key)
            if img is None:
                missing += 1
                img = fallback
            out.paste(img, (x * TILE, y * TILE))

    out.save(OUT_NATIVE)
    scaled = out.resize((out.width * SCALE, out.height * SCALE), Image.NEAREST)
    scaled.save(OUT_SCALED)

    print(f"Rendered: {OUT_NATIVE} ({out.size})")
    print(f"Scaled:   {OUT_SCALED} ({scaled.size})")
    print(f"Binary patterns resolved: {sum(1 for k in tile_imgs)}/16")
    if missing:
        print(f"Missing tile lookups (used fallback): {missing}")


if __name__ == "__main__":
    main()
