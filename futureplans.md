# Grimoire — Future Product Roadmap & Architectural Blueprint

**Author:** Grimoire Engineering & Design Architecture Team  
**Document Status:** Approved Strategic Roadmap  
**Target Versions:** v2.0 (Design & Micro-Interactions Overhaul) & v3.0 (AI Sanctum Assistant & Autonomous Work Cataloging)  

---

## Executive Summary

Grimoire is evolving from a local-first functional prototype into a world-class, authentic literary and visual media sanctum. To eliminate the generic, hyper-saturated aesthetic of typical AI-generated interfaces ("AI slop"), Grimoire will undergo a radical design and interaction transformation in **Version 2.0**, inspired by top-tier contemporary web design standards (Emil Kowalski micro-interactions, Awwwards Site-of-the-Year candidates, Linear/Raycast density, and Editorial/Literary minimalism). 

In **Version 3.0**, Grimoire will introduce the **Sanctum Bot AI Assistant**, an ambient, zero-friction knowledge-engine that relieves users of the burden of manual metadata entry, work classification, and quote clipping.

---

## Phase 1: Version 2.0 — Aesthetic Overhaul & Tangible Craft (Anti-"AI Slop")

### 1. The Anti-Pattern: What Makes Interfaces Look Like "AI Slop"?
* **Over-reliance on generic gradients:** Purple-to-pink gradient pills and glowing cyan outer glows that convey superficial "futuristic" themes without purpose.
* **Artificial uniform padding:** Rigid cards that float in empty voids without structural hierarchy, typographic rhythm, or editorial grid logic.
* **Lifeless transitions:** Linear opacity fades and stiff popups that lack physical weight, spring physics, or gestural momentum.
* **Stock visual tropes:** Random icons attached to every single header without editorial necessity.

### 2. Design Philosophy & Inspiration Anchors
* **Emil Kowalski Micro-Interactions:**
  * Physics-based spring animations (`framer-motion` / CSS `linear()` timing functions) with natural mass, damping, and stiffness.
  * Shared layout animations (`layoutId`) when expanding books, covers, and memory drawers so elements physically morph rather than abruptly appear.
  * Tactile button press states (`active:scale-[0.98]` with instantaneous 40ms press-down and elastic spring-back).
  * Interactive drag-to-dismiss sheets with velocity-aware gesture tracking.
* **Awwwards & Editorial Typography:**
  * Curated typographic pairings: High-contrast serif headlines (*Fraunces*, *Newsreader*, or *Playfair Display*) paired with hyper-legible geometric mono accents (*Geist Mono*, *JetBrains Mono*) and humanistic body text (*Inter Tight* or *Lora*).
  * Asymmetric, magazine-grade grid layouts: Works presented not as endless identical cards, but as curated anthologies with editorial pull-quotes, spine-binding visuals, and variable-density shelf viewports.
* **Tactile Materiality (Physicality & Depth):**
  * True paper grain textures in *Antique Parchment* theme with ink-bleed borders (`border-image` or subtle SVG turbulences).
  * Deep, non-blurry ambient shadows (`box-shadow: 0 1px 1px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.06), 0 16px 32px rgba(0,0,0,0.04)`).
  * Realistic bookbinding spine creases, ribbon bookmark physics, and tactile leather corners in reader views.

### 3. Implementation Deliverables for v2.0
1. **Dynamic Page Turn Physics 2.0:**
   - WebGL / Canvas-accelerated cloth/paper simulation for corner-pull gestures with realistic underside shadowing, specular sheen, and curl stiffness.
2. **Fluid Command Navigation:**
   - Raycast-style command bar (`⌘K` / `Ctrl+K`) with instant keyboard navigation, contextual breadcrumbs, and preview drawer.
3. **Typography Engine:**
   - User-selectable typeface pairings (Classic Book Serifs, High-Density System Sans, Japanese/CJK-optimized Mincho fonts).
4. **Adaptive Contextual Headers:**
   - Auto-collapsing slim navigation bars that preserve vertical reading canvas and transition smoothly on scroll.

---

## Phase 2: Version 3.0 — AI Sanctum Assistant & Automated Cataloging

### 1. Problem Statement
Manually entering novel descriptions, chapter numbers, publisher tags, cover images, author bios, and alternate romanized titles for 500+ novels, manhwas, and anime series is tedious, error-prone, and leads to library abandonment.

### 2. The Solution: Sanctum Bot Assistant
A conversational, local/hybrid AI agent running in the sidebar or command palette that automates the entire ingestion pipeline:

```mermaid
flowchart TD
    A["Raw Input (URL, Title, Screenshot, or Text Clip)"] --> B["Sanctum Bot Ingestion Agent"]
    B --> C["Metadata Extraction & Entity Resolution"]
    C --> D1["Autofill Work Info (Title, Aliases, Author, Cover)"]
    C --> D2["Detect Medium & Source (Novel, Manhwa, Donghua)"]
    C --> D3["Suggest Custom Categories & Tags"]
    C --> D4["Generate Instant Memory / Quote Anchor"]
    D1 & D2 & D3 & D4 --> E["One-Click Review & Commit to Library"]
```

### 3. Core Capabilities of Sanctum Bot
1. **Universal One-Shot URL Scraper & Resolver:**
   - Paste a link from Royal Road, MangaDex, NovelUpdates, Bilibili, VIZ, or Syosetu.
   - The bot automatically queries metadata, extracts high-res cover art, parses latest chapter numbers, detects publication status, and establishes multi-access paths.
2. **Screenshot-to-Memory Vision Pipeline:**
   - Drop a screenshot from a reader app or comic page.
   - The bot performs OCR, identifies the exact novel/manga, determines chapter/page context, extracts the spoken quote, detects potential spoilers, and creates an emotional Memory Card.
3. **Cross-Medium Adaptation Matcher:**
   - Given a web novel, the bot queries known adaptation databases to ask: *"Did you know this novel has a serialized Manhwa and an upcoming Donghua? Would you like me to link them with shared progress tracking?"*
4. **Hiatus & Release Radar AI Summary:**
   - Generates weekly natural-language digest: *"3 of your stalled novels dropped new arcs this week. 'Lord of the Mysteries: Circle of Inevitability' published 14 new chapters since your last session at Chapter 85."*
5. **Zero-Knowledge Local Model Fallback:**
   - Runs locally using WebLLM / Ollama (`gemma-2-2b`, `llama-3.2-3b`) inside the browser or PC Studio, ensuring zero user reading data ever leaves the local device unless explicit cloud sync is requested.

---

## Architectural File & Codebase Layout

```
Chronicles Vault/
├── grimoire/                      # [Monorepo Web Client & Core Packages]
│   ├── apps/
│   │   ├── client/                # React 18 + Vite Web Application & PWA
│   │   │   ├── src/
│   │   │   │   ├── routes/        # Library, Up Next, Vault, Sync, Reader
│   │   │   │   └── utils/         # Cross-platform sync, local media, vault
│   ├── packages/
│   │   ├── domain/                # Zero-dependency TypeScript business rules
│   │   ├── state/                 # Zustand stores, CRDT sync, SQLite repo
│   │   ├── reader/                # PDF, EPUB, CBZ, TXT/MD/DOCX reader engines
│   │   ├── vault/                 # WebCrypto AES-GCM-256 + PBKDF2 zero-knowledge
│   │   └── ui/                    # Tailwind CSS atomic component library
│   └── tools/                     # Sample pack generator, media synthesizers
│
├── grimoire studio/               # [PC Workstation App & Windows Native Codebase]
│   ├── pc_workstation_app.py      # Native PyQt6 / PySide6 desktop workstation
│   ├── sync_hub_server.py         # Embedded CRDT Hybrid Logical Clock server
│   ├── client_dist/               # Built static client assets bundled in executable
│   └── Grimoire-Studio.exe        # Standalone Windows executable
│
└── grimoire Mobile/               # [Mobile App Codebase & Android Native Package]
    ├── android/                   # Capacitor / Gradle Android Studio project
    ├── Grimoire.apk               # Direct offline installable Android package
    └── capacitor.config.ts        # Native file sandbox & SQLite bridge bindings
```
