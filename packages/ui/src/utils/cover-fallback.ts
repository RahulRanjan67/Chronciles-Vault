/**
 * Deterministic cover fallback generator.
 * Given a work title, produces a stable hue, gradient, and initials.
 * Same title → same color every load (no random).
 */

/** djb2 hash of a string → stable integer */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) + hash + char; // hash * 33 + c
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/** Midnight Arcana hue ranges: astral indigo, deep violet, and mystic emerald */
const HUE_PALETTES = [
  { hue: 235, sat: 58, light: 36 }, // astral indigo
  { hue: 255, sat: 56, light: 36 }, // arcane violet
  { hue: 162, sat: 52, light: 32 }, // mystic emerald
  { hue: 270, sat: 54, light: 36 }, // starlight amethyst
  { hue: 222, sat: 55, light: 34 }, // midnight sapphire
  { hue: 285, sat: 50, light: 35 }, // deep nebula
] as const;

/** Parchment & Ink hue ranges: warm burnt sienna, sepia amber, wax crimson, and forest ink */
const PARCHMENT_PALETTES = [
  { hue: 28,  sat: 62, light: 36 }, // burnt amber-sienna
  { hue: 16,  sat: 58, light: 35 }, // terracotta ink
  { hue: 348, sat: 58, light: 34 }, // wax-seal crimson
  { hue: 38,  sat: 60, light: 35 }, // antique gold-ochre
  { hue: 152, sat: 42, light: 30 }, // scholarly forest ink
  { hue: 8,   sat: 55, light: 34 }, // chestnut rust
] as const;

/** Blossom Ascendant palette: exclusively warm wine-rose, sakura pink, coral, and imperial gold (zero blue/indigo/cool-violet) */
const XIANXIA_PALETTES = [
  { hue: 346, sat: 72, light: 40 }, // vibrant sakura rose
  { hue: 334, sat: 68, light: 38 }, // cherry blossom pink
  { hue: 355, sat: 68, light: 38 }, // velvet wine crimson
  { hue: 12,  sat: 66, light: 40 }, // warm coral petal
  { hue: 36,  sat: 72, light: 38 }, // imperial gold-amber
  { hue: 326, sat: 64, light: 38 }, // warm rose-magenta
] as const;

export interface CoverFallback {
  /** CSS gradient string for background */
  gradient: string;
  /** Short initials to display (1–2 chars) */
  initials: string;
  /** Primary hue (0–360) */
  hue: number;
  /** CSS color string for text/icon on the gradient */
  textColor: string;
}

/**
  * Generate a deterministic cover fallback for a work.
  * @param title Work title
  * @param author Optional author for better differentiation
  * @param themeId Optional active theme ID for reactive theme switching
  */
export function generateCoverFallback(title: string, author?: string, themeId?: string): CoverFallback {
  const seed = title + (author ?? '');
  const hash = hashString(seed);

  const activeTheme =
    themeId ??
    (typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : null);
  const isXianxia = activeTheme === 'xianxia-realm';
  const isParchment = activeTheme === 'parchment-ink';
  const paletteList = isXianxia
    ? XIANXIA_PALETTES
    : isParchment
      ? PARCHMENT_PALETTES
      : HUE_PALETTES;
  const palette = paletteList[hash % paletteList.length]!;
  const hueVariation = (hash >> 8) % (isXianxia ? 10 : 16) - (isXianxia ? 5 : 8);
  const finalHue = (palette.hue + hueVariation + 360) % 360;

  const gradient = [
    `hsl(${finalHue}, ${palette.sat}%, ${palette.light + 8}%)`,
    `hsl(${(finalHue + (isXianxia ? 10 : 20)) % 360}, ${palette.sat - 8}%, ${palette.light - 6}%)`,
  ];

  // Extract initials from title
  const words = title.trim().split(/\s+/).filter(Boolean);
  let initials: string;
  if (words.length === 0) {
    initials = '?';
  } else if (words.length === 1) {
    initials = (words[0]![0] ?? '?').toUpperCase();
  } else {
    initials = ((words[0]![0] ?? '') + (words[words.length - 1]![0] ?? '')).toUpperCase();
  }

  return {
    gradient: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
    initials,
    hue: finalHue,
    textColor: `hsl(${finalHue}, 20%, 90%)`,
  };
}

/**
 * Returns just the CSS gradient string — useful for inline styles.
 */
export function getCoverGradient(title: string, author?: string): string {
  return generateCoverFallback(title, author).gradient;
}
