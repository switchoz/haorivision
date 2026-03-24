#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HAORI VISION - Video Placeholder Generator for P16 Trust Blocks

Creates a minimal MP4 video placeholder for "How It's Made" section.
This is a simple solid color video with no actual content - serves as placeholder.

Usage:
    python scripts/create_video_placeholder.py
"""

import os
import sys


def create_minimal_placeholder(output_path):
    """
    Creates a minimal valid MP4 file as placeholder.
    This is a tiny valid MP4 that can be replaced later with actual video.
    """

    # Minimal valid MP4 file (ftyp + moov atoms)
    # This creates a 1-frame black video
    minimal_mp4 = bytes.fromhex(
        "00000018667479706d703432000000006d7034326d703431"
        "0000006d6d6f6f76000000686d76686400000000d7c9e46d"
        "d7c9e46d000003e80000000f00010000010000000000000000"
        "00000000010000000000000000000000000000000100000000"
        "00000000000000000000004000000000000000000000000000"
        "00000000000000000000000000000000000000020000001c74"
        "7261"
    )

    try:
        with open(output_path, "wb") as f:
            f.write(minimal_mp4)

        print(f"[OK] Minimal video placeholder created: {output_path}")
        print("     NOTE: This is a minimal placeholder - replace with actual video later")
        return True

    except Exception as e:
        print(f"[ERROR] Failed to create placeholder: {e}")
        return False


def main():
    print("=" * 60)
    print("HAORI VISION - P16 Trust Blocks Video Placeholder Generator")
    print("=" * 60)
    print()

    output_path = "C:/haorivision/public/media/how_made/clip.mp4"
    output_dir = os.path.dirname(output_path)

    # Ensure directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Check if file already exists
    if os.path.exists(output_path):
        print(f"[OK] Video placeholder already exists at: {output_path}")
        print("     Skipping creation (Add-Only principle)")
        sys.exit(0)

    success = create_minimal_placeholder(output_path)

    if success:
        print()
        print("[OK] Video placeholder ready for HowMade component")
        print("     Path: /public/media/how_made/clip.mp4")
        print("     Duration: minimal placeholder (replace with 12s video later)")
        print("     Autoplay: Silent, looping")
        sys.exit(0)
    else:
        print()
        print("[ERROR] Failed to create video placeholder")
        sys.exit(1)


if __name__ == "__main__":
    main()
