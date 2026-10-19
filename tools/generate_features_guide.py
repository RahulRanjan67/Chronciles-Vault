# -*- coding: utf-8 -*-
"""
Script to generate the enhanced FeaturesGuide.tsx for Grimoire.
- Increases from 32 to 52 features & variants covering every system.
- Completely removes all feature numbering (#01, number property, etc.).
- Adds a full comprehensive interactive FAQ section with category filters and accordion search.
- Architectural Blueprints with 1-click 'Try in App' buttons.
"""

FEATURES_GUIDE_CONTENT = r'''import * as React from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  DoorOpen,
  ExternalLink,
  Film,
  Filter,
  FolderKanban,
  GitMerge,
  Globe,
  HardDrive,
  HelpCircle,
  Image as ImageIcon,
  KeyRound,
  Layers,
  Lock,
  Maximize2,
  MessageSquare,
  Monitor,
  Palette,
  Play,
  Radar,
  RotateCcw,
  Search,
  Shield,
  Smartphone,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

export interface FeatureStepItem {
  readonly id: string;
  readonly category:
    | "room-themes"
    | "library-views"
    | "work-detail"
    | "sources-video"
    | "reader-shelf"
    | "return-desk"
    | "memory-lore"
    | "radar-merge"
    | "vault-backup";
  readonly categoryLabel: string;
  readonly title: string;
  readonly subtitle: string;
  readonly whyItMatters: string;
  readonly routePath: string;
  readonly shortcutOrBadge: string;
  readonly steps: readonly string[];
  readonly screenshotCaption: string;
  readonly wireframeHighlights: readonly string[];
}

export interface FaqItem {
  readonly id: string;
  readonly category:
    | "Account & Profiles"
    | "Security & Privacy"
    | "Readers & Media"
    | "Adaptations & Graph"
    | "Notes vs Memories"
    | "Portals & Passwords"
    | "Data & Portability"
    | "Platforms & Storage";
  readonly question: string;
  readonly answer: string;
  readonly highlights: readonly string[];
}

const ALL_TINY_FEATURES: readonly FeatureStepItem[] = [
  // 1. SANCTUM ROOM & ATMOSPHERIC THEMES
  {
    id: "room-preloader-profiles",
    category: "room-themes",
    categoryLabel: "Sanctum Room & Themes",
    title: "Interactive Sanctum Room Preloader & Atmospheric Desk Lamp",
    subtitle: "Instant-load architectural reading room with background session hydration and kinetic desk lighting.",
    whyItMatters:
      "Your Room is your personal reading sanctuary. Instead of staring at a blank white spinner while thousands of chapters hydrate, the Room opens in under 30ms with interactive 3D lighting while your session loads smoothly in the background.",
    routePath: "/home",
    shortcutOrBadge: "Homepage / Lobby",
    steps: [
      "Open Grimoire to land immediately inside the animated Sanctum Room lobby.",
      "Move your cursor across the room to tilt the 3D bookshelves and aim the volumetric desk lamp.",
      "Click the Desk Lamp shade to cycle warm ambient light intensity while background hydration completes.",
      "Use the Active Room Profile switcher to switch between profiles or create a custom room profile.",
      "Click 'Enter My Room' (or press Enter) once hydration completes to trigger the iris reveal into your workspace.",
    ],
    screenshotCaption: "Sanctum Room Homepage with 3D Bookshelf Stage, Room Profile Switcher and Enter My Room CTA.",
    wireframeHighlights: ["3D Parallax Bookshelves", "00% to 100% Kinetic Telemetry", "Room Profile Selector", "Enter My Room CTA"],
  },
  {
    id: "multi-profile-reading-rooms",
    category: "room-themes",
    categoryLabel: "Sanctum Room & Themes",
    title: "Multi-Profile Reading Room Switcher & Custom Sanctum Creator",
    subtitle: "Maintain independent isolated reading environments for light fiction, scholarly research, or midnight binges.",
    whyItMatters:
      "Avoid mixing work-related technical PDF documentation with escapist Korean cultivation novels. Each room preserves its own theme, active shelf state, and focal accent.",
    routePath: "/home",
    shortcutOrBadge: "Lobby Switcher",
    steps: [
      "From the Sanctum Title Screen, click the Room dropdown in the top control bar.",
      "Select an existing room profile or click '+ Create Room Profile'.",
      "Assign a custom room title, personal motto, and aesthetic theme preference.",
      "Enter the room—all workspace filters and layout preferences isolate to this room profile.",
    ],
    screenshotCaption: "Room Profile Selector modal with custom title, aesthetic motto, and theme assignment.",
    wireframeHighlights: ["Independent Room Profiles", "Custom Motto & Title", "Per-Profile Layout Cache"],
  },
  {
    id: "three-distinct-themes",
    category: "room-themes",
    categoryLabel: "Sanctum Room & Themes",
    title: "Three Hand-Crafted Atmospheric Themes (Zero Color Bleed)",
    subtitle: "Switch live between Midnight Arcana, Parchment & Ink, and Blossom Ascendant.",
    whyItMatters:
      "Reading a dark cultivation novel at 2 AM requires a completely different visual atmosphere than daytime light novel annotation. Each theme re-tunes 45+ CSS design tokens and deterministic book cover palettes.",
    routePath: "/settings",
    shortcutOrBadge: "Header Palette Icon",
    steps: [
      "Click the Theme Switcher icon in the top-right header bar from any screen (or open Settings → Appearance).",
      "Select 'Midnight Arcana' for deep obsidian-blue and astral indigo highlights.",
      "Select 'Parchment & Ink' for warm sunlit vellum paper, burnt sienna accents, and espresso ink typography.",
      "Select 'Blossom Ascendant' for velvet wine-rose nights, sakura coral-pink highlights, and imperial gold accents (strictly warm, zero cold blue).",
    ],
    screenshotCaption: "Theme Switcher dropdown and side-by-side comparison of Midnight Arcana, Parchment & Ink, and Blossom Ascendant.",
    wireframeHighlights: ["Midnight Arcana (#060913)", "Parchment & Ink (#f7f1e3)", "Blossom Ascendant (#1c070e)", "Per-Theme Cover Palettes"],
  },
  {
    id: "iris-clip-path-reveal",
    category: "room-themes",
    categoryLabel: "Sanctum Room & Themes",
    title: "Iris Clip-Path Workspace Reveal & Fullscreen Zen Mode",
    subtitle: "Cinematic circular portal transition from the Sanctum title screen into your library, with F11 Zen mode.",
    whyItMatters:
      "Creates an immersive boundary between the distraction-heavy desktop OS and your tranquil reading haven.",
    routePath: "/home",
    shortcutOrBadge: "Enter Room / F11",
    steps: [
      "Click 'Enter My Room' on the Title Screen to witness the concentric iris expander transition.",
      "Press F11 at any time while reading to enter borderless distraction-free Zen mode.",
      "Header and navigation bars smoothly slide away, maximizing content visibility and typographic elegance.",
    ],
    screenshotCaption: "Iris clip-path circular reveal expanding outward from the desk lamp focal center.",
    wireframeHighlights: ["GPU Radial Mask", "Zero Screen Jitter", "Borderless F11 Zen Mode"],
  },
  {
    id: "three-way-first-time-landing",
    category: "room-themes",
    categoryLabel: "Sanctum Room & Themes",
    title: "Three-Way First-Time Landing Portal: Sign Up, Sign In, or Import .gca",
    subtitle: "Clean entry architecture with zero default seed clutter for fresh visitors and returning readers.",
    whyItMatters:
      "New visitors are never surprised by demo accounts or mock libraries. You choose immediately whether to start a brand new profile, sign in, or restore a full .gca archive.",
    routePath: "/home",
    shortcutOrBadge: "First-Time Landing UI",
    steps: [
      "Arrive at the Sanctum Lobby as a first-time or logged-out reader.",
      "Choose from the three prominent styled entry cards: Sign Up, Sign In, or Import .gca File.",
      "Card 1 (Sign Up): Choose your username, optional email ID, theme, or click 'Continue with Google'.",
      "Card 2 (Sign In): Pick any saved local profile or enter your existing credentials.",
      "Card 3 (Import .gca): Drop your backup archive to restore your complete library and jump straight into your room.",
    ],
    screenshotCaption: "Three-Way Landing Screen with Sign Up, Sign In, and Import .gca File cards.",
    wireframeHighlights: ["3 Distinct Styled Cards", "Zero Demo User Fallbacks", "1-Click .gca Drag & Drop"],
  },
  {
    id: "multi-provider-authentication",
    category: "room-themes",
    categoryLabel: "Sanctum Room & Themes",
    title: "Multi-Provider Authentication: Local Identity, Email ID & Google Sign-In",
    subtitle: "Flexible account creation supporting offline zero-telemetry profiles as well as cloud-synced accounts.",
    whyItMatters:
      "Choose the exact balance of convenience and privacy you desire: 100% offline anonymous room profiles or synchronized Google/Email login.",
    routePath: "/home",
    shortcutOrBadge: "Sign In / Sign Up Modal",
    steps: [
      "Click 'Sign Up' or 'Sign In' from the Sanctum landing portal.",
      "Select 'Continue with Google' for one-click seamless identity integration.",
      "Alternatively, enter your Email ID and secure password for traditional credential management.",
      "Or simply pick a local nickname for a purely offline, zero-network sovereign vault identity.",
    ],
    screenshotCaption: "Authentication modal displaying Google Sign-In button, Email ID fields, and Local Offline Mode toggle.",
    wireframeHighlights: ["Continue with Google Button", "Email ID Validation", "Local Offline Identity"],
  },

  // 2. CORE LIBRARY & DUAL PERSPECTIVES
  {
    id: "library-grid-shelf",
    category: "library-views",
    categoryLabel: "Library & Shelves",
    title: "Dual Perspective: Adaptive Cover Grid & Wooden Bookshelf View",
    subtitle: "Toggle between a fluid responsive cover grid and an architectural wooden bookshelf with realistic spine heights.",
    whyItMatters:
      "Grid view is optimized for rapid multi-column scanning across hundreds of titles, while Shelf view recreates the visceral sensation of standing before your real physical bookcase.",
    routePath: "/library",
    shortcutOrBadge: "Ctrl+1 (Grid) / Ctrl+2 (Shelf)",
    steps: [
      "Open your Library (/library).",
      "Use the View Toggle in the top toolbar to switch between Grid View and Shelf View.",
      "In Shelf View, notice dynamic spine thicknesses reflecting work chapter counts and realistic oak shelf lighting.",
      "Hover over any cover or spine to reveal the floating Quick-Action HUD.",
    ],
    screenshotCaption: "Library Shelf View showing oak wood grain shelves, varied book spine heights, and status badges.",
    wireframeHighlights: ["Adaptive Cover Grid", "Oak Bookshelf Spines", "Dynamic Height Ratios", "Keyboard View Toggles"],
  },
  {
    id: "dense-table-view",
    category: "library-views",
    categoryLabel: "Library & Shelves",
    title: "Dense Metadata Table View with Column Sizing & Multi-Sort",
    subtitle: "Spreadsheet-grade data density with resizable columns, inline chapter progress editing, and quick status pills.",
    whyItMatters:
      "When managing collections of 1,000+ web novels or manga, seeing chapter progress, rating, last-read dates, and tags in a compact table accelerates triage.",
    routePath: "/library",
    shortcutOrBadge: "Ctrl+3 (Dense Table)",
    steps: [
      "In the Library toolbar, click the Dense Table icon.",
      "Click any column header (Title, Medium, Progress, Rating, Updated) to sort ascending or descending.",
      "Click directly on a Progress cell to edit your current chapter number inline without opening the full dossier.",
      "Click any tag pill in the table to filter your library by that tag immediately.",
    ],
    screenshotCaption: "Dense Table View showing tabular work rows, inline progress editor, and compact status pills.",
    wireframeHighlights: ["Compact Row Density", "Inline Chapter Edits", "Multi-Column Sorting", "1-Click Tag Filters"],
  },
  {
    id: "reading-status-lifecycle",
    category: "library-views",
    categoryLabel: "Library & Shelves",
    title: "Five-Stage Reading Status Lifecycle Engine",
    subtitle: "Track works accurately across Plan to Read, Currently Reading, On Hold, Completed, and Dropped.",
    whyItMatters:
      "Prevents your backlog from rotting in ambiguity. Every work has a clear intentional lifecycle stage with dedicated quick-filters and progress velocity.",
    routePath: "/library",
    shortcutOrBadge: "Status Tabs",
    steps: [
      "Use the status tab bar at the top of the Library to filter by Reading, Plan to Read, On Hold, Completed, or Dropped.",
      "Change any work's status with one click from its card HUD or the Work Detail header.",
      "Works marked 'Completed' unlock celebration confetti and celebratory completion cards.",
      "Works marked 'On Hold' automatically record hiatus duration to prompt you when you return.",
    ],
    screenshotCaption: "Library status tab bar with item counts per status and active Reading tab highlighted.",
    wireframeHighlights: ["5 Discrete States", "Unread Count Badges", "Hiatus Time Calculation", "Completion Milestones"],
  },
  {
    id: "realtime-fuzzy-search",
    category: "library-views",
    categoryLabel: "Library & Shelves",
    title: "Multi-Field Real-Time Fuzzy Search & Instant Query Parsing",
    subtitle: "Sub-millisecond fuzzy search matching across English titles, romanized aliases, authors, and user notes.",
    whyItMatters:
      "Never lose a work because you only remember its Korean romanization or an abbreviation like 'SL' or 'LOTM'.",
    routePath: "/library",
    shortcutOrBadge: "/ or Ctrl+K",
    steps: [
      "Press '/' or 'Ctrl+K' from anywhere in Grimoire to focus the omni-search input.",
      "Type any partial title, author, or keyword (e.g. 'shadow', 'regression', 'ch. 100').",
      "Results filter instantly in memory with highlighted fuzzy substring matches.",
      "Press Enter to open the top matched work or Esc to clear.",
    ],
    screenshotCaption: "Omni-search bar with real-time fuzzy match dropdown and highlighted title fragments.",
    wireframeHighlights: ["Sub-millisecond Scoring", "Romanized Alias Matching", "Instant Keyword Clearing"],
  },
  {
    id: "multi-tag-category-filter",
    category: "library-views",
    categoryLabel: "Library & Shelves",
    title: "Multi-Tag, Custom Category & Medium Filter Engine",
    subtitle: "Intersect multiple tags with AND/OR logic, filter by medium (Novel, Manhwa, Anime), and select custom shelves.",
    whyItMatters:
      "Find exactly what you want to read right now (e.g., 'Web Novel' + 'Time Loop' + 'Dao Heart' + 'Rating >= 9.0') in seconds.",
    routePath: "/library",
    shortcutOrBadge: "Filter Drawer",
    steps: [
      "Click the 'Filters' button in the Library toolbar to expand the multi-faceted filter drawer.",
      "Toggle Medium badges (Web Novel, Light Novel, Manga, Manhwa, Manhua, Anime, Western).",
      "Click one or more tag chips to narrow down works containing all selected tags.",
      "Combine with rating sliders or category pills to pinpoint specific subsections of your collection.",
    ],
    screenshotCaption: "Library Filter Drawer showing Medium chips, Tag cloud, and Category selection pills.",
    wireframeHighlights: ["Multi-Tag Intersection", "Medium Toggle Chips", "Rating Slider Filter", "1-Click Reset"],
  },
  {
    id: "smart-sorting-matrix",
    category: "library-views",
    categoryLabel: "Library & Shelves",
    title: "Smart Sorting Matrix (Pace, Recency, Title, Rating, Progress)",
    subtitle: "Sort your collection by Reading Recency, Chapter Progress %, User Rating, Title A-Z, or Release Date.",
    whyItMatters:
      "Quickly surface what you read yesterday, find titles closest to completion, or review your highest-rated masterpieces.",
    routePath: "/library",
    shortcutOrBadge: "Sort Dropdown",
    steps: [
      "Click the 'Sort by' dropdown in the Library header.",
      "Choose 'Recently Read' to keep your active binge front and center.",
      "Choose 'Progress %' to find works that are 90%+ completed and ready for a finale push.",
      "Choose 'Rating' to showcase your personal hall-of-fame favorites.",
    ],
    screenshotCaption: "Sort dropdown menu open with options for Recently Read, Progress %, Rating, and Title A-Z.",
    wireframeHighlights: ["5 Dynamic Sort Criteria", "Ascending / Descending Toggle", "Persistent Sort Preference"],
  },
  {
    id: "bulk-batch-actions",
    category: "library-views",
    categoryLabel: "Library & Shelves",
    title: "Bulk Multi-Select & Batch Operation Bar",
    subtitle: "Select multiple works to batch-assign tags, move into the Private Vault, update reading status, or export.",
    whyItMatters:
      "Editing 50 works one-by-one is tedious. The floating Bulk Action bar lets you reorganize large collections with a single click.",
    routePath: "/library",
    shortcutOrBadge: "Select Checkbox",
    steps: [
      "Hover over any work card and check the selection checkbox in the top-left corner.",
      "Select additional works or click 'Select All' in the floating bottom action bar.",
      "Choose a bulk action: 'Add Tag', 'Change Status', 'Move to Vault', 'Export Selected', or 'Delete'.",
      "Confirm the operation—all selected works update in a single atomic storage transaction.",
    ],
    screenshotCaption: "Floating bottom Bulk Action bar with count badge and buttons for Tag, Status, Vault, and Export.",
    wireframeHighlights: ["Floating Atomic HUD", "Multi-Select Checkboxes", "Atomic Batch Commit", "Select All Toggle"],
  },
  {
    id: "discover-recommendations",
    category: "library-views",
    categoryLabel: "Library & Shelves",
    title: "Discover Engine: Trope Spotlights & Reading Taste Affinity Clusters",
    subtitle: "Explore curated recommendations matched against your favorite genres, tags, and completed masterpieces.",
    whyItMatters:
      "Surfaces high-affinity titles based on the exact tropes, pacing, and mediums you actually enjoy and finish.",
    routePath: "/discover",
    shortcutOrBadge: "Sidebar → Discover",
    steps: [
      "Open 'Discover' (/discover) from the main navigation sidebar.",
      "Browse taste-matched clusters such as 'Regression & Second Chances' or 'Cultivation Heavens'.",
      "Inspect why a work is recommended based on your reading history.",
      "Click '+ Add to Library' or '+ Send to Radar' on any recommendation card to capture it immediately.",
    ],
    screenshotCaption: "Discover route showing taste-matched fiction recommendations and trope clusters.",
    wireframeHighlights: ["Affinity Scoring", "Trope Spotlights", "1-Click Add to Library / Radar"],
  },

  // 3. WORK DOSSIER & TAXONOMY
  {
    id: "work-dossier-header-hud",
    category: "work-detail",
    categoryLabel: "Work Dossier & Taxonomy",
    title: "Comprehensive Work Dossier & Header Quick-Action HUD",
    subtitle: "Cinematic cover backdrop, chapter counter, quick status toggles, star ratings, and action controls.",
    whyItMatters:
      "Centralizes everything about a work into one cohesive dossier—reading progress, alternative titles, sources, memories, and relations.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Work Detail View",
    steps: [
      "Click any work in your Library to open its comprehensive dossier page.",
      "Adjust your chapter progress using the quick increment (+ / -) buttons or type directly in the chapter input.",
      "Rate the work from 1 to 10 stars with fractional half-star support.",
      "Toggle reading status directly from the header status dropdown.",
    ],
    screenshotCaption: "Work Dossier header with blurred cover ambient glow, chapter stepper, and rating stars.",
    wireframeHighlights: ["Ambient Cover Glow", "Quick Chapter Stepper", "1-10 Star Rating", "Status Quick-Select"],
  },
  {
    id: "multilingual-aliases",
    category: "work-detail",
    categoryLabel: "Work Dossier & Taxonomy",
    title: "Multilingual Titles & Romanized Alias Directory",
    subtitle: "Store English, Korean Hangul, Japanese Kanji, Pinyin, and community abbreviations per work.",
    whyItMatters:
      "Web novels and manga are discussed under dozens of names across platforms. Storing aliases ensures you can search under any name.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Work Detail → Aliases",
    steps: [
      "On the Work Detail page, view the alternative titles and aliases listed below the primary title.",
      "Click '+ Add Alias' to add romanizations, native script, or abbreviations.",
      "Set any alias as the primary display title if preferred.",
      "All aliases become immediately searchable in the global omni-search.",
    ],
    screenshotCaption: "Aliases panel on Work Detail displaying Korean Hangul, romanized title, and acronym tags.",
    wireframeHighlights: ["Multi-Language Script Support", "Community Acronym Storage", "Omni-Search Indexing"],
  },
  {
    id: "content-warnings-ratings",
    category: "work-detail",
    categoryLabel: "Work Dossier & Taxonomy",
    title: "Content Warnings, Age Ratings & Spoilers Disclosure",
    subtitle: "Tag sensitive themes (Gore, Psychological Trauma, Sexual Content) with discreet blur toggles.",
    whyItMatters:
      "Allows you to track mature or psychologically intense works without accidentally exposing shocking cover art or summaries in public.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Work Detail → Metadata",
    steps: [
      "On the Work Detail page, scroll to the Content Warnings section.",
      "Tag applicable warnings (e.g. Graphic Violence, Body Horror, Dark Fantasy).",
      "Enable 'Blur Cover in Public' if the work contains NSFW or provocative illustration.",
      "The card will display a discreet warning badge requiring a click to reveal.",
    ],
    screenshotCaption: "Content Warnings editor with warning chips, blur toggle, and age rating badge.",
    wireframeHighlights: ["Discreet Content Warnings", "Public Cover Blur Toggle", "Age Rating Selector"],
  },
  {
    id: "custom-taxonomy-categories",
    category: "work-detail",
    categoryLabel: "Work Dossier & Taxonomy",
    title: "Custom Taxonomy & Dynamic Category Assignment",
    subtitle: "Assign works to your personal shelves like 'Comfort Binge', 'Peak Fiction', or 'Cultivation Lore'.",
    whyItMatters:
      "Standard publisher genres don't capture how readers actually think. Custom categories let you structure your library your way.",
    routePath: "/categories",
    shortcutOrBadge: "Work Detail → Categories",
    steps: [
      "Open any Work Detail page and locate the Category selector.",
      "Check one or more custom categories you've created.",
      "To create a new category, visit '/categories' and define a name, accent color, and description.",
      "Browse all works inside any category with a single click.",
    ],
    screenshotCaption: "Category assignment panel showing custom category pills with color-coded dot badges.",
    wireframeHighlights: ["Custom Shelf Taxonomy", "Color-Coded Badges", "Multi-Category Assignment"],
  },
  {
    id: "customizable-tags-taxonomy",
    category: "work-detail",
    categoryLabel: "Work Dossier & Taxonomy",
    title: "Rich Tropes & Hierarchical Tagging with Custom Color Badges",
    subtitle: "Create and color-code micro-trope tags (System Apocalypse, Weak to Strong, Female Lead, Regression).",
    whyItMatters:
      "Fiction readers navigate by tropes. Rich tags allow you to filter across deeply specific thematic archetypes.",
    routePath: "/library",
    shortcutOrBadge: "Work Detail → Tags",
    steps: [
      "On any Work Detail page, type into the Tag input to add or create new tags.",
      "Assign custom background colors to prominent tags (e.g. Gold for 'Masterpiece', Red for 'Hiatus Warning').",
      "Click any tag chip anywhere in the app to immediately filter your entire library by that trope.",
    ],
    screenshotCaption: "Tag editor with color-picker dropdown and live tag preview chips.",
    wireframeHighlights: ["Arbitrary Trope Creation", "Custom Color Assignments", "Instant Library Cross-Filtering"],
  },
  {
    id: "fandom-wiki-links-panel",
    category: "work-detail",
    categoryLabel: "Work Dossier & Taxonomy",
    title: "Curated Fandom, Wiki, Subreddit & Community Links Panel",
    subtitle: "Save trusted character wikis, chapter discussion threads, official socials, and art galleries per work.",
    whyItMatters:
      "Keeps all community resources, tier lists, and official author links organized right inside the work's dossier for easy reference.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Work Detail → Fandom Tab",
    steps: [
      "Open a Work Detail page and switch to the 'Fandom & Links' tab.",
      "Click '+ Add Fandom Link' and choose a category (Wiki, Reddit, Discord, Official Author, Fan Art).",
      "Add a title, URL, and optional spoiler warning note if a wiki contains end-of-series revelations.",
      "Click any link to launch external resources in a secure sandboxed tab.",
    ],
    screenshotCaption: "Work Detail Fandom & Links tab with categorized community resources and spoiler tags.",
    wireframeHighlights: ["Categorized External Links", "Spoiler Warning Annotations", "Quick External Launch"],
  },

  // 4. ACCESS PATHS & READING PORTALS
  {
    id: "multi-source-access-paths",
    category: "sources-video",
    categoryLabel: "Sources & Portals",
    title: "Multi-Source Access Paths with Priority Ordering",
    subtitle: "Store official web URLs, backup mirror links, raw scanlation sites, and local file paths per work.",
    whyItMatters:
      "Web reading sites constantly change URLs, get DMCA'd, or move domains. Grimoire ensures you never lose access by supporting unlimited fallback mirrors.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Work Detail → Access Paths",
    steps: [
      "Navigate to the 'Access Paths' tab on any Work Detail page.",
      "Click '+ Add Access Path' to add a source (e.g. Official Publisher, Scanlation Group, Backup Mirror, Local EPUB).",
      "Set the Source Type (Web URL, File Path, App Deep Link).",
      "The primary source launches with 1-click from the library card or 'Read Now' button.",
    ],
    screenshotCaption: "Access Paths panel showing multiple mirrors, status indicators, and primary source star.",
    wireframeHighlights: ["Unlimited Fallback Mirrors", "Local File & Web URL Support", "Primary Source Star Toggle"],
  },
  {
    id: "dynamic-source-priority",
    category: "sources-video",
    categoryLabel: "Sources & Portals",
    title: "Dynamic Source Priority Ordering & Primary Target Toggling",
    subtitle: "Drag and drop or toggle access paths so your preferred translation group or mirror is always prioritized.",
    whyItMatters:
      "When one translation group catches up or another mirror goes down, swap primary priority in two seconds without editing bookmarks.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Drag / Priority Toggle",
    steps: [
      "In the Access Paths list, click the star icon on any mirror to set it as the Primary access path.",
      "Use the up/down priority controls to reorder fallback sources.",
      "Whenever you click 'Continue Reading', Grimoire automatically opens the highest-priority functional source.",
    ],
    screenshotCaption: "Access Paths reordering controls with visual primary highlight badge.",
    wireframeHighlights: ["1-Click Primary Star", "Ordered Fallback Chain", "Automatic Target Resolution"],
  },
  {
    id: "source-health-monitoring",
    category: "sources-video",
    categoryLabel: "Sources & Portals",
    title: "Source Health Monitoring & Broken Mirror Alerts",
    subtitle: "Mark mirrors as Healthy, Slow, Broken, or Paywalled to keep your access pathways reliable.",
    whyItMatters:
      "Visual indicators alert you if a scanlation mirror has died, prompting you to switch to a secondary mirror before sitting down to read.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Health Pill Badges",
    steps: [
      "In the Access Paths list, inspect the color-coded health pill on each path (Green = Healthy, Amber = Slow, Red = Down).",
      "Click the health badge to manually flag a source as broken or dead.",
      "Grimoire will automatically promote your next backup mirror to active duty.",
    ],
    screenshotCaption: "Source Health indicators with status badges and fallback transition warnings.",
    wireframeHighlights: ["Visual Health Indicators", "Dead Link Flagging", "Automated Fallback Promotion"],
  },
  {
    id: "embedded-web-reader",
    category: "sources-video",
    categoryLabel: "Sources & Portals",
    title: "Embedded Web Reader Frame & External Browser Launcher",
    subtitle: "Read online chapters inside a distraction-free embedded frame or launch directly in your default browser.",
    whyItMatters:
      "Gives you total freedom: read right inside Grimoire for focused immersion, or pop out to your external browser for full extensions.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Reader Frame Toggle",
    steps: [
      "Click 'Read Online' on any work with a valid web access path.",
      "Choose 'Embedded Frame' to open the website inside Grimoire with a persistent chapter progress tracker overlay.",
      "Or choose 'Open in Browser' to launch the URL externally while Grimoire stays running in the background.",
    ],
    screenshotCaption: "Embedded reader modal showing web chapter view with floating Grimoire progress bar.",
    wireframeHighlights: ["Embedded Webview Frame", "Floating Progress Tracker", "External Browser Pop-Out"],
  },
  {
    id: "reading-website-credentials-keyring",
    category: "sources-video",
    categoryLabel: "Sources & Portals",
    title: "Encrypted Reading Portals & Website Credential Keyring",
    subtitle: "Secure zero-knowledge storage for reading website usernames, passwords, search URLs, and provider notes.",
    whyItMatters:
      "Web novel and manga sites require accounts for bookmarks, VIP chapters, and forum comments. Grimoire stores your logins encrypted on your device so you never forget them.",
    routePath: "/vault",
    shortcutOrBadge: "Vault → Keyring Panel",
    steps: [
      "Open the Private Vault or Settings and navigate to the 'Website Credential Keyring'.",
      "Click '+ Add Website Login' and enter the Website Name, Domain URL, Username, Password, and Search URL.",
      "Click the Eye icon to view password, or click Copy to place your username or password on the clipboard.",
      "All credentials are encrypted with AES-256-GCM using your Vault Passphrase and never leave your machine.",
    ],
    screenshotCaption: "Reading Portals & Credentials Keyring showing stored website logins and quick-copy buttons.",
    wireframeHighlights: ["Zero-Knowledge AES-256 Storage", "1-Click Copy Username / Password", "Search URL Integration"],
  },
  {
    id: "frequent-websites-auto-detection",
    category: "sources-video",
    categoryLabel: "Sources & Portals",
    title: "Automatic Frequent Reading Websites Analyzer",
    subtitle: "Scans your library access paths and automatically highlights any reading portal with 5 or more linked works.",
    whyItMatters:
      "Automatically identifies your most-visited web novel and manga websites, giving you instant one-click homepage access and catalog search.",
    routePath: "/vault",
    shortcutOrBadge: "Keyring → Frequent Sites",
    steps: [
      "Open the Website Credential Keyring in the Private Vault.",
      "Notice the 'Frequent Reading Portals' banner at the top of the panel.",
      "Grimoire scans all work access paths; any domain with 5 or more works is automatically featured with its work count badge.",
      "Click 'Visit Homepage' or 'Search Catalog' to launch directly to your favorite portals.",
    ],
    screenshotCaption: "Frequent Reading Websites section displaying website badges with work count indicators.",
    wireframeHighlights: ["Automated 5+ Work Threshold", "Domain Aggregator", "1-Click Catalog Search"],
  },

  // 5. DEDICATED BUILT-IN READERS & MEDIA PLAYERS
  {
    id: "builtin-epub-reader",
    category: "reader-shelf",
    categoryLabel: "Readers & Media",
    title: "Built-in Local EPUB Reader with Chapter TOC & Theme Sync",
    subtitle: "Zero-dependency offline EPUB reader with font sizing, line height controls, theme sync, and page bookmarks.",
    whyItMatters:
      "No need to launch bloated external reader apps. Read light novels and web fiction EPUBs directly inside Grimoire with synchronized dark/light themes.",
    routePath: "/reader/epub",
    shortcutOrBadge: "EPUB Reader Route",
    steps: [
      "Attach an EPUB file to any work's Access Paths, or navigate to '/reader/epub'.",
      "Click 'Open EPUB' to load the book into the native renderer.",
      "Open the Table of Contents drawer to jump across chapters seamlessly.",
      "Adjust typography (Serif, Sans, Monospace, Font Size, Line Spacing) to match your reading comfort.",
      "Your exact CFI reading position is automatically saved to your work's progress.",
    ],
    screenshotCaption: "Native EPUB Reader showing two-column typography, chapter TOC sidebar, and theme controls.",
    wireframeHighlights: ["Offline EPUB Rendering", "TOC Chapter Navigation", "Typography Controls", "Auto CFI Progress Save"],
  },
  {
    id: "builtin-pdf-viewer",
    category: "reader-shelf",
    categoryLabel: "Readers & Media",
    title: "Built-in Local PDF Viewer with Zoom, Dual-Page Spread & Bookmarks",
    subtitle: "High-performance canvas PDF rendering with continuous vertical scroll, dual-page mode, and page jumping.",
    whyItMatters:
      "Ideal for translated light novels, art books, and technical manuscripts. Renders crisp vector text with instant page memory.",
    routePath: "/reader/pdf",
    shortcutOrBadge: "PDF Viewer Route",
    steps: [
      "Attach a local PDF file or open the PDF Reader route (/reader/pdf).",
      "Select a PDF document to render high-resolution canvas pages.",
      "Toggle between Single Page, Continuous Scroll, and Dual-Page Spread modes.",
      "Use the zoom slider or preset buttons (Fit Width, Fit Page) for optimal readability.",
      "Your last-viewed page is saved automatically to your work progress.",
    ],
    screenshotCaption: "PDF Viewer showing continuous scroll mode, zoom controls, and thumbnail sidebar.",
    wireframeHighlights: ["Canvas Vector Rendering", "Dual-Page & Continuous Modes", "Fit Width / Fit Page Zoom", "Page Memory"],
  },
  {
    id: "comic-webtoon-reader",
    category: "reader-shelf",
    categoryLabel: "Readers & Media",
    title: "Comic & Webtoon Continuous Vertical Scroll Strip Reader",
    subtitle: "Optimized infinite vertical scroll for Korean manhwa and webtoons with zero seam gaps and image preload.",
    whyItMatters:
      "Webtoons are designed to be scrolled continuously without page breaks. Grimoire stitches vertical strips seamlessly with background image caching.",
    routePath: "/reader/comic",
    shortcutOrBadge: "Webtoon Mode",
    steps: [
      "Open a manhwa or comic work and launch the Comic Reader.",
      "Switch to 'Webtoon Vertical' mode for seamless continuous scroll with zero image margins.",
      "Use keyboard arrows, mouse wheel, or touch drag to glide down chapters smoothly.",
      "The reader automatically triggers progress saves as you cross chapter boundary markers.",
    ],
    screenshotCaption: "Webtoon reader interface displaying seamless vertical manhwa strip scrolling and bottom HUD.",
    wireframeHighlights: ["Zero-Seam Image Stitching", "Smooth Kinetic Scroll", "Chapter Boundary Detection"],
  },
  {
    id: "local-audiobook-player",
    category: "reader-shelf",
    categoryLabel: "Readers & Media",
    title: "Local Audiobook & Audio Drama Player with Sleep Timer & Variable Speed",
    subtitle: "Play local MP3, M4B, WAV, and audio drama tracks with playback speeds from 0.5x to 2.5x and auto-sleep timer.",
    whyItMatters:
      "Listen to professionally narrated light novels or audio drama adaptations without switching apps, while keeping your chapter progress in sync.",
    routePath: "/reader/audio",
    shortcutOrBadge: "Audio Player HUD",
    steps: [
      "Attach a local audio file or folder to a work and click 'Play Audiobook'.",
      "Use the mini-player or expanded player to scrub through tracks and chapters.",
      "Adjust playback speed (0.75x, 1.0x, 1.25x, 1.5x, 2.0x) to match narrator velocity.",
      "Set the Sleep Timer (15m, 30m, 45m, End of Chapter) for bedtime listening.",
      "Playback position is saved to the second so you can resume anytime.",
    ],
    screenshotCaption: "Audiobook mini-player bar showing audio waveform, playback speed selector, and sleep timer.",
    wireframeHighlights: ["0.5x to 2.5x Variable Speed", "Configurable Sleep Timer", "Timestamp Precision Resume"],
  },
  {
    id: "local-video-anime-player",
    category: "reader-shelf",
    categoryLabel: "Readers & Media",
    title: "Local Video & Anime Player with Subtitle Support & Theater Mode",
    subtitle: "Play local MP4, MKV, and WebM anime episodes with subtitle track selection, theater mode, and timestamp resume.",
    whyItMatters:
      "When a light novel gets adapted into an anime, watch episodes right in Grimoire and track both novel chapters and anime episodes in one dossier.",
    routePath: "/reader/video",
    shortcutOrBadge: "Video Player Route",
    steps: [
      "Attach a local video file (e.g. Anime Episode 1) to a work and click 'Play Video'.",
      "Toggle Theater Mode or Fullscreen for an immersive cinematic experience.",
      "Enable or switch subtitle tracks (SRT / VTT).",
      "Grimoire saves your playback timestamp and increments your episode counter upon completion.",
    ],
    screenshotCaption: "Video player in theater mode with scrub bar, subtitle toggle, and episode progress pill.",
    wireframeHighlights: ["Theater Mode & Fullscreen", "Subtitle Track Support", "Episode Auto-Increment"],
  },

  // 6. UP NEXT & HIATUS RECOVERY
  {
    id: "up-next-central-command",
    category: "return-desk",
    categoryLabel: "Up Next & Hiatus",
    title: "Up Next Central Command: Quick-Resume Queue & Pacing Center",
    subtitle: "Your active reading cockpit (rebranded from Return Desk) surfacing top active works, unread deltas, and pace stats.",
    whyItMatters:
      "When you sit down to read, you shouldn't have to search through your entire library. Up Next puts your top 3-5 active books one click away.",
    routePath: "/desk",
    shortcutOrBadge: "Sidebar → Up Next",
    steps: [
      "Click 'Up Next' (/desk) in the main navigation sidebar.",
      "View your active reading cards sorted by reading velocity and recent activity.",
      "Click 'Resume Reading' on any card to jump immediately into your primary access path.",
      "Review your daily reading streak and weekly chapter completion counts.",
    ],
    screenshotCaption: "Up Next dashboard showing active reading queue cards, pace metrics, and quick-resume buttons.",
    wireframeHighlights: ["1-Click Quick Resume", "Reading Velocity Metrics", "Streak Counter HUD"],
  },
  {
    id: "reading-velocity-calculator",
    category: "return-desk",
    categoryLabel: "Up Next & Hiatus",
    title: "Reading Velocity, Pace Analyzer & Estimated Completion Horizon",
    subtitle: "Calculates chapters read per day and predicts your estimated completion date for massive web serials.",
    whyItMatters:
      "Reading a 2,000-chapter cultivation epic can feel endless. The pace analyzer shows you: 'At your current rate of 12 chapters/day, you will finish in 42 days.'",
    routePath: "/desk",
    shortcutOrBadge: "Up Next → Pace Analyzer",
    steps: [
      "Open the Up Next dashboard and scroll to the Velocity & Pace panel.",
      "View your 7-day and 30-day rolling chapter reading averages.",
      "Check the Estimated Completion Date calculated for each active work based on total chapters.",
      "Adjust your daily reading goal to see the horizon recalculate in real-time.",
    ],
    screenshotCaption: "Velocity Calculator displaying chapters/day velocity curve and estimated completion horizon.",
    wireframeHighlights: ["Rolling Chapter Velocity", "Estimated Finish Date", "Daily Target Adjuster"],
  },
  {
    id: "hiatus-recovery-engine",
    category: "return-desk",
    categoryLabel: "Up Next & Hiatus",
    title: "Hiatus Recovery Engine: Context Refreshers & Last Scene Recaps",
    subtitle: "Bridges the gap when returning to a novel after 6 months with custom spoiler-safe recaps and memory refreshers.",
    whyItMatters:
      "The #1 reason readers drop web novels is returning after a hiatus and forgetting who the characters are. Hiatus Recovery gets you up to speed in 2 minutes.",
    routePath: "/desk",
    shortcutOrBadge: "Up Next → Hiatus Section",
    steps: [
      "In Up Next, notice works marked with the amber 'Hiatus Warning' badge (inactive for 30+ days).",
      "Click 'Recover Context' to review your last scene note, major character revelations, and bookmarked memories.",
      "Read your personalized recap before opening the next unread chapter.",
      "Once reoriented, click 'Resume Catch-Up' to transition the work back to active reading status.",
    ],
    screenshotCaption: "Hiatus Recovery card displaying days elapsed, last scene reflection, and memory refresher list.",
    wireframeHighlights: ["Inactivity Detection Badge", "Last Scene Memory Refresher", "Smooth Catch-Up Transition"],
  },
  {
    id: "daily-reading-streak-milestones",
    category: "return-desk",
    categoryLabel: "Up Next & Hiatus",
    title: "Daily Reading Habit Streaks, Volume Milestones & Completion Badges",
    subtitle: "Gamify your reading consistency with daily streak flame counters and volume milestone trophies.",
    whyItMatters:
      "Builds a rewarding lifelong reading habit. Celebrate finishing full novel volumes or maintaining a 30-day reading streak.",
    routePath: "/desk",
    shortcutOrBadge: "Up Next → Streaks",
    steps: [
      "Log your reading progress daily to keep your flame streak counter alive.",
      "Unlock milestone badges upon completing 10, 50, 100, and 500 chapters.",
      "Earn golden volume ribbons when completing full published arcs or light novel volumes.",
    ],
    screenshotCaption: "Reading Streaks panel with active flame counter, monthly consistency calendar, and badges.",
    wireframeHighlights: ["Daily Flame Counter", "Monthly Activity Heatmap", "Milestone Trophy Badges"],
  },

  // 7. MEMORIES, NOTES & FRANCHISE GRAPH
  {
    id: "scratchpad-notes-roughwork",
    category: "memory-lore",
    categoryLabel: "Memories & Notes",
    title: "Reading Scratchpad & In-Line Margin Notes",
    subtitle: "Dedicated rough-work scratchpad for jotting down character theories, chapter guesses, and rough notes while reading.",
    whyItMatters:
      "Keeps temporary rough notes cleanly separated from permanent, cherished memories. Scratchpad is for working thoughts; Memories are for reminiscence.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Work Detail → Notes Tab",
    steps: [
      "Open any Work Detail page and switch to the 'Notes' tab.",
      "Use the instant markdown scratchpad to record rough chapter notes, realm progression charts, or power scaling theories.",
      "Notes save automatically on every keystroke with offline local persistence.",
      "Keep scratch notes nearby while reading without cluttering your permanent Memory Hall.",
    ],
    screenshotCaption: "Notes scratchpad editor with auto-save indicator, markdown formatting bar, and quick list tools.",
    wireframeHighlights: ["Auto-Save Scratchpad", "Separated from Memories", "Markdown Formatting", "Instant Revisions"],
  },
  {
    id: "memories-vault-reminisce",
    category: "memory-lore",
    categoryLabel: "Memories & Notes",
    title: "Memory Vault & Cherished Quotes (Permanent Reminiscence)",
    subtitle: "Curate unforgettable quotes, emotional climaxes, and plot revelations to reminisce over years later.",
    whyItMatters:
      "When you finish a 1,000-chapter masterpiece, you want to preserve the exact quotes and revelations that touched your soul, forever.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Work Detail → Memories Tab",
    steps: [
      "On any Work Detail page, open the 'Memories' tab.",
      "Click '+ Create Memory' and select 'Text Quote' or 'Plot Milestone'.",
      "Record the chapter number, exact dialogue or excerpt, and your personal reflection.",
      "Mark pivotal moments with the Vault Shield icon to keep them locked inside your Private Vault.",
    ],
    screenshotCaption: "Memory Vault cards displaying elegant quotation styling, chapter tags, and emotional reflection text.",
    wireframeHighlights: ["Quotation Card Typography", "Chapter Milestone Tagging", "Private Vault Encryption Option"],
  },
  {
    id: "screenshot-memory-lightbox",
    category: "memory-lore",
    categoryLabel: "Memories & Notes",
    title: "High-Resolution Screenshot Memories & Visual Moment Preserver",
    subtitle: "Save double-page spreads, iconic manhwa panels, and anime stills attached directly to work milestones.",
    whyItMatters:
      "A picture is worth a thousand words. Preserving the exact illustrated panel where a protagonist awakens their power creates a timeless visual chronicle.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Work Detail → Memories",
    steps: [
      "In the Memories tab, click '+ Add Screenshot Memory'.",
      "Attach an image file (PNG, JPG, WebP) or paste an image directly from your clipboard.",
      "Add a descriptive caption and associated chapter number.",
      "Click any screenshot thumbnail to open the full-screen pan-and-zoom lightbox.",
    ],
    screenshotCaption: "Screenshot Memory card with high-resolution image preview and expand lightbox button.",
    wireframeHighlights: ["High-Res Image Attachments", "Clipboard Paste Support", "Full-Screen Zoom Lightbox"],
  },
  {
    id: "cross-medium-adaptation-graph",
    category: "memory-lore",
    categoryLabel: "Memories & Notes",
    title: "Cross-Medium Adaptation Graph (Novel ↔ Manhwa ↔ Anime)",
    subtitle: "Link Web Novels, Light Novels, Manga, Manhwa, and Anime adaptations into a unified franchise relation tree.",
    whyItMatters:
      "Shows your entire franchise universe in one visual graph—know immediately that Anime Episode 24 corresponds to Manhwa Chapter 110 and Novel Chapter 142.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Work Detail → Relations Tab",
    steps: [
      "Open any Work Detail page and switch to the 'Relations' tab.",
      "View the visual Adaptation Tree grouping Novel, Manhwa, and Anime nodes.",
      "Click '+ Link Related Work', choose another work from your Library, and select 'Adaptation' or 'Source Novel'.",
      "Add Transition Notes (e.g. 'Manhwa Season 1 ends at Web Novel Chapter 65').",
      "Click any linked work node to navigate across mediums instantaneously.",
    ],
    screenshotCaption: "Relations tab displaying cross-medium Novel ↔ Manhwa ↔ Anime visual relationship tree.",
    wireframeHighlights: ["Novel ↔ Manhwa ↔ Anime Links", "Transition Chapter Notes", "1-Click Cross-Navigation"],
  },
  {
    id: "franchise-universe-tree",
    category: "memory-lore",
    categoryLabel: "Memories & Notes",
    title: "Franchise Universe Tree (Prequels, Sequels & Spin-Offs)",
    subtitle: "Map complex fictional universes including prequels, sequels, side stories, alternative timelines, and crossovers.",
    whyItMatters:
      "Keeps multi-generational epics and massive light novel spinoff universes organized so you always know the canonical reading order.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Relations → Universe Graph",
    steps: [
      "In the Relations tab, select 'Add Relationship' and choose 'Sequel', 'Prequel', 'Spin-off', or 'Shared Universe'.",
      "The interactive graph arranges related works chronologically or by publication order.",
      "Track your reading progress across the entire franchise in a single unified view.",
    ],
    screenshotCaption: "Franchise Universe Tree displaying chronological reading sequence and spinoff branches.",
    wireframeHighlights: ["Chronological Tree Ordering", "Multi-Branch Spinoffs", "Total Franchise Progress Meter"],
  },

  // 8. RADAR TRIAGE, UPDATES & MERGE WIZARD
  {
    id: "radar-capture-triage",
    category: "radar-merge",
    categoryLabel: "Radar & Deduplication",
    title: "Radar Capture Inbox & Triage Workflow",
    subtitle: "Dump intriguing recommendations, URLs, and titles into Radar without polluting your curated Library until verified.",
    whyItMatters:
      "Separates casual 'I saw someone recommend this title on Reddit/TikTok' from your committed, organized Library catalog.",
    routePath: "/radar",
    shortcutOrBadge: "Sidebar → Radar",
    steps: [
      "Open 'Radar' (/radar) from the navigation sidebar.",
      "Click '+ Capture to Radar' to quickly record a title, URL, medium, priority level, and why it caught your eye.",
      "Filter Radar captures by Priority (High, Medium, Low), Medium, or Triage Status.",
      "When ready to start reading, click 'Promote to Library' on any Radar card to convert it into a full Library Work.",
    ],
    screenshotCaption: "Radar Capture Queue with priority badges, medium filters, and Promote to Library action.",
    wireframeHighlights: ["Zero-Friction Capture", "Priority & Medium Filters", "1-Click Promote to Library"],
  },
  {
    id: "updates-certainty-inbox",
    category: "radar-merge",
    categoryLabel: "Radar & Deduplication",
    title: "Updates Feed with Release Certainty Badges & Snooze",
    subtitle: "Track newly detected chapters/episodes with Confirmed, Inferred, or Scheduled certainty indicators.",
    whyItMatters:
      "Distinguishes between verified chapter releases ('Confirmed') and estimated release cadences ('Scheduled' / 'Inferred').",
    routePath: "/updates",
    shortcutOrBadge: "Sidebar → Updates",
    steps: [
      "Click 'Updates' (/updates) in the sidebar (notice the live unread count badge).",
      "Inspect new chapter release cards showing the numeric delta (e.g. '+3 new chapters since Ch. 112') and Certainty Badge.",
      "Click 'Mark Seen', 'Snooze', or 'Read Now' to open your preferred source and clear the notification.",
    ],
    screenshotCaption: "Updates Inbox showing unread chapter releases, certainty badges, and batch mark-seen controls.",
    wireframeHighlights: ["Confirmed / Inferred Badges", "Unread Chapter Delta", "Snooze & Dismiss Controls"],
  },
  {
    id: "non-destructive-merge-wizard",
    category: "radar-merge",
    categoryLabel: "Radar & Deduplication",
    title: "Non-Destructive Duplicate Work Merge Wizard",
    subtitle: "Combine two duplicate works while preserving 100% of both works' Access Paths, Memories, Tags, and Progress.",
    whyItMatters:
      "Often you accidentally track a work under its romanized Korean title AND its official English title. Merging them never deletes a single note or mirror.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Work Detail → Merge",
    steps: [
      "On any Work Detail page, click the 'Merge' button in the top action bar.",
      "Search and select the duplicate candidate work (the wizard automatically scores likely duplicates by title similarity).",
      "Choose which Title, Cover, and Primary State to keep while previewing the unified Access Paths, Memories, and Aliases.",
      "Confirm the merge—the secondary title becomes a searchable Alias on the surviving work and zero data is lost.",
    ],
    screenshotCaption: "3-Step Non-Destructive Merge Wizard showing side-by-side field resolution and combined paths.",
    wireframeHighlights: ["Fuzzy Duplicate Detection", "Zero-Data-Loss Union", "Automatic Alias Preservation"],
  },

  // 9. LISTS, CATEGORIES, PRIVATE VAULT & PORTABILITY
  {
    id: "curated-lists-publication",
    category: "vault-backup",
    categoryLabel: "Vault, Lists & Portability",
    title: "Curated Reading Lists & Shareable Publication Cards",
    subtitle: "Build themed collections with custom ordering, curator notes, and exportable share cards.",
    whyItMatters:
      "Create lists like 'Top 10 Time-Loop Regression Novels' or '2026 Seasonal Anime Watchlist' and generate clean shareable summaries.",
    routePath: "/lists",
    shortcutOrBadge: "Sidebar → Lists",
    steps: [
      "Open 'Lists' (/lists) from the sidebar and click '+ Create List'.",
      "Add works to the list from the list editor or via the Library Bulk Action bar.",
      "Add custom curator annotations explaining why each work deserves its spot on the list.",
      "Open the Publication Panel to generate a shareable read-only card or JSON export of your curated list.",
    ],
    screenshotCaption: "Curated Lists view with custom work ordering and Publication Share card generator.",
    wireframeHighlights: ["Themed Collections", "Curator Annotations", "Shareable Publication Cards"],
  },
  {
    id: "custom-dynamic-categories-view",
    category: "vault-backup",
    categoryLabel: "Vault, Lists & Portability",
    title: "My Categories & Custom Taxonomy Organizer",
    subtitle: "Organize works into personal shelves and custom genre/theme taxonomies.",
    whyItMatters:
      "Lets you define your own classification system beyond standard publisher genres with custom accent colors.",
    routePath: "/categories",
    shortcutOrBadge: "Sidebar → My Categories",
    steps: [
      "Navigate to 'My Categories' (/categories).",
      "Create custom categories with custom icons/colors and assign works to them.",
      "Click any category card to filter and inspect all works inside that shelf.",
    ],
    screenshotCaption: "My Categories dashboard with custom shelf cards and work count indicators.",
    wireframeHighlights: ["Custom Shelf Taxonomy", "Color & Icon Badges", "Instant Category Filtering"],
  },
  {
    id: "zero-knowledge-private-vault",
    category: "vault-backup",
    categoryLabel: "Vault, Lists & Portability",
    title: "Hardware-Accelerated Zero-Knowledge Private Vault with Auto-Lock",
    subtitle: "Protect sensitive or private works behind hardware-accelerated zero-knowledge encryption and instant panic-lock.",
    whyItMatters:
      "Private works are completely invisible in the standard Library, Search, and Up Next until you unlock the Private Vault with your passphrase.",
    routePath: "/vault",
    shortcutOrBadge: "Ctrl+Shift+L (Panic Lock)",
    steps: [
      "Navigate to 'Private Vault' (/vault) in the sidebar footer.",
      "Set up your Vault Passphrase (derives an on-device AES-GCM 256-bit cryptographic key via PBKDF2).",
      "Move any work into the Vault from Work Detail (Shield icon) or Library Bulk Actions.",
      "Lock the Vault manually or press Ctrl+Shift+L (also auto-locks after 15 minutes of inactivity or window blur).",
    ],
    screenshotCaption: "Private Vault unlock screen and encrypted sanctum view with panic lock trigger.",
    wireframeHighlights: ["Zero-Knowledge AES-256", "PBKDF2 Key Derivation", "Ctrl+Shift+L Panic Lock"],
  },
  {
    id: "hardware-panic-lock-stealth",
    category: "vault-backup",
    categoryLabel: "Vault, Lists & Portability",
    title: "Instant Panic Lock (Ctrl+Shift+L) & Complete Stealth Mode",
    subtitle: "Instantly evicts cryptographic keys from RAM, clears vault cards from screen, and redirects to innocent library.",
    whyItMatters:
      "If someone walks into your room while you are reading a private work, one keystroke purges memory and displays harmless public fiction.",
    routePath: "/vault",
    shortcutOrBadge: "Ctrl+Shift+L / Inactivity Timer",
    steps: [
      "While inside the Private Vault, press 'Ctrl+Shift+L' at any moment.",
      "The screen instantly wipes all encrypted DOM nodes and redirects to the public Sanctum Library.",
      "Cryptographic encryption keys in memory are scrubbed immediately.",
      "To re-enter, you must re-enter your master passphrase.",
    ],
    screenshotCaption: "Stealth Panic Lock confirmation toast and instant memory scrubbing notification.",
    wireframeHighlights: ["Sub-Millisecond Key Purge", "Zero DOM Remnants", "Automatic Window Blur Trigger"],
  },
  {
    id: "cold-storage-archive",
    category: "vault-backup",
    categoryLabel: "Vault, Lists & Portability",
    title: "Cold Storage Archive with Structured Reason & Reflection Notes",
    subtitle: "Retire dropped, hiatus-abandoned, or finished works out of your active workspace without deleting their history.",
    whyItMatters:
      "Keeps your active Library clean and focused while preserving a permanent historical record of why and when you archived a work.",
    routePath: "/archive",
    shortcutOrBadge: "Sidebar → Archive",
    steps: [
      "On any Work Detail page, click 'Archive' (or use Bulk Archive in Library).",
      "Select an Archive Reason (Completed & Retired, Dropped, Source Dead, Indefinite Hiatus, Seasonal Rotation) and add a final reflection note.",
      "Visit '/archive' anytime to search archived works or click 'Unarchive' to restore them to active duty.",
    ],
    screenshotCaption: "Cold Storage Archive modal and Archive catalog with reflection notes and Unarchive button.",
    wireframeHighlights: ["Structured Archive Reasons", "Reflection Notes", "1-Click Unarchive Restore"],
  },
  {
    id: "gca-chronicles-archive-spec",
    category: "vault-backup",
    categoryLabel: "Vault, Lists & Portability",
    title: "Grimoire Chronicles Archive (.gca) Portable Bundle Engine",
    subtitle: "Universal, self-contained migration archive containing works, memories, access paths, credentials, and relations.",
    whyItMatters:
      "Enables effortless backup and transfer between Windows PC, macOS, Linux, and Android with zero reliance on cloud services.",
    routePath: "/settings",
    shortcutOrBadge: "Settings → Export .gca",
    steps: [
      "Go to Settings → Data Transfer & Portability.",
      "Click 'Export Grimoire Archive (.gca)'.",
      "Save the resulting file or transfer it to your phone via USB, local Wi-Fi, or cloud drive.",
      "On your other device, simply select 'Import .gca File' from the landing screen to restore everything in seconds.",
    ],
    screenshotCaption: "Export Grimoire Archive dialog showing payload breakdown and instant download button.",
    wireframeHighlights: ["Self-Contained Bundle", "Cross-Platform Compatible", "Complete Relational Fidelity"],
  },
  {
    id: "data-transfer-bookmarks-import",
    category: "vault-backup",
    categoryLabel: "Vault, Lists & Portability",
    title: "Full JSON Vault Backup, CSV Importer & Browser Bookmarks HTML Parser",
    subtitle: "Export your entire library to portable JSON, or bulk-import thousands of browser bookmarks and CSV rows.",
    whyItMatters:
      "Zero vendor lock-in. Bring 10 years of messy Chrome/Firefox manga bookmark folders into Grimoire in 30 seconds.",
    routePath: "/settings",
    shortcutOrBadge: "Settings → Data Transfer",
    steps: [
      "Go to Settings (/settings) and scroll to the 'Data Transfer & Portability' panel.",
      "Click 'Export Full Backup (.json)' to download a complete snapshot of all works, progress, memories, lists, and access paths.",
      "Click 'Import Browser Bookmarks (.html)' or 'Import CSV' to parse bookmark folders into candidate works, review deduplication matches, and commit them to your Library.",
    ],
    screenshotCaption: "Settings Data Transfer panel showing JSON Backup Export, CSV Importer, and Browser Bookmarks HTML parser.",
    wireframeHighlights: ["1-Click JSON Vault Export", "Chrome/Firefox HTML Importer", "Smart Deduplication Preview"],
  },
  {
    id: "local-first-e2ee-sync",
    category: "vault-backup",
    categoryLabel: "Vault, Lists & Portability",
    title: "Local-First Hybrid Logical Clock (HLC) CRDT Sync Engine",
    subtitle: "Conflict-free multi-device synchronization with End-to-End Encryption across PC and mobile devices.",
    whyItMatters:
      "Read offline on the subway, on an airplane, or at home. When you reconnect, chapter progress merges seamlessly without conflicts or data overwrites.",
    routePath: "/settings",
    shortcutOrBadge: "Settings → Sync Hub",
    steps: [
      "Open Settings and locate the 'Sync & Relay Hub' section.",
      "Inspect your local HLC timestamp and sync state.",
      "Changes made locally are signed and queued into local SQLite/JSON storage.",
      "When online, encrypted CRDT deltas synchronize with your relay or peer devices.",
    ],
    screenshotCaption: "Sync Hub status panel showing HLC clock drift, last sync timestamp, and encrypted relay status.",
    wireframeHighlights: ["Local-First Architecture", "HLC CRDT Convergence", "End-to-End Encrypted Relay"],
  },
  {
    id: "desktop-native-gui-launcher",
    category: "vault-backup",
    categoryLabel: "Vault, Lists & Portability",
    title: "Dual Windows Desktop Deployment: Native Launcher & Standalone Studio",
    subtitle: "Run Grimoire as an ultra-lightweight 56 KB native Windows GUI launcher or as a 35 MB standalone executable.",
    whyItMatters:
      "Experience a true native desktop application without terminal windows, console flicker, or browser address bars.",
    routePath: "/settings",
    shortcutOrBadge: "Grimoire.exe / Win32",
    steps: [
      "Double-click 'Grimoire.exe' in the Chronicles Vault root folder.",
      "The native C# Win32 launcher starts silently with zero console flicker and loads the local workstation UI instantly.",
      "Alternatively, run 'Grimoire-Studio.exe' for a fully self-contained PyInstaller distribution with embedded sync engine.",
      "Enjoy full hardware acceleration, native window controls, and offline OPFS/SQLite performance.",
    ],
    screenshotCaption: "Grimoire Windows Desktop app running in dedicated frameless window with native OS integration.",
    wireframeHighlights: ["56 KB Win32 Launcher", "35 MB PyInstaller Studio", "Zero Console Windows", "Hardware Accelerated"],
  },
];

const COMPREHENSIVE_FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: "faq-rooms-profiles",
    category: "Account & Profiles",
    question: "How do reading rooms and user profiles work in Grimoire?",
    answer:
      "In Grimoire, each 'Room' represents an isolated reading sanctum with its own visual theme, active shelf state, and personal motto. You can maintain multiple rooms (for instance, one for light novels, one for manga, and one for study) and switch between them instantly from the Sanctum Title Screen.",
    highlights: ["Isolated Room Environments", "Per-Profile Themes", "Fast Switching via Lobby"],
  },
  {
    id: "faq-signup-login",
    category: "Account & Profiles",
    question: "Can I sign up using an Email ID or Google Sign-In?",
    answer:
      "Yes! When visiting Grimoire without an active session, the first-time landing screen presents three prominent options: Sign Up, Sign In, or Import .gca File. You can create an account using your Google account (via 'Continue with Google'), an Email ID and password, or choose a purely offline local username for maximum privacy.",
    highlights: ["Continue with Google", "Email ID & Password", "100% Offline Local Option"],
  },
  {
    id: "faq-zero-works-empty-library",
    category: "Account & Profiles",
    question: "Why does my library start with 0 works when I log out or create a new account?",
    answer:
      "Grimoire strictly adheres to a zero-mock, clean-slate invariant. Unlike demo apps that flood your shelves with fake placeholder data, new accounts and logged-out sessions start completely empty with 0 works. You have full ownership to build your curated library or restore an existing .gca archive.",
    highlights: ["Clean Slate Invariant", "Zero Mock Data", "Total User Ownership"],
  },
  {
    id: "faq-credentials-storage",
    category: "Security & Privacy",
    question: "Where are my website usernames and passwords stored, and in what form?",
    answer:
      "Your website reading credentials (such as logins for Royal Road, MangaDex, or Webtoons) are stored locally on your device inside an encrypted vault partition (localStorage/IndexedDB key 'grimoire:vault:credentials'). They are encrypted using AES-GCM 256-bit with an encryption key derived via PBKDF2 (100,000 SHA-256 iterations) from your Vault Passphrase. They are NEVER sent to any remote server in plaintext.",
    highlights: ["AES-GCM 256-bit Encryption", "PBKDF2 Key Derivation", "Zero-Knowledge Local Storage"],
  },
  {
    id: "faq-server-data-form",
    category: "Security & Privacy",
    question: "Where and in what form is online server data like friend lists and sync records stored?",
    answer:
      "Grimoire operates on a Local-First, End-to-End Encrypted (E2EE) architecture. On your PC workstation, data is stored in an embedded Hybrid Logical Clock (HLC) JSON document store ('shared_vault_store.json') and local SQLite database. On the relay server, records and friend links exist solely as opaque, encrypted CRDT document envelopes. The relay server acts as an untrusted mailbox carrier and cannot read your library titles, friend lists, or reading progress.",
    highlights: ["Local HLC Document Store", "Embedded SQLite", "Encrypted CRDT Envelopes", "Untrusted Blind Relay"],
  },
  {
    id: "faq-panic-lock",
    category: "Security & Privacy",
    question: "What is the Private Vault and how does Panic Lock (Ctrl+Shift+L) work?",
    answer:
      "The Private Vault is an encrypted sanctuary for works you want kept strictly private. Private works are hidden from the normal library, search results, and Up Next until you unlock the vault. Pressing Ctrl+Shift+L triggers instant Panic Lock: it immediately wipes decrypted data and cryptographic keys from system memory and redirects your screen to the public library in under 20 milliseconds.",
    highlights: ["Zero-Trace Stealth", "Ctrl+Shift+L Instant Purge", "Auto-Lock on Inactivity & Tab Blur"],
  },
  {
    id: "faq-supported-formats",
    category: "Readers & Media",
    question: "What file formats can I read or play directly inside Grimoire?",
    answer:
      "Grimoire includes built-in offline readers and media players supporting: EPUB (with chapter TOC and typography controls), PDF (with continuous scroll, dual-page spread, and zoom), Webtoon / Comic strips (infinite vertical continuous scroll), Audiobooks (MP3, WAV, M4B with speed control and sleep timer), and Local Video (MP4, MKV, WebM with theater mode and subtitle tracks).",
    highlights: ["EPUB & PDF Readers", "Continuous Webtoon Scroll", "Audiobook & Video Players"],
  },
  {
    id: "faq-notes-vs-memories",
    category: "Notes vs Memories",
    question: "What is the difference between Notes and Memories?",
    answer:
      "Notes and Memories serve two distinctly different purposes: 'Notes' are a rough-work scratchpad used while actively reading to jot down quick character theories, realm progression tables, and temporary thoughts. 'Memories' are permanent, cherished emotional milestones—such as memorable quotes, pivotal plot revelations, and high-resolution screenshots—preserved to reminisce over years later.",
    highlights: ["Notes = Active Reading Scratchpad", "Memories = Cherished Reminiscence & Screenshots"],
  },
  {
    id: "faq-cross-medium-adaptations",
    category: "Adaptations & Graph",
    question: "How does Grimoire handle works that have both a Novel and a Manhwa or Anime?",
    answer:
      "Grimoire features a Cross-Medium Adaptation Graph. You can track the Web Novel, Manhwa, and Anime as distinct works with their own independent chapter progress, while linking them together via the 'Relations' tab. You can add Transition Chapter Notes (e.g. 'Anime Season 1 ends at Manhwa Chapter 110 and Novel Chapter 142') so you can seamlessly transition across mediums without losing your place.",
    highlights: ["Independent Chapter Tracking", "Visual Relation Graph", "Transition Chapter Notes"],
  },
  {
    id: "faq-frequent-websites",
    category: "Portals & Passwords",
    question: "How does Grimoire automatically detect my Frequent Reading Websites?",
    answer:
      "Grimoire continuously analyzes the Access Paths across all works in your library. Any website domain that has 5 or more works attached to it is automatically identified as a Frequent Reading Portal and prominently displayed in the Website Credential Keyring with its work count badge, direct homepage launcher, and catalog search integration.",
    highlights: ["5+ Work Automatic Threshold", "Domain Aggregator", "1-Click Catalog Search"],
  },
  {
    id: "faq-multi-source-mirrors",
    category: "Portals & Passwords",
    question: "What are Multi-Source Access Paths and what happens if a website shuts down?",
    answer:
      "Each work in Grimoire supports unlimited Access Paths (e.g., Official Publisher, Scanlation Group A, Backup Mirror B, Local EPUB). You can assign priority ordering and star your primary path. If a scanlation site goes offline or changes domains, simply update the path or promote a backup mirror with one click—all your chapter progress, notes, and memories remain completely intact.",
    highlights: ["Unlimited Backup Mirrors", "1-Click Primary Promotion", "Zero Progress Loss on Dead Sites"],
  },
  {
    id: "faq-gca-file-migration",
    category: "Data & Portability",
    question: "What is a .gca file and how do I transfer my library between devices?",
    answer:
      "A .gca file (Grimoire Chronicles Archive) is an open, portable JSON-based bundle containing your entire library: works, reading progress, memories, access paths, lists, categories, and encrypted vault records. You can export a .gca file from Settings → Data Transfer, and restore it on any other Windows PC, Mac, Linux, or Android device with one click on the landing page.",
    highlights: ["Universal Portable Archive", "Cross-Platform Migration", "1-Click Import from Landing Page"],
  },
  {
    id: "faq-browser-bookmarks-import",
    category: "Data & Portability",
    question: "Can I import my existing manga/novel bookmarks from Chrome or Firefox?",
    answer:
      "Yes! Grimoire includes a built-in Browser Bookmarks HTML Parser. Export your bookmarks from Chrome, Firefox, or Edge as an HTML file, upload it into Grimoire Settings → Data Transfer, and the smart parser will extract titles, URLs, and folders into candidate works with deduplication preview before committing them to your library.",
    highlights: ["Chrome / Firefox / Edge HTML Importer", "Smart Deduplication Preview", "Folder Hierarchy Extraction"],
  },
  {
    id: "faq-app-sizes-platforms",
    category: "Platforms & Storage",
    question: "What are the sizes and footprints of Grimoire on Windows PC and Android mobile?",
    answer:
      "On Windows PC: The native C# GUI launcher ('Grimoire.exe') is an ultra-lightweight 56 KB (56,320 bytes); the standalone PyInstaller executable ('Grimoire-Studio.exe') with bundled Python runtime and media parser is 35.2 MB; the core web bundle is ~1.1 MB minified (~320 KB gzipped). On Android: The native APK ('ChroniclesVault-Android-v1.0.apk') is 3.70 MB, with an installed device footprint of approximately 6 to 9 MB.",
    highlights: ["Windows Launcher: 56 KB", "Windows Studio: 35.2 MB", "Android APK: 3.70 MB", "Installed Footprint: 6-9 MB"],
  },
];

const CATEGORY_TABS = [
  { id: "all", label: "All Features & Variants", icon: Sparkles },
  { id: "room-themes", label: "Room & Themes", icon: Palette },
  { id: "library-views", label: "Library & Shelves", icon: BookOpen },
  { id: "work-detail", label: "Work Dossier", icon: Layers },
  { id: "sources-video", label: "Sources & Portals", icon: Globe },
  { id: "reader-shelf", label: "Readers & Media", icon: HardDrive },
  { id: "return-desk", label: "Up Next & Hiatus", icon: RotateCcw },
  { id: "memory-lore", label: "Memories & Notes", icon: MessageSquare },
  { id: "radar-merge", label: "Radar & Deduplication", icon: Radar },
  { id: "vault-backup", label: "Vault & Portability", icon: Shield },
] as const;

export interface FeaturesGuideProps {
  onNavigate?: (href: string) => void;
  onEnterRoomAndNavigate?: (href: string) => void;
}

export function FeaturesGuide({ onNavigate, onEnterRoomAndNavigate }: FeaturesGuideProps) {
  const [activeTab, setActiveTab] = React.useState<"features" | "faq">("features");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [expandedCards, setExpandedCards] = React.useState<Record<string, boolean>>(() => {
    return {
      "room-preloader-profiles": true,
      "three-distinct-themes": true,
      "library-grid-shelf": true,
    };
  });
  const [expandedFaq, setExpandedFaq] = React.useState<Record<string, boolean>>({
    "faq-rooms-profiles": true,
    "faq-credentials-storage": true,
    "faq-supported-formats": true,
  });

  const [customScreenshots] = React.useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem("cv:feature_screenshots:v1");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const filteredFeatures = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ALL_TINY_FEATURES.filter((feat) => {
      const matchesCategory = selectedCategory === "all" || feat.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        feat.title.toLowerCase().includes(q) ||
        feat.subtitle.toLowerCase().includes(q) ||
        feat.whyItMatters.toLowerCase().includes(q) ||
        feat.categoryLabel.toLowerCase().includes(q) ||
        feat.shortcutOrBadge.toLowerCase().includes(q) ||
        feat.steps.some((s) => s.toLowerCase().includes(q)) ||
        feat.wireframeHighlights.some((h) => h.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  const filteredFaq = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COMPREHENSIVE_FAQ_ITEMS;
    return COMPREHENSIVE_FAQ_ITEMS.filter((item) => {
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.highlights.some((h) => h.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleFaq = (id: string) => {
    setExpandedFaq((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const setAllCardsExpanded = (expanded: boolean) => {
    const next: Record<string, boolean> = {};
    for (const f of ALL_TINY_FEATURES) {
      next[f.id] = expanded;
    }
    setExpandedCards(next);
  };

  const triggerJump = (routePath: string) => {
    if (onEnterRoomAndNavigate) {
      onEnterRoomAndNavigate(routePath);
    } else if (onNavigate) {
      onNavigate(routePath);
    } else {
      window.location.hash = `#${routePath}`;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gm-bg)] text-[var(--gm-text)] pb-24">
      {/* Clean Sticky Header */}
      <header
        className="sticky top-0 z-40 border-b border-[var(--gm-border)] backdrop-blur-md px-4 sm:px-8 py-3"
        style={{ backgroundColor: "var(--gm-glass-bg)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => triggerJump("/home")}
              className="inline-flex items-center gap-1.5 rounded-cv border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-3 py-1.5 text-gm-xs font-semibold text-[var(--gm-text)] hover:bg-[var(--gm-surface-hover)] transition-all cursor-pointer"
              title="Exit current reading room and return to Sanctum Title Screen"
            >
              <DoorOpen className="h-3.5 w-3.5 text-[var(--gm-accent-strong)]" />
              <span>Exit Room (Lobby)</span>
            </button>
            <div className="h-4 w-px bg-[var(--gm-border)] hidden sm:block" />
            <div>
              <h1 className="text-gm-base sm:text-gm-lg font-bold tracking-tight text-[var(--gm-text)] flex items-center gap-2">
                <span>Help &amp; Architectural Guide</span>
                <span className="text-[10px] font-mono font-normal uppercase px-2 py-0.5 rounded-cv bg-[var(--gm-accent-muted)] text-[var(--gm-accent-strong)] border border-[var(--gm-accent)]/30">
                  {ALL_TINY_FEATURES.length} Capabilities &amp; FAQ
                </span>
              </h1>
              <p className="text-[11px] text-[var(--gm-text-muted)] hidden md:block">
                Comprehensive architectural capabilities, feature variants, step-by-step instructions &amp; interactive FAQ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Features vs FAQ */}
            <div className="inline-flex rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] p-0.5 text-gm-xs">
              <button
                type="button"
                onClick={() => setActiveTab("features")}
                className={`px-3 py-1 font-semibold rounded-cv transition-all cursor-pointer ${
                  activeTab === "features"
                    ? "bg-[var(--gm-accent)] text-[var(--gm-accent-fg)] shadow-xs"
                    : "text-[var(--gm-text-muted)] hover:text-[var(--gm-text)]"
                }`}
              >
                Features ({ALL_TINY_FEATURES.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("faq")}
                className={`inline-flex items-center gap-1 px-3 py-1 font-semibold rounded-cv transition-all cursor-pointer ${
                  activeTab === "faq"
                    ? "bg-[var(--gm-accent)] text-[var(--gm-accent-fg)] shadow-xs"
                    : "text-[var(--gm-text-muted)] hover:text-[var(--gm-text)]"
                }`}
              >
                <HelpCircle className="h-3 w-3" />
                <span>FAQ ({COMPREHENSIVE_FAQ_ITEMS.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => triggerJump("/library")}
              className="inline-flex items-center gap-1.5 rounded-cv bg-[var(--gm-accent)] px-3.5 py-1.5 text-gm-xs font-semibold text-[var(--gm-accent-fg)] hover:opacity-95 transition-opacity cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Enter Room (Library)</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        {/* Search & Top Action Bar */}
        <div className="space-y-3 mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 text-[var(--gm-text-subtle)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "features"
                    ? "Search any feature, variant, or route…"
                    : "Search frequently asked questions, security, formats…"
                }
                className="w-full rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] pl-9 pr-3 py-1.5 text-gm-sm text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] focus:outline-none focus:border-[var(--gm-border-focus)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gm-xs text-[var(--gm-text-subtle)] hover:text-[var(--gm-text)] cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {activeTab === "features" && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allOpen = Object.values(expandedCards).filter(Boolean).length > 5;
                    setAllCardsExpanded(!allOpen);
                  }}
                  className="inline-flex items-center gap-1 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-2.5 py-1 text-gm-xs font-medium text-[var(--gm-text)] hover:bg-[var(--gm-surface)] transition-colors cursor-pointer"
                >
                  <span>Toggle All Cards</span>
                </button>
              </div>
            )}
          </div>

          {/* Clean Category Badges (For Features tab) */}
          {activeTab === "features" && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {CATEGORY_TABS.map((tab) => {
                const active = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`inline-flex items-center gap-1 rounded-cv px-2.5 py-1 text-gm-xs font-medium border transition-all cursor-pointer ${
                      active
                        ? "border-[var(--gm-accent)] bg-[var(--gm-accent)] text-[var(--gm-accent-fg)]"
                        : "border-[var(--gm-border)] bg-[var(--gm-surface)]/60 text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] hover:border-[var(--gm-border-strong)]"
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tab 1: Comprehensive Features Catalog (No numbering) */}
        {activeTab === "features" && (
          <div className="space-y-4">
            {filteredFeatures.map((feature) => {
              const attachedScreenshot = customScreenshots[feature.id];
              const isExpanded = expandedCards[feature.id] ?? false;

              return (
                <article
                  key={feature.id}
                  id={feature.id}
                  className="rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] overflow-hidden shadow-2xs hover:border-[var(--gm-border-strong)] transition-all"
                >
                  {/* Clean Card Header Row without Numbering */}
                  <div
                    onClick={() => toggleCard(feature.id)}
                    className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-[var(--gm-surface)]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-gm-sm sm:text-gm-base font-bold text-[var(--gm-text)] leading-snug">
                            {feature.title}
                          </h2>
                          <span className="rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-2 py-0.2 text-[10px] font-medium text-[var(--gm-text-muted)]">
                            {feature.categoryLabel}
                          </span>
                          {attachedScreenshot && (
                            <span className="inline-flex items-center gap-1 rounded-cv bg-[var(--gm-success-muted)] px-2 py-0.2 text-[10px] font-semibold text-[var(--gm-success)]">
                              <Check className="h-2.5 w-2.5" /> Visual Attached
                            </span>
                          )}
                        </div>
                        <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5 line-clamp-1">
                          {feature.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => triggerJump(feature.routePath)}
                        className="inline-flex items-center gap-1.5 rounded-cv bg-[var(--gm-surface)] border border-[var(--gm-border-strong)] px-2.5 py-1 text-gm-xs font-semibold text-[var(--gm-text)] hover:bg-[var(--gm-surface-hover)] transition-colors cursor-pointer"
                        title={`Open ${feature.routePath} live in app`}
                      >
                        <Play className="h-3 w-3 text-[var(--gm-accent-strong)]" />
                        <span className="hidden sm:inline">Try in App</span>
                        <span className="text-[10px] font-mono text-[var(--gm-text-subtle)]">
                          {feature.routePath}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCard(feature.id)}
                        className="p-1 rounded-cv text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] cursor-pointer"
                        aria-label={isExpanded ? "Collapse feature card" : "Expand feature card"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Card Details */}
                  {isExpanded && (
                    <div className="border-t border-[var(--gm-border)] p-4 sm:p-6 bg-[var(--gm-bg)]/40">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Left 7 Columns: Rationale & Steps */}
                        <div className="lg:col-span-7 space-y-4">
                          {/* Why It Matters */}
                          <div className="rounded-cv border-l-2 border-[var(--gm-accent)] bg-[var(--gm-surface)]/70 p-3 text-gm-xs text-[var(--gm-text)] leading-relaxed">
                            <span className="font-bold text-[var(--gm-accent-strong)] mr-1">
                              Why it matters:
                            </span>
                            {feature.whyItMatters}
                          </div>

                          {/* Step-by-Step Instructions */}
                          <div className="space-y-2">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--gm-text-muted)] font-mono">
                              Step-by-Step Usage:
                            </div>
                            <ul className="space-y-2">
                              {feature.steps.map((step, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2.5 text-gm-xs text-[var(--gm-text)] leading-relaxed"
                                >
                                  <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--gm-accent-muted)] text-[10px] font-bold text-[var(--gm-accent-strong)] mt-0.5">
                                    ✦
                                  </span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Right 5 Columns: Architectural Feature Blueprint Frame */}
                        <div className="lg:col-span-5 space-y-2.5">
                          {attachedScreenshot ? (
                            <div className="rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] overflow-hidden shadow-2xs">
                              <div className="relative group aspect-[16/10] bg-black/50 flex items-center justify-center overflow-hidden">
                                <img
                                  src={attachedScreenshot}
                                  alt={feature.title}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-cv border border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] p-4 shadow-sm space-y-3 font-mono">
                              <div className="flex items-center justify-between border-b border-[var(--gm-border)] pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="font-bold text-[11px] text-[var(--gm-accent-strong)] tracking-wider">
                                    FEATURE BLUEPRINT &amp; ARCHITECTURE
                                  </span>
                                </div>
                                <span className="rounded-cv bg-[var(--gm-surface)] border border-[var(--gm-border)] px-2 py-0.5 text-[10px] text-[var(--gm-text-muted)] font-sans font-medium">
                                  {feature.shortcutOrBadge}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--gm-text-subtle)]">
                                  Target Route:
                                </div>
                                <div className="text-[var(--gm-accent-strong)] bg-[var(--gm-surface)] px-2.5 py-1 rounded-cv border border-[var(--gm-border)] text-gm-xs font-semibold">
                                  {feature.routePath}
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--gm-text-subtle)]">
                                  Architecture Highlights:
                                </div>
                                <div className="flex flex-wrap gap-1.5 font-sans">
                                  {feature.wireframeHighlights.map((hl, i) => (
                                    <span
                                      key={i}
                                      className="rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--gm-text)]"
                                    >
                                      ✦ {hl}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <p className="text-[11px] italic font-sans text-[var(--gm-text-muted)] leading-relaxed pt-1.5 border-t border-[var(--gm-border)]/60">
                                {feature.screenshotCaption}
                              </p>

                              <button
                                type="button"
                                onClick={() => triggerJump(feature.routePath)}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-cv border border-[var(--gm-accent)] bg-[var(--gm-accent)]/10 px-3 py-2 text-gm-xs font-sans font-bold text-[var(--gm-accent-strong)] hover:bg-[var(--gm-accent)] hover:text-[var(--gm-accent-fg)] transition-all cursor-pointer shadow-2xs"
                              >
                                <span>Launch Feature in App ({feature.routePath}) →</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Tab 2: Comprehensive FAQ Section */}
        {activeTab === "faq" && (
          <div className="space-y-4">
            <div className="rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-surface)]/50 p-4 mb-2">
              <h2 className="text-gm-base font-bold text-[var(--gm-text)] flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[var(--gm-accent-strong)]" />
                <span>Frequently Asked Questions &amp; Technical Reference</span>
              </h2>
              <p className="text-gm-xs text-[var(--gm-text-muted)] mt-1">
                Everything you need to know about Grimoire's local-first architecture, zero-knowledge privacy, file formats, and multi-device synchronization.
              </p>
            </div>

            <div className="space-y-3">
              {filteredFaq.map((faq) => {
                const isOpen = expandedFaq[faq.id] ?? false;
                return (
                  <article
                    key={faq.id}
                    className="rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] overflow-hidden transition-all hover:border-[var(--gm-border-strong)]"
                  >
                    <div
                      onClick={() => toggleFaq(faq.id)}
                      className="p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer select-none hover:bg-[var(--gm-surface)]/40 transition-colors"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-cv bg-[var(--gm-surface)] border border-[var(--gm-border)] text-[var(--gm-accent-strong)] font-semibold">
                            {faq.category}
                          </span>
                        </div>
                        <h3 className="text-gm-sm sm:text-gm-base font-bold text-[var(--gm-text)] leading-snug pt-0.5">
                          {faq.question}
                        </h3>
                      </div>
                      <div className="shrink-0 pt-1 text-[var(--gm-text-muted)]">
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>

                    {isOpen && (
                      <div className="border-t border-[var(--gm-border)] p-4 sm:p-5 bg-[var(--gm-bg)]/40 space-y-3">
                        <p className="text-gm-xs sm:text-gm-sm text-[var(--gm-text)] leading-relaxed">
                          {faq.answer}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {faq.highlights.map((hl, i) => (
                            <span
                              key={i}
                              className="rounded-cv bg-[var(--gm-surface)] border border-[var(--gm-border)] px-2 py-0.5 text-[10px] font-medium text-[var(--gm-accent-strong)]"
                            >
                              ✦ {hl}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FeaturesGuide;
'''

with open(r'c:\Users\67rah\Desktop\Chronciles Vault\chronicles-vault\apps\client\src\routes\FeaturesGuide.tsx', 'w', encoding='utf-8') as f:
    f.write(FEATURES_GUIDE_CONTENT.strip() + '\n')

print("FeaturesGuide.tsx written successfully!")
