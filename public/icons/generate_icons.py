#!/usr/bin/env python3
"""Generate the PWA icons (bell on a dark rounded tile) with Pillow.

Run:  python3 generate_icons.py
"""
from PIL import Image, ImageDraw

BG_TOP = (79, 140, 255)     # accent blue
BG_BOT = (47, 107, 255)
DARK = (11, 16, 32)


def rounded_tile(size, radius_frac=0.22):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # vertical gradient background
    for y in range(size):
        t = y / size
        r = int(BG_TOP[0] * (1 - t) + BG_BOT[0] * t)
        g = int(BG_TOP[1] * (1 - t) + BG_BOT[1] * t)
        b = int(BG_TOP[2] * (1 - t) + BG_BOT[2] * t)
        d.line([(0, y), (size, y)], fill=(r, g, b, 255))
    # round the corners with a mask
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size - 1, size - 1], radius=int(size * radius_frac), fill=255
    )
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def draw_bell(img, cx, cy, scale, color=(255, 255, 255, 255)):
    d = ImageDraw.Draw(img)
    s = scale
    # bell body: a bell-shaped polygon
    body = [
        (cx, cy - 1.05 * s),                 # top
        (cx + 0.55 * s, cy - 0.75 * s),
        (cx + 0.72 * s, cy + 0.35 * s),
        (cx + 1.02 * s, cy + 0.70 * s),      # right flare
        (cx - 1.02 * s, cy + 0.70 * s),      # left flare
        (cx - 0.72 * s, cy + 0.35 * s),
        (cx - 0.55 * s, cy - 0.75 * s),
    ]
    d.polygon(body, fill=color)
    # rounded top dome
    d.ellipse([cx - 0.55 * s, cy - 1.25 * s, cx + 0.55 * s, cy - 0.55 * s], fill=color)
    # handle knob
    d.ellipse([cx - 0.16 * s, cy - 1.45 * s, cx + 0.16 * s, cy - 1.13 * s], fill=color)
    # clapper
    d.ellipse([cx - 0.20 * s, cy + 0.78 * s, cx + 0.20 * s, cy + 1.12 * s], fill=color)


def make_icon(size, maskable=False):
    img = rounded_tile(size)
    # maskable icons need the art inside a safe zone (~80% center)
    scale = size * (0.24 if maskable else 0.30)
    draw_bell(img, size / 2, size / 2 - size * 0.02, scale)
    return img


def make_badge(size=72):
    # monochrome, transparent background (Android tints it)
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_bell(img, size / 2, size / 2, size * 0.30, color=(255, 255, 255, 255))
    return img


if __name__ == "__main__":
    make_icon(192).save("icon-192.png")
    make_icon(512).save("icon-512.png")
    make_icon(512, maskable=True).save("icon-512-maskable.png")
    make_badge(72).save("badge-72.png")
    print("Icons written: icon-192.png, icon-512.png, icon-512-maskable.png, badge-72.png")
