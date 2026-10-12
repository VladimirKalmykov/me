"""Render the two share cards from the site's portrait and local typefaces."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SIZE = (1200, 630)
BG = (5, 8, 13)
TEXT = (229, 238, 241)
MUTED = (157, 180, 190)
ACCENT = (109, 229, 236)


def font(size, bold=False):
    name = "Geologica-Semibold.ttf" if bold else "Geologica-Regular.ttf"
    return ImageFont.truetype(ROOT / "assets" / "fonts" / name, size)


def render(lang):
    canvas = Image.new("RGB", SIZE, BG)
    draw = ImageDraw.Draw(canvas)

    # The portrait deliberately shares the site's existing asset and color palette.
    portrait = Image.open(ROOT / "assets" / "avatar-square.webp").convert("RGB")
    portrait = portrait.resize((498, 498), Image.Resampling.LANCZOS)
    canvas.paste(portrait, (702, 66))
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((702, 66, 1199, 563), outline=(49, 85, 96), width=2)
    draw.line((64, 66, 610, 66), fill=(40, 80, 90), width=2)
    draw.rectangle((64, 63, 116, 69), fill=ACCENT)

    if lang == "ru":
        name = ("Владимир", "Калмыков")
        role = "SENIOR / LEAD FULLSTACK DEVELOPER"
        thesis = ("Архитектура и инструменты,", "с которыми команды выпускают", "продукты быстрее.")
        label = "ИНЖЕНЕРНОЕ ПОРТФОЛИО"
    else:
        name = ("Vladimir", "Kalmykov")
        role = "SENIOR / LEAD FULLSTACK DEVELOPER"
        thesis = ("Architecture and tools", "that help teams ship", "products faster.")
        label = "ENGINEERING PORTFOLIO"

    draw.text((64, 111), role, font=font(19, True), fill=ACCENT)
    draw.text((59, 170), name[0], font=font(74, True), fill=TEXT)
    draw.text((59, 252), name[1] + ".", font=font(74, True), fill=TEXT)
    for index, line in enumerate(thesis):
        draw.text((64, 386 + index * 36), line, font=font(27), fill=MUTED)

    draw.line((64, 562, 608, 562), fill=(40, 80, 90), width=2)
    draw.text((64, 580), label, font=font(16, True), fill=ACCENT)
    draw.text((505, 580), "VK / ME", font=font(16), fill=MUTED)
    canvas.save(ROOT / "assets" / f"og-{lang}.png", optimize=True)


for language in ("ru", "en"):
    render(language)
