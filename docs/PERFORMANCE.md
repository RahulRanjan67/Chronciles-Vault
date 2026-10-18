# Chronicles Vault — Performance Targets, Benchmarks & Optimization

## 1. Quantitative Performance Budgets

Chronicles Vault treats responsiveness as a primary domain requirement. Fast, local software builds trust and intellectual flow.

| Metric | Target Budget | Upper Acceptable Limit | Measurement Method |
|---|---|---|---|
| **App Cold Start** | < 1,200 ms | 2,000 ms | Process launch to interactive library render |
| **App Warm Start** | < 400 ms | 700 ms | Window restore to first paint |
| **Library Interaction Latency** | < 50 ms | 100 ms | Shelf filter click to visible item update |
| **Full-Text Search Latency** | < 40 ms | 150 ms | Debounced keystroke to FTS5 result render |
| **Reader Page Turn / Next** | < 16 ms | 32 ms | Keypress to next canvas/DOM frame rendered |
| **Memory Capture Submission**| < 80 ms | 200 ms | Shortcut hit to memory saved in SQLite |
| **Vault Unlock Computation** | 700 ms | 1,200 ms | Argon2id KDF derivation time |
| **Scroll Framerate** | 60 FPS (16.6ms) | 55 FPS | Virtualized grid scroll on 4K display |
| **Idle Memory Footprint** | < 90 MB | 150 MB | Resident set size (RSS) in the Capacitor WebView |

---

## 2. 500-Work Benchmark Plan

To prevent regressions, the automated test suite includes a performance benchmark scenario simulating a mature reader's vault:

### 2.1 Benchmark Dataset Shape
- **Works**: 500 works across manga (200), light novels (100), western novels (100), and PDF papers (100).
- **Access Paths**: 1,200 paths (mix of local files, web links, and RSS feeds).
- **Memories & Highlights**: 3,500 entries (2,000 text notes, 1,000 quotes, 500 screenshots with image references).
- **Reading Progress Events**: 15,000 discrete progress log entries.
- **Lore Entries**: 1,000 worldbuilding character and location nodes.

### 2.2 Standard Benchmark Suite
1. **Benchmark-1 (Library Load)**: `SELECT * FROM works WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 50;` -> **Target: < 8ms**.
2. **Benchmark-2 (FTS Search)**: `SELECT * FROM search_fts WHERE search_fts MATCH 'cyberpunk OR matrix' ORDER BY rank LIMIT 20;` -> **Target: < 12ms**.
3. **Benchmark-3 (Memory Timeline)**: Aggregating chronological highlights and notes for a single 500-page book -> **Target: < 15ms**.
4. **Benchmark-4 (Vault Decrypt Burst)**: Decrypting 50 vault-protected memory quotes upon unlocking -> **Target: < 45ms** (using Web Crypto AES-GCM).

---

## 3. Device Profiles Matrix

The app automatically detects system capabilities and selects an operational profile, which users can also manually override in settings:

| Capability | Lite Profile | Balanced Profile (Default) | Full / High-End Profile |
|---|---|---|---|
| **Target Hardware** | Dual-core laptops, low RAM, battery | Modern 4-core+ laptops, standard desktops | Desktop workstations, dedicated GPU |
| **CSS Backdrop Filter** | Disabled (flat opaque surfaces) | Enabled (16px blur on modals) | Enabled (32px blur on all chrome) |
| **Virtualization Window** | 20 items buffer | 40 items buffer | 80 items buffer |
| **Cover Image Caching** | Low-res 200px thumbnails | WebP 400px optimized thumbs | Lossless high-res textures |
| **Background Polling** | Manual / on demand only | Periodic (every 30 mins) | Real-time continuous sync |
| **Webtoon Canvas Buffer**| 3 pages ahead | 6 pages ahead | 12 pages ahead |

---

## 4. Route Tier Strategy

Routes are split into strategic loading tiers to optimize code splitting and memory residency:

```
Tier 0 (Instant) ────> Tier 1 (Core) ────> Tier 2 (Analytical) ────> Tier 3 (Admin)
```

### Tier 0: Critical Instant Routes (< 50ms)
- **Home / Return Desk**: First view shown upon app launch. Static shell with cached state from localStorage/IndexedDB rendered immediately.
- **Library Shelf View**: Virtualized grid of works. Pre-fetched during app initialization.

### Tier 1: Core Reading Routes (< 200ms)
- **Reader Shell (EPUB/PDF/CBZ)**: Lazy-loaded when user clicks "Read". Loads format parser and reader canvas in an isolated chunk.
- **Work Detail View**: Detailed synopsis, access paths, chapter list, and memory timeline.

### Tier 2: Analytical & Rich Views (< 350ms)
- **Statistics & Velocity Charts**: Recharts / Canvas data visualizations.
- **Lore Graph**: Cytoscape / D3 interactive relationship network.
- **Global Memory Gallery**: Infinite masonry grid of highlights and screenshots.

### Tier 3: Configuration & Maintenance (Deferred)
- **Settings & Theme Customization**
- **Vault Setup & Passphrase Rotation**
- **Goodreads / Calibre Import Wizards**

---

## 5. Virtualization & DOM Optimization Rules

1. **Virtualization Requirement**: Any list or grid potentially exceeding 30 DOM elements MUST use `@tanstack/react-virtual`.
2. **Fixed Item Bounds**: Book cover cards have strictly defined aspect ratios (`aspect-[3/4]`) to allow accurate virtual scroll height calculations without expensive DOM measuring.
3. **Lazy Image Loading**:
   - Cover images use native `loading="lazy"` plus an `IntersectionObserver` hook.
   - When off-screen, high-resolution images are unloaded and replaced with CSS placeholder gradients.
4. **Canvas Buffer Recycling**: In the CBZ/Webtoon continuous reader, canvas elements that scroll more than 2 viewports above or below the viewport are systematically cleared and collected to keep GPU memory under 100MB.
