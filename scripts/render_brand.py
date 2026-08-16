#!/usr/bin/env python3
"""Rasterize Tempo brand assets. Exact wordmark/tagline via Pillow."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
INK = (14, 17, 22, 255)  # #0E1116
STONE = (201, 205, 212, 255)  # #C9CDD4
WORD = (236, 238, 241, 255)
MORTAR = (139, 145, 154, 255)
BRASS = (196, 165, 116, 255)  # #C4A574 — Tempo accent


def font(size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(
        "/System/Library/Fonts/HelveticaNeue.ttc", size=size, index=index
    )


def draw_t(draw: ImageDraw.ImageDraw, cx: float, cy: float, size: float, fill) -> None:
    """Bold rounded T — same letter as the original mark, not neon."""
    stem_w = size * 0.20
    bar_h = size * 0.18
    bar_w = size
    stem_h = size * 0.82
    x0 = cx - bar_w / 2
    y0 = cy - size / 2
    r = bar_h * 0.35
    draw.rounded_rectangle([x0, y0, x0 + bar_w, y0 + bar_h], radius=r, fill=fill)
    sx0 = cx - stem_w / 2
    draw.rounded_rectangle(
        [sx0, y0 + bar_h * 0.4, sx0 + stem_w, y0 + stem_h],
        radius=stem_w * 0.35,
        fill=fill,
    )


def render_logo(path: Path, canvas: int, transparent: bool) -> None:
    img = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0) if transparent else INK)
    draw = ImageDraw.Draw(img)
    if not transparent:
        # Soft rounded plate
        margin = int(canvas * 0.06)
        draw.rounded_rectangle(
            [margin, margin, canvas - margin, canvas - margin],
            radius=int(canvas * 0.18),
            fill=INK,
        )
    draw_t(draw, canvas / 2, canvas / 2, canvas * 0.52, BRASS)
    img.save(path, "PNG", optimize=True)


def render_hero(path: Path) -> None:
    w, h = 1600, 600
    img = Image.new("RGBA", (w, h), INK)
    draw = ImageDraw.Draw(img)
    draw_t(draw, w / 2, h * 0.36, 168, BRASS)
    word = font(88)
    tag = font(28)
    wordmark = "Tempo"
    tagline = "Immutable date and time types."
    wb = draw.textbbox((0, 0), wordmark, font=word)
    tb = draw.textbbox((0, 0), tagline, font=tag)
    word_y = h * 0.54
    tag_y = word_y + (wb[3] - wb[1]) + 18
    draw.text(((w - (wb[2] - wb[0])) / 2, word_y), wordmark, font=word, fill=WORD)
    draw.text(((w - (tb[2] - tb[0])) / 2, tag_y), tagline, font=tag, fill=MORTAR)
    img.save(path, "PNG", optimize=True)


def render_social(path: Path) -> None:
    w, h = 1280, 640
    img = Image.new("RGBA", (w, h), INK)
    draw = ImageDraw.Draw(img)
    draw_t(draw, w / 2, h * 0.36, 176, BRASS)
    word = font(84)
    tag = font(26)
    wordmark = "Tempo"
    tagline = "Immutable date and time types."
    wb = draw.textbbox((0, 0), wordmark, font=word)
    tb = draw.textbbox((0, 0), tagline, font=tag)
    word_y = h * 0.54
    tag_y = word_y + (wb[3] - wb[1]) + 16
    draw.text(((w - (wb[2] - wb[0])) / 2, word_y), wordmark, font=word, fill=WORD)
    draw.text(((w - (tb[2] - tb[0])) / 2, tag_y), tagline, font=tag, fill=MORTAR)
    img.save(path, "PNG", optimize=True)


def main() -> None:
    ASSETS.mkdir(exist_ok=True)
    render_logo(ASSETS / "logo.png", 1024, transparent=False)
    render_logo(ASSETS / "logo-transparent.png", 1024, transparent=True)
    render_hero(ASSETS / "hero.png")
    github = ROOT / ".github"
    github.mkdir(exist_ok=True)
    render_social(github / "social-preview.png")
    print("wrote logo, hero, and social preview")


if __name__ == "__main__":
    main()
