# Chronicles Vault — Asset Catalog & Graphic Requests

This document outlines all graphic assets, icons, illustrations, and demo media required for Chronicles Vault, complete with exact dimensions, aspect ratios, file formats, and replacement guidelines.

---

## 1. Brand Identity Assets

### 1.1 Application Logo / App Icon
- **Asset ID**: `brand-app-icon`
- **Description**: Monolithic, elegant vault door merged with an open book or chronicle codex, styled in zinc charcoal with a subtle indigo internal glow.
- **Aspect Ratio**: 1:1 (Square)
- **Formats & Resolutions**:
  - `logo.svg` (Scalable vector, clean paths, no embedded raster)
  - `icon-1024.png` (1024x1024, 32-bit RGBA)
  - `icon-512.png` (512x512)
  - `icon-256.png` (256x256)
  - `icon-128.png` (128x128)
  - `icon-32.png` (32x32)
  - `icon-16.png` (16x16)
  - `icon.ico` (Multi-resolution Windows icon container)
  - `icon.icns` (macOS bundle icon)
- **Destination**: `apps/client/public/icons/` and the Capacitor-generated native asset directories when native scaffolding is added.

### 1.2 Brand Wordmark
- **Asset ID**: `brand-wordmark`
- **Description**: "Chronicles Vault" typographic mark set in modern geometric sans with the letter "V" subtly accented with an indigo serif notch.
- **Aspect Ratio**: 4:1
- **Dimensions**: 800 x 200 px
- **Format**: SVG + transparent PNG (2x retina)
- **Destination**: `apps/client/public/brand/wordmark.svg`

---

## 2. Hero & Marketing Illustrations

### 2.1 Hero Banner (First-Run / Welcome Screen)
- **Asset ID**: `hero-welcome-canvas`
- **Description**: Isometric, cinematic illustration depicting an infinite personal digital library floating in a calm, dark cosmos. Soft indigo light beams illuminating stacks of ancient codices alongside glowing digital holographic tablets.
- **Aspect Ratio**: 16:9
- **Dimensions**: 1920 x 1080 px (Compressed WebP, < 350 KB)
- **Destination**: `apps/client/src/assets/hero-welcome.webp`

### 2.2 Vault Locked Illustration
- **Asset ID**: `illustration-vault-locked`
- **Description**: Minimalist vector graphic of a reinforced biometric vault chamber with a glowing indigo keyhole.
- **Aspect Ratio**: 1:1
- **Dimensions**: 600 x 600 px (SVG / WebP)
- **Destination**: `apps/client/src/assets/vault-locked.svg`

### 2.3 Empty Shelf State Illustration
- **Asset ID**: `illustration-empty-shelf`
- **Description**: Clean, atmospheric line illustration of an open mahogany library bookshelf with subtle ambient dust particles and warm highlights.
- **Aspect Ratio**: 4:3
- **Dimensions**: 800 x 600 px (SVG / WebP)
- **Destination**: `apps/client/src/assets/empty-shelf.svg`

---

## 3. Seed Dataset Demo Book Covers

All book covers maintain the standard industry cover ratio of **3:4** (Width:Height) with clean, high-contrast title typography.

| Cover ID | Title | Genre / Content Type | Visual Description | Dimensions | Aspect Ratio | Format |
|---|---|---|---|---|---|---|
| `cover-demo-01` | *Neon Horizon: Sector 7* | Cyberpunk Light Novel | Rain-slicked dystopian skyscraper city with neon kanji billboards and flying hovercars. | 600 x 800 px | 3:4 | WebP (< 80KB) |
| `cover-demo-02` | *The Obsidian Archive* | High Fantasy Novel | Ancient black stone library tower surrounded by swirling arcane emerald runes. | 600 x 800 px | 3:4 | WebP (< 80KB) |
| `cover-demo-03` | *Shadow Alchemist* | Action Manhwa / Webtoon | Dual-wielding protagonist with glowing purple transmutation circles against a shadowy beast. | 600 x 800 px | 3:4 | WebP (< 80KB) |
| `cover-demo-04` | *Quantum Cognition in LLMs* | Academic PDF Monograph | Minimalist geometric lattice diagram representing multi-dimensional attention tensors. | 600 x 800 px | 3:4 | WebP (< 80KB) |
| `cover-demo-05` | *Meditations on Solitude* | Philosophy Classic | Serene zen pebble garden under a misty mountain pine tree at dawn. | 600 x 800 px | 3:4 | WebP (< 80KB) |

**Destination**: `scripts/seed/assets/covers/` and `apps/client/public/demo-covers/`

---

## 4. Browser Extension Icons

- **Dimensions**:
  - `ext-16.png` (16 x 16 px)
  - `ext-32.png` (32 x 32 px)
  - `ext-48.png` (48 x 48 px)
  - `ext-128.png` (128 x 128 px)
- **Description**: High-contrast glyph of the Vault icon with a small "+" badge indicator representing capture.
- **Destination**: `apps/browser/chromium/icons/` and `apps/browser/firefox/icons/`

---

## 5. Replacement Instructions for Designers & AI Agents

1. **Direct Overwrite**: Place final optimized images in their designated destination directories keeping the exact filenames.
2. **WebP Optimization**: Raster graphics must be saved using Google WebP format with `quality = 82`, lossless alpha channel, and metadata stripped.
3. **SVG Hygiene**: Vector files must be minified via `svgo`, stripping `id` collisions and ensuring viewBox coordinates are bounded (`0 0 W H`).
4. **Fallback Handling**: If an image asset is missing at runtime, the UI layer falls back gracefully to `packages/ui/src/utils/cover-fallback.ts` which renders a CSS-generated geometric cover with title initials.
