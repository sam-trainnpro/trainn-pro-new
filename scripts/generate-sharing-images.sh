#!/usr/bin/env bash
# Run from the project root with ImageMagick (AVIF, WebP and JPEG support).
set -euo pipefail

source_image=client/public/hero-v6-no-border.png
for width in 640 1280 1920 2560; do
  magick "$source_image" -resize "${width}x" -strip -quality 52 "client/public/hero-${width}.avif"
  magick "$source_image" -resize "${width}x" -strip -quality 78 "client/public/hero-${width}.webp"
  magick "$source_image" -resize "${width}x" -background white -alpha remove -strip \
    -sampling-factor 4:2:0 -interlace Plane -quality 80 "client/public/hero-${width}.jpg"
done

# Reuse Trainn's existing artwork and red wordmark; JPEG works across social crawlers.
magick -size 1200x630 xc:'#171717' \
  \( "$source_image" -resize 1200x -background white -alpha remove \) -geometry +0+0 -composite \
  -fill '#bd0f18' -draw 'roundrectangle 40,30 280,115 14,14' \
  -font DejaVu-Sans-Bold -fill white -pointsize 54 -annotate +63+91 'Trainn' \
  -pointsize 44 -annotate +48+540 'Activities for the Whole Family' \
  -font DejaVu-Sans -pointsize 25 -fill '#eeeeee' \
  -annotate +48+589 'Fitness, sports & creative classes' \
  -pointsize 24 -annotate +1010+589 'trainn.pro' \
  -strip -sampling-factor 4:2:0 -interlace Plane -quality 86 client/public/social-preview.jpg
