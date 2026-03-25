"""Generate OG image for risu.pl — terminal aesthetic."""

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG = "#0a0e14"
CYAN = "#00e5ff"
AMBER = "#ffb700"
TEXT_MUTED = "#6b7b8f"
BORDER = "#1e2a3a"
GREEN = "#39ff14"

FONT_DIR = "D:/Claude/projects/blog/public/fonts"
BOLD = f"{FONT_DIR}/JetBrainsMono-Bold.woff2"
REGULAR = f"{FONT_DIR}/JetBrainsMono-Regular.woff2"

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# Subtle border
draw.rectangle([0, 0, W - 1, H - 1], outline=BORDER, width=2)

# Top bar — fake terminal chrome
bar_h = 40
draw.rectangle([0, 0, W, bar_h], fill="#0d1117")
draw.line([(0, bar_h), (W, bar_h)], fill=BORDER, width=1)

# Window dots
for i, color in enumerate(["#ff5f56", "#ffbd2e", "#27c93f"]):
    draw.ellipse([20 + i * 22, 12, 34 + i * 22, 26], fill=color)

# Terminal title
title_font = ImageFont.truetype(REGULAR, 13)
draw.text((W // 2, bar_h // 2), "risu@brain:~/blog", fill=TEXT_MUTED, font=title_font, anchor="mm")

# Squirrel mascot (braille art, small) — positioned right side
mascot_lines = [
    "⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣀⣀⣀⣀⠀",
    "⠀⡀⡀⠀⢀⣄⠀⢀⡤⠖⠛⠉⠉⠀⠀⠀⠉⠳⢤",
    "⢠⠞⠉⡇⢠⠞⢹⣤⡴⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸",
    "⣼⠀⠀⢹⠇⢸⠹⣠⠞⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢨",
    "⠀⠈⠀⠙⠀⢸⠀⢹⡜⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘",
    "⠀⣀⣤⣤⡀⠻⠀⠀⠳⣰⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠎",
    "⠞⠑⠿⢿⡇⠀⠀⠀⠀⠘⠢⢠⡇⠀⠀⠀⠀⢀⡠⠖⠉",
    "⠠⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠙⠲⣤⡏⠀⢀⡟",
    "⣾⣄⣀⠤⠚⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢦⢸⠃",
]
mascot_font = ImageFont.truetype(REGULAR, 14)
mascot_x = W - 280
mascot_y = 160
for i, line in enumerate(mascot_lines):
    draw.text((mascot_x, mascot_y + i * 16), line, fill=AMBER, font=mascot_font)

# >_ glyph
glyph_font = ImageFont.truetype(BOLD, 28)
draw.text((80, 100), ">_", fill=GREEN, font=glyph_font)

# Main title
main_font = ImageFont.truetype(BOLD, 72)
draw.text((80, 160), "risu.pl", fill=CYAN, font=main_font)

# Tagline
tag_font = ImageFont.truetype(REGULAR, 24)
draw.text((84, 250), "random memories", fill=AMBER, font=tag_font)

# Description line
desc_font = ImageFont.truetype(REGULAR, 18)
draw.text((84, 310), "gaming · life · work · everything between", fill=TEXT_MUTED, font=desc_font)

# Bottom prompt
prompt_font = ImageFont.truetype(REGULAR, 16)
y_prompt = H - 80
draw.text((80, y_prompt), "$", fill=GREEN, font=prompt_font)
draw.text((100, y_prompt), "cat recent_posts.md", fill=TEXT_MUTED, font=prompt_font)

# Blinking cursor
cursor_font = ImageFont.truetype(BOLD, 16)
bbox = draw.textbbox((100, y_prompt), "cat recent_posts.md", font=prompt_font)
draw.text((bbox[2] + 4, y_prompt), "█", fill=GREEN, font=cursor_font)

# Separator line above prompt
draw.line([(80, y_prompt - 20), (W - 80, y_prompt - 20)], fill=BORDER, width=1)

out = "D:/Claude/projects/blog/public/og-image.png"
img.save(out, "PNG", optimize=True)
print(f"Saved: {out} ({img.size[0]}x{img.size[1]})")
