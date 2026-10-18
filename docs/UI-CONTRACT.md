# Chronicles Vault — UI Contract & Design System Specification

## 1. Visual Philosophy & Semantic Design Tokens

Chronicles Vault utilizes a dark-mode first, high-density, low-glare aesthetic tailored for long-form reading, catalog curation, and intellectual research. The palette balances zinc neutrals with restrained indigo accents and high-legibility typographic hierarchy.

### 1.1 Color Tokens
All styling MUST reference CSS variables or Tailwind token names; hardcoded hex codes in component code are strictly forbidden.

| Category | CSS Variable | Value | Purpose |
|---|---|---|---|
| Canvas Base | `--cv-bg` | `#09090b` | Main application background (zinc-950) |
| Elevated Surface | `--cv-bg-elevated` | `#18181b` | Cards, sidebars, modal overlays (zinc-900) |
| Component Surface| `--cv-surface` | `#27272a` | Text inputs, dropdown triggers, chips (zinc-800) |
| Raised Surface | `--cv-surface-raised`| `#3f3f46` | Hover states, selected list items (zinc-700) |
| Active Surface | `--cv-surface-hover` | `#52525b` | Pressed states, active toggles (zinc-600) |
| Primary Text | `--cv-text` | `#fafafa` | Headings, primary content (zinc-50) |
| Muted Text | `--cv-text-muted` | `#a1a1aa` | Secondary labels, timestamps (zinc-400) |
| Subtle Text | `--cv-text-subtle` | `#71717a` | Placeholders, inactive icons (zinc-500) |
| Brand Accent | `--cv-accent` | `#6366f1` | Primary CTA buttons, active tab indicators (indigo-500) |
| Accent Strong | `--cv-accent-strong` | `#818cf8` | Hover state for accent buttons (indigo-400) |
| Accent Muted | `--cv-accent-muted` | `rgba(99, 102, 241, 0.15)` | Active chip backgrounds, subtle badges |
| Subtle Accent | `--cv-accent-subtle`| `rgba(99, 102, 241, 0.08)` | Table row highlights |
| Subdued Border | `--cv-border` | `rgba(255, 255, 255, 0.08)` | Default card and divider borders |
| Strong Border | `--cv-border-strong` | `rgba(255, 255, 255, 0.15)` | Modal and input borders |
| Focus Ring | `--cv-border-focus` | `rgba(99, 102, 241, 0.60)` | Focus outline for accessible navigation |

#### Status Colors
| State | CSS Variable | Solid Hex | Muted Background Token |
|---|---|---|---|
| Success | `--cv-success` | `#22c55e` | `--cv-success-muted` (`rgba(34, 197, 94, 0.12)`) |
| Warning | `--cv-warning` | `#f59e0b` | `--cv-warning-muted` (`rgba(245, 158, 11, 0.12)`) |
| Danger | `--cv-danger` | `#ef4444` | `--cv-danger-muted` (`rgba(239, 68, 68, 0.12)`) |
| Info | `--cv-info` | `#3b82f6` | `--cv-info-muted` (`rgba(59, 130, 246, 0.12)`) |

#### Source Health Indicators
| Health Level | Color Token | Hex | Semantic Meaning |
|---|---|---|---|
| `healthy` | `--cv-health-healthy` | `#22c55e` | Source reachable, latest chapter confirmed |
| `degraded` | `--cv-health-degraded` | `#f59e0b` | Source responsive but slow or cloudflare throttled |
| `unavailable`| `--cv-health-unavailable` | `#ef4444` | HTTP 404, file missing, or domain offline |
| `stale` | `--cv-health-stale` | `#a1a1aa` | Not checked in > 14 days |
| `unknown` | `--cv-health-unknown` | `#71717a` | Freshly added source with no check log |
| `local` | `--cv-health-local` | `#6366f1` | Offline local file verified on disk |

---

## 2. Typography System

The interface uses standard system sans-serif (`Inter`, `system-ui`) for UI chrome and `JetBrains Mono` for code, counters, and technical hashes.

### 2.1 Type Scale
| Token | Font Size | Line Height | Relative Rem | Usage |
|---|---|---|---|---|
| `--cv-text-xs` | 12px | 16px (1.33) | 0.75rem | Badges, tags, table timestamps |
| `--cv-text-sm` | 14px | 20px (1.42) | 0.875rem | Body secondary, inputs, menu items |
| `--cv-text-base`| 16px | 24px (1.50) | 1.00rem | Body primary, reader default, tooltips |
| `--cv-text-lg` | 18px | 28px (1.55) | 1.125rem | Section headers, card titles |
| `--cv-text-xl` | 20px | 28px (1.40) | 1.25rem | Modal titles, shelf headers |
| `--cv-text-2xl` | 24px | 32px (1.33) | 1.50rem | Page titles, statistics hero |
| `--cv-text-3xl` | 30px | 36px (1.20) | 1.875rem | Major category headers |
| `--cv-text-4xl` | 36px | 40px (1.11) | 2.25rem | Hero welcome display |
| `--cv-text-display` | 64px | 72px (1.12) | 4.00rem | Splash / landing metrics |

---

## 3. Spacing, Radii & Shadows

### 3.1 4px Spacing Grid
| Spacing Token | Pixels | Rem Value | Example Usage |
|---|---|---|---|
| `--cv-space-1` | 4px | 0.25rem | Icon margins, badge padding |
| `--cv-space-2` | 8px | 0.50rem | Compact button padding, input gap |
| `--cv-space-3` | 12px | 0.75rem | Standard card gap, form row spacing |
| `--cv-space-4` | 16px | 1.00rem | Container padding, list item gutters |
| `--cv-space-6` | 24px | 1.50rem | Grid gutter between book cards |
| `--cv-space-8` | 32px | 2.00rem | Section separation |
| `--cv-space-12`| 48px | 3.00rem | Large hero container margins |

### 3.2 Border Radius
- `--cv-radius-sm`: `4px` (Tags, code blocks)
- `--cv-radius`: `8px` (Inputs, standard buttons)
- `--cv-radius-md`: `10px` (Dropdown menus, tooltips)
- `--cv-radius-lg`: `14px` (Book cards, modal dialogues)
- `--cv-radius-xl`: `20px` (Pill badges, floating actions)
- `--cv-radius-full`: `9999px` (Avatars, status pills)

### 3.3 Shadows
- `--cv-shadow-sm`: `0 1px 3px rgba(0, 0, 0, 0.4)`
- `--cv-shadow`: `0 4px 12px rgba(0, 0, 0, 0.5)`
- `--cv-shadow-lg`: `0 8px 32px rgba(0, 0, 0, 0.6)`
- `--cv-shadow-glow`: `0 0 20px rgba(99, 102, 241, 0.20)` (Used for active reader indicators & focused cards)

---

## 4. Motion System & Micro-Interactions

### 4.1 Duration & Easing
All animated components respect standard durations to ensure snappy, non-sluggish interactions:
- **Micro (100ms)**: Toggle switches, button press scales (`active:scale-[0.98]`).
- **Fast (160ms)**: Dropdown menus opening, tooltips, badge additions.
- **Base (200ms)**: Modal backdrops, tab switches, sheet drawers.
- **Slow (320ms)**: Route cross-fades, card list re-order transitions.
- **Cinematic (480ms)**: Vault unlock sequence, hero intro.

```css
--cv-ease: cubic-bezier(0.4, 0, 0.2, 1);
--cv-ease-out: cubic-bezier(0, 0, 0.2, 1);
--cv-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 4.2 Reduced Motion Compliance
Whenever the operating system indicates `prefers-reduced-motion: reduce`:
- Animations collapse to 0ms or instant opacity dissolves.
- Transform scale and slide transitions are disabled entirely.

---

## 5. Responsive Layout & Breakpoints

```
[Mobile / Tablet Sheet]  < 768px (Bottom navigation bar, collapsible drawers)
[Desktop App Shell]     >= 768px (Persistent 220px sidebar, top header, multi-column grid)
```

| Breakpoint | Width | Shell Architecture | Grid Columns |
|---|---|---|---|
| `sm` | 640px | Bottom Navigation (60px high) | 2 columns |
| `md` | 768px | Collapsed Sidebar (icon-only, 64px) | 3 columns |
| `lg` | 1024px | Full Sidebar (220px) | 4 to 5 columns |
| `xl` | 1280px | Full Sidebar + Context Inspector Drawer | 6 columns |
| `2xl`| 1536px | Widescreen high-density reader view | 7 to 8 columns |

---

## 6. Skeletons, Loading & Empty States

### 6.1 Loading Skeletons
To eliminate layout shifts (Cumulative Layout Shift = 0):
- **Book Cover Skeleton**: Has a fixed 3:4 aspect ratio (`aspect-[3/4]`) with a pulsing gradient:
  ```css
  background: linear-gradient(90deg, #18181b 0%, #27272a 50%, #18181b 100%);
  background-size: 200% 100%;
  animation: pulse 1.5s ease-in-out infinite;
  ```
- **Text Lines**: Emulate title and metadata using rounded bars (`h-4 w-3/4 bg-zinc-800 rounded`).

### 6.2 Empty States
Every empty state MUST contain:
1. **Icon**: Monochromatic semantic icon wrapped in an elevated circle (`bg-zinc-900 border border-white/5`).
2. **Title**: Direct statement ("No works in this shelf").
3. **Guidance**: Explanatory sentence ("Add books from the catalog or drop an EPUB/PDF file anywhere to import").
4. **Primary Action**: Single actionable button ("Add First Book", "Unlock Vault", "Clear Filters").

---

## 7. Accessibility Contract (WCAG 2.1 AA)

1. **Color Contrast**: All primary text (`--cv-text`) guarantees a minimum contrast ratio of `12.5:1` against `--cv-bg` and `9.8:1` against elevated surfaces. Muted text (`--cv-text-muted`) maintains at least `5.2:1` (exceeding the 4.5:1 requirement).
2. **Keyboard Navigation**:
   - `Tab` moves systematically between actionable elements.
   - `Cmd+K` or `Ctrl+K` summons the global Command Palette from any screen.
   - `J` and `K` / Arrow keys navigate book cards in grid and list views.
   - `Space` toggles play/pause in readers or opens quick inspector.
   - `Esc` closes modals, inspectors, and command palette.
3. **Screen Readers**:
   - Every icon button has an `aria-label`.
   - Modals trap focus and specify `role="dialog"` with `aria-labelledby`.
   - Dynamic updates emit messages to an `aria-live="polite"` region.
