#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HAORI VISION - Avatar Placeholder Generator for P16 Trust Blocks

Creates simple SVG avatar placeholders for customer reviews.
These are minimal, abstract avatars that don't contain real customer photos.

Usage:
    python scripts/create_avatar_placeholders.py
"""

import os


def create_svg_avatar(number: int, color: str, output_path: str):
    """
    Creates a simple SVG avatar with initials and colored background.
    """

    svg_content = f'''<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="{color}"/>
  <circle cx="100" cy="80" r="35" fill="rgba(255,255,255,0.3)"/>
  <ellipse cx="100" cy="160" rx="50" ry="40" fill="rgba(255,255,255,0.3)"/>
  <text x="100" y="110" font-family="Arial, sans-serif" font-size="48"
        fill="white" text-anchor="middle" dominant-baseline="middle">
    {number}
  </text>
</svg>'''

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)


def create_default_avatar(output_path: str):
    """
    Creates a default/fallback avatar for error states.
    """

    svg_content = '''<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="#52525b"/>
  <circle cx="100" cy="80" r="35" fill="rgba(255,255,255,0.2)"/>
  <ellipse cx="100" cy="160" rx="50" ry="40" fill="rgba(255,255,255,0.2)"/>
</svg>'''

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)


def main():
    print("=" * 60)
    print("HAORI VISION - P16 Avatar Placeholder Generator")
    print("=" * 60)
    print()

    output_dir = "C:/haorivision/public/media/avatars"
    os.makedirs(output_dir, exist_ok=True)

    # Avatar colors (soft, professional palette)
    colors = [
        "#6366f1",  # Indigo
        "#8b5cf6",  # Purple
        "#ec4899",  # Pink
    ]

    created_count = 0
    skipped_count = 0

    # Create numbered avatars
    for i, color in enumerate(colors, start=1):
        output_path = os.path.join(output_dir, f"placeholder_{i:02d}.jpg")

        if os.path.exists(output_path):
            print(f"[SKIP] Avatar {i:02d} already exists: {output_path}")
            skipped_count += 1
            continue

        # Create SVG version
        svg_path = output_path.replace('.jpg', '.svg')
        create_svg_avatar(i, color, svg_path)
        print(f"[OK] Created avatar {i:02d}: {svg_path}")
        created_count += 1

    # Create default/fallback avatar
    default_path = os.path.join(output_dir, "default.jpg")
    if os.path.exists(default_path):
        print(f"[SKIP] Default avatar already exists: {default_path}")
        skipped_count += 1
    else:
        default_svg_path = default_path.replace('.jpg', '.svg')
        create_default_avatar(default_svg_path)
        print(f"[OK] Created default avatar: {default_svg_path}")
        created_count += 1

    print()
    print("=" * 60)
    print(f"[DONE] Created: {created_count}, Skipped: {skipped_count}")
    print()
    print("NOTE: SVG files created as placeholders.")
    print("      Update reviews.json to use .svg extensions instead of .jpg")
    print("      Or replace with actual JPG images later.")
    print("=" * 60)


if __name__ == "__main__":
    main()
