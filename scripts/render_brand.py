#!/usr/bin/env python3
"""Rasterize Tempo banners from the official logo. Do not redraw the mark."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
LOGO = ASSETS / "logo.png"
INK = (14, 17, 22, 255)
WORD = (236, 238, 241, 255)
MORTAR = (139, 145, 154, 255)


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(
        "/System/Library/Fonts/HelveticaNeue.ttc", size=size, index=0
    )


def banner(path: Path, width: int, height: int, mark: int, word_size: int, tag_size: int) -> None:
    img = Image.new("RGBA", (width, height), INK)
    draw = ImageDraw.Draw(img)
    logo = Image.open(LOGO).convert("RGBA")
    logo.thumbnail((mark, mark), Image.Resampling.LANCZOS)
    img.paste(logo, ((width - logo.width) // 2, int(height * 0.14)), logo)

    word = font(word_size)
    tag = font(tag_size)
    wordmark = "Tempo"
    tagline = "Immutable date and time types."
    wb = draw.textbbox((0, 0), wordmark, font=word)
    tb = draw.textbbox((0, 0), tagline, font=tag)
    word_y = int(height * 0.14) + logo.height + 22
    tag_y = word_y + (wb[3] - wb[1]) + 14
    draw.text(((width - (wb[2] - wb[0])) / 2, word_y), wordmark, font=word, fill=WORD)
    draw.text(((width - (tb[2] - tb[0])) / 2, tag_y), tagline, font=tag, fill=MORTAR)
    img.save(path, "PNG", optimize=True)


def main() -> None:
    if not LOGO.exists():
        raise SystemExit("assets/logo.png is the official mark and must exist")
    banner(ASSETS / "hero.png", 1600, 600, 168, 80, 26)
    (ROOT / ".github").mkdir(exist_ok=True)
    banner(ROOT / ".github" / "social-preview.png", 1280, 640, 176, 76, 24)
    print("wrote hero and social preview from official logo.png")


if __name__ == "__main__":
    main()
