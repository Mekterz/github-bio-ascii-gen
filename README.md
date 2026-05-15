# GitHub Bio ASCII Generator

![License](https://img.shields.io/badge/license-MIT-green.svg)
![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)
![Deployment](https://img.shields.io/badge/deploy-GitHub_Pages-blue.svg)

High-fidelity image-to-ASCII converter optimized specifically for GitHub profile bios. This tool leverages Braille Unicode patterns and Floyd-Steinberg dithering to maximize visual detail within GitHub's 160-character limit.

## Key Features

- **Braille Matrix Rendering**: Uses 2x4 dot mapping to achieve 8x higher resolution than standard block ASCII.
- **Floyd-Steinberg Dithering**: Advanced error-diffusion algorithm for photographic-quality shading.
- **Auto-Budgeting**: Real-time character count tracking to ensure compatibility with GitHub's bio constraints.
- **Zero Backend**: 100% client-side processing using the HTML5 Canvas API.

## Usage

1. Access the live tool at [mekterz.github.io/github-bio-ascii-gen/](https://mekterz.github.io/github-bio-ascii-gen/)
2. Upload any image (logos, silhouettes, or portraits work best).
3. Adjust the **Width** (15-20 characters recommended for bios) and **Threshold**.
4. Enable **High Fidelity** for complex images.
5. Copy the result and paste it directly into your GitHub profile.

## Technical Details

The generator maps image luminance to the Unicode Braille Patterns block (`U+2800` - `U+28FF`). Each character represents a 2x4 pixel grid, allowing for intricate designs even in extremely small text areas.

---
*License: MIT | Created for the developer community.*
