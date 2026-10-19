import * as React from "react";
import {
  ArrowLeft,
  BookOpen,
  Camera,
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
  HardDrive,
  Image as ImageIcon,
  Layers,
  ListChecks,
  Lock,
  Maximize2,
  MessageSquare,
  Palette,
  Play,
  Radar,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";

export interface FeatureStepItem {
  readonly id: string;
  readonly number: string;
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

const ALL_TINY_FEATURES: readonly FeatureStepItem[] = [
  // 1. SANCTUM ROOMS & THEMES
  {
    id: "room-preloader-profiles",
    number: "01",
    category: "room-themes",
    categoryLabel: "Sanctum Room & Themes",
    title: "Interactive Sanctum Room Preloader & User Room Profiles",
    subtitle: "Instant-load architectural reading room with background session hydration & profile switching.",
    whyItMatters:
      "Your 'Room' is your personal reading profile and sanctuary. Instead of staring at a blank white spinner while thousands of chapters hydrate, the Room opens in <30ms with interactive 3D lighting while your session loads in the background.",
    routePath: "/home",
    shortcutOrBadge: "Homepage / Lobby",
    steps: [
      "Open Grimoire to land immediately inside the animated Sanctum Room lobby.",
      "Move your cursor across the room to tilt the 3D bookshelves and aim the volumetric desk lamp.",
      "Click the Desk Lamp shade to cycle warm ambient light intensity while background hydration completes.",
      "Use the 'Active Room Profile' switcher to switch between profiles (e.g., Main Sanctum, Night Xianxia Study, Manga Lounge) or create a custom Room profile.",
      "Click 'Enter My Room ✦' (or press Enter) once the counter hits 100% to trigger the iris clip-path reveal into your workspace.",
    ],
    screenshotCaption: "Screenshot #01: Sanctum Room Homepage with 3D Bookshelf Stage, Room Profile Switcher & 'Enter My Room' CTA.",
    wireframeHighlights: ["3D Parallax Bookshelves", "00% → 100% Kinetic Telemetry", "Room Profile Selector", "Enter My Room CTA"],
  },
  {
    id: "three-distinct-themes",
    number: "02",
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
    screenshotCaption: "Screenshot #02: Theme Switcher dropdown & side-by-side comparison of Midnight Arcana, Parchment & Ink, and Blossom Ascendant.",
    wireframeHighlights: ["Midnight Arcana (#060913)", "Parchment & Ink (#f7f1e3)", "Blossom Ascendant (#1c070e)", "Per-Theme Cover Palettes"],
  },
  {
    id: "performance-profiles",
    number: "03",
    category: "room-themes",
    categoryLabel: "Sanctum Room & Themes",
    title: "Adaptive Performance Profiles (Full / Balanced / Lite)",
    subtitle: "Control GPU glass blur, shadow depth, motion duration, and row virtualization buffers.",
    whyItMatters:
      "Keeps scrolling at a locked 60–120 FPS even on battery-saving laptops or mobile devices with 5,000+ works.",
    routePath: "/settings",
    shortcutOrBadge: "Settings → Performance",
    steps: [
      "Navigate to Settings from the left Sidebar or mobile 'More' menu.",
      "Locate the Performance Profile selector.",
      "Choose 'Full' for maximum backdrop-blur glassmorphism and 80-item virtualization buffers.",
      "Choose 'Lite' to disable backdrop filters, collapse multi-layer shadows, and zero out transition latency.",
    ],
    screenshotCaption: "Screenshot #03: Settings Performance Profile selector showing Full, Balanced, and Lite modes.",
    wireframeHighlights: ["GPU Blur Toggle", "Virtual Buffer Sizing", "Zero-Latency Lite Mode"],
  },
  {
    id: "global-command-palette",
    number: "04",
    category: "room-themes",
    categoryLabel: "Sanctum Room & Themes",
    title: "Global Command Palette & Keyboard Navigation",
    subtitle: "Jump to any Work, route, theme, or quick action without touching the mouse.",
    whyItMatters:
      "Power readers can search their entire library, create a new Work, or lock their Private Vault in under 1 second.",
    routePath: "/",
    shortcutOrBadge: "Ctrl+K / Cmd+K",
    steps: [
      "Press Ctrl+K (or Cmd+K on macOS) from anywhere in the app, or click the search command button in the top header.",
      "Type any Work title, creator name, route name (e.g. 'Return Desk', 'Vault'), or action ('New Work').",
      "Use Up/Down arrow keys and press Enter to execute or navigate immediately.",
      "Press Ctrl+Shift+L at any time to emergency-lock the Private Vault.",
    ],
    screenshotCaption: "Screenshot #04: Global Command Palette modal filtering Works, Routes, and Quick Actions.",
    wireframeHighlights: ["Instant Fuzzy Search", "Keyboard Arrow Navigation", "Quick Create Work Trigger"],
  },

  // 2. LIBRARY & CATALOG VIEWS
  {
    id: "library-four-view-modes",
    number: "05",
    category: "library-views",
    categoryLabel: "Library & Catalog Views",
    title: "Four Library View Modes (Grid, Compact, Table & Kanban Board)",
    subtitle: "Switch seamlessly between cover-art galleries, high-density spreadsheets, and status columns.",
    whyItMatters:
      "Browse visually by cover art in Grid mode, audit 50 titles at once in Table mode, or drag-manage your reading pipeline in Kanban Board mode.",
    routePath: "/library",
    shortcutOrBadge: "Library Top-Right Toggle",
    steps: [
      "Open the Library route (/library).",
      "Click the View Mode toggle group in the top-right filter bar.",
      "Select 'Grid' for rich cover cards with progress bars, status chips, and hover 'Continue' buttons.",
      "Select 'Compact' for high-density 8-column cover thumbnails.",
      "Select 'Table' for a structured row layout showing exact chapter anchors, health dots, and relative timestamps.",
      "Select 'Board' to group all Works into vertical columns by Personal State (Reading, Waiting, Stalled, Planned, Completed).",
    ],
    screenshotCaption: "Screenshot #05: Library View Toggle switching between Grid, Compact, Table, and Kanban Board layouts.",
    wireframeHighlights: ["Virtualized Cover Grid", "8-Col Compact Shelf", "Tabular Audit Rows", "Kanban Status Columns"],
  },
  {
    id: "library-search-filter-sort",
    number: "06",
    category: "library-views",
    categoryLabel: "Library & Catalog Views",
    title: "Multi-Facet Library Search, Filtering & Sorting",
    subtitle: "Filter by Medium, Reading Status, Genre, Tag, or Source Health and sort in real time.",
    whyItMatters:
      "Instantly answer questions like 'Which Manhwa am I currently Waiting for Updates on, sorted by highest progress?'",
    routePath: "/library",
    shortcutOrBadge: "Shortcut: /",
    steps: [
      "Press '/' or click the Library search box to search across Titles, Original Titles, Alternative Titles, Aliases, Creators, Genres, and Tags.",
      "Use the Medium dropdown to filter by Novel, Web Novel, Light Novel, Manga, Manhwa, Manhua, Anime, Donghua, or Comic.",
      "Use the Status dropdown to isolate Reading, Watching, Waiting, Stalled, Paused, Planned, Completed, or Dropped works.",
      "Use the Sort dropdown to order by Last Read/Active, Recently Updated, Title (A–Z / Z–A), or Highest Chapter Progress.",
      "Click 'Reset' whenever active filters are applied to clear all constraints in one click.",
    ],
    screenshotCaption: "Screenshot #06: Library Filter & Sort bar with active filter badge counter and mobile bottom-sheet drawer.",
    wireframeHighlights: ["Alias & Creator Search", "Medium & Status Filters", "4 Sort Modes", "1-Click Filter Reset"],
  },
  {
    id: "library-bulk-operations",
    number: "07",
    category: "library-views",
    categoryLabel: "Library & Catalog Views",
    title: "Bulk Multi-Select & Batch Operations Bar",
    subtitle: "Batch-update reading status, shelf priority tiers, tags, lists, vault privacy, or archive state.",
    whyItMatters:
      "Reorganizing 25 imported works takes 5 seconds instead of opening 25 individual detail pages.",
    routePath: "/library",
    shortcutOrBadge: "Library → Select Mode",
    steps: [
      "In the Library header, click the 'Select' button to enter Bulk Selection Mode.",
      "Click any Work cards (or click 'Select All Filtered') to check multiple items.",
      "Use the floating Bulk Action Bar to batch-set Personal State (e.g. mark 10 works as 'Completed').",
      "Batch-assign Shelf Tier (★ Favorite / ✦ Highlight), append a custom Tag to all selected works, add them to a Custom List, move them to the Private Vault, or Archive them.",
    ],
    screenshotCaption: "Screenshot #07: Library Bulk Selection mode with multi-selected Work cards and batch action toolbar.",
    wireframeHighlights: ["Select All Filtered", "Batch Status & Tier", "Bulk Tag Injector", "Batch Move to Vault"],
  },
  {
    id: "create-work-modal",
    number: "08",
    category: "library-views",
    categoryLabel: "Library & Catalog Views",
    title: "Quick Create Work Modal with Initial Anchor & Source",
    subtitle: "Register any new Chronicle with its medium, starting chapter/episode, tags, and primary URL.",
    whyItMatters:
      "Captures a new work, its reading relationship, its initial progress event, and its preferred access path in a single atomic transaction.",
    routePath: "/library",
    shortcutOrBadge: "+ Add Work Button",
    steps: [
      "Click '+ Add Work' in the Library header (or trigger 'Create New Work' from Ctrl+K).",
      "Enter the Title, Medium (Manga, Manhwa, Web Novel, Anime, etc.), and initial Personal State.",
      "Optionally enter your current Chapter/Episode number, Cover Image URL, Genres/Tags, and starting Source URL.",
      "Click 'Save Work' to immediately mint the Work and see it appear at the top of your Library.",
    ],
    screenshotCaption: "Screenshot #08: Create Work Modal with medium selector, initial chapter anchor, and source URL fields.",
    wireframeHighlights: ["Atomic Work Creation", "Initial Chapter Input", "Instant Source Binding"],
  },

  // 3. WORK DETAIL & RICH METADATA
  {
    id: "work-detail-progress-stepper",
    number: "09",
    category: "work-detail",
    categoryLabel: "Work Detail & Metadata",
    title: "One-Click Progress Stepper (+1 / -1) & Custom Anchor Recording",
    subtitle: "Increment or decrement chapters/episodes with instant toast feedback and automatic timestamping.",
    whyItMatters:
      "Every progress tick updates your Reading Relationship's lastActiveAt timestamp, recalculates unread update counts, and logs a Progress history entry.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Work Detail Hero",
    steps: [
      "Click any Work card in your Library to open its Work Detail page.",
      "In the hero control bar, click '+' to advance 1 chapter/episode or '−' to step back.",
      "Watch the progress bar, percentage, and 'New Material' badge update instantaneously.",
      "Click 'Resume Reading' to automatically launch the best linked local ebook, local video player, or web source.",
    ],
    screenshotCaption: "Screenshot #09: Work Detail Hero section with +1/-1 chapter stepper, progress bar, and Resume button.",
    wireframeHighlights: ["+1 / -1 Chapter Stepper", "Progress Percentage Bar", "Smart Resume Launcher"],
  },
  {
    id: "cover-art-anilist-upload",
    number: "10",
    category: "work-detail",
    categoryLabel: "Work Detail & Metadata",
    title: "AniList Official Cover Auto-Fetch, Custom Image Upload & Deterministic Fallback",
    subtitle: "Fetch high-res official covers via GraphQL, upload local PNG/WebP art, or use theme-aware procedural covers.",
    whyItMatters:
      "Even obscure web novels or offline files get beautiful cover art—either fetched automatically from AniList, uploaded from disk, or rendered with deterministic typography.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Hover Cover Art",
    steps: [
      "On any Work Detail page, hover over the left Hero Cover image to reveal the Cover Actions overlay.",
      "Click 'Auto-Fetch Cover' to query the AniList GraphQL API for the official extra-large cover art.",
      "Click 'Upload Image' to pick a local PNG, JPG, or WebP file from your device (stored offline as a data URL).",
      "Click 'Paste Image URL' to bind any external image link.",
    ],
    screenshotCaption: "Screenshot #10: Work Detail Cover Art hover overlay showing Auto-Fetch from AniList, Upload File, and URL input.",
    wireframeHighlights: ["AniList GraphQL Fetch", "Offline Image Upload", "Theme-Reactive Fallback"],
  },
  {
    id: "rich-metadata-editor",
    number: "11",
    category: "work-detail",
    categoryLabel: "Work Detail & Metadata",
    title: "Rich Bibliographic Metadata, Creators, Ratings & Content Warnings Editor",
    subtitle: "Edit personal 0–10 rating, shelf tier, total chapters/volumes, original title/language, creators, and warnings.",
    whyItMatters:
      "Preserves complete archival bibliography including Author/Artist credits, publication dates, and content advisories.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Overview Tab → Edit Metadata",
    steps: [
      "Open a Work Detail page and stay on the 'Overview' tab.",
      "Use the Personal State dropdown and Shelf Priority Tier selector (Standard, ★ Favorite, ✦ Highlight) for quick status updates.",
      "Click the 'Edit Metadata' button to open the full bibliographic editor.",
      "Set your Personal Rating (0–10), Primary Creator & Role (Author, Artist, Studio), Total Chapters/Volumes/Pages, Original Title, Language, Start/End Dates, Content Rating, and comma-separated Content Warnings.",
      "Click 'Save Metadata' to persist changes immediately.",
    ],
    screenshotCaption: "Screenshot #11: Work Detail Overview tab with expanded Bibliographic Metadata Editor.",
    wireframeHighlights: ["0–10 Personal Rating", "Creator & Role Credits", "Total Chapters/Volumes", "Content Warnings"],
  },

  // 4. ACCESS PATHS, SOURCE HEALTH & LOCAL VIDEO PLAYER
  {
    id: "multi-access-paths-health",
    number: "12",
    category: "sources-video",
    categoryLabel: "Sources & Local Video Player",
    title: "Multi-Source Access Paths, Preferred Source Pinning & Live Health Check",
    subtitle: "Attach unlimited reading/watching URLs, RSS feeds, and local files to a single Work and probe their health.",
    whyItMatters:
      "When a translation site goes offline, your Work isn't lost—simply switch the 'Preferred' star to your backup mirror or local file.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Work Detail → Access Paths Tab",
    steps: [
      "Open any Work Detail page and click the 'Access Paths' tab.",
      "Click '+ Add Source' and enter a Label (e.g. 'Official MangaPlus'), URL, and optional Provider name.",
      "Click 'Set Preferred' on any source to make it the default target for 'Resume Reading'.",
      "Click the circular Refresh icon on any source to run a live HTTP/Local Health Probe and update its status badge (Healthy, Degraded, Unavailable, Local).",
    ],
    screenshotCaption: "Screenshot #12: Access Paths tab showing multiple sources, Preferred badge, and Live Health Probe indicator.",
    wireframeHighlights: ["Decoupled Access Paths", "Preferred Source Pin", "Live HTTP Health Probe"],
  },
  {
    id: "local-video-linking-player",
    number: "13",
    category: "sources-video",
    categoryLabel: "Sources & Local Video Player",
    title: "Local Video File Linking & Built-In Inline HTML5 Video Player",
    subtitle: "Link local Anime/Donghua video files (MP4, MKV, WebM) and watch episodes directly inside Work Detail.",
    whyItMatters:
      "Tracks your local anime/donghua episode files alongside your manga and novels, with instant in-app video playback and session file re-attachment.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Access Paths → Link Local Video",
    steps: [
      "Go to a Work Detail page → 'Access Paths' tab and click '+ Link Local Video'.",
      "Click 'Pick Video File' to select an MP4, WebM, or MKV file from your computer/device (auto-fills filename, MIME type, and MB size) or type a local disk path.",
      "Click 'Link Video Reference'—the source is saved with a 'LOCAL VIDEO' badge and the inline video player opens automatically.",
      "Use the 'Watch / Hide Player' toggle button at any time to play, pause, scrub, or fullscreen the video.",
      "After a browser reload (when browser sandbox clears temporary blob URLs), click 'Select File to Play' inside the player panel to re-attach the local video file in 1 click.",
    ],
    screenshotCaption: "Screenshot #13: Access Paths tab with 'LOCAL VIDEO' badge and active Inline HTML5 Video Player.",
    wireframeHighlights: ["Pick Video File Dialog", "Inline HTML5 Video Player", "Session Re-Attach Button", "Copy Disk Path"],
  },

  // 5. BUILT-IN READER & LOCAL SHELF
  {
    id: "local-shelf-opfs-import",
    number: "14",
    category: "reader-shelf",
    categoryLabel: "Built-In Ebook & Comic Reader",
    title: "Offline Local Shelf (OPFS Storage) & Drag-and-Drop File Import",
    subtitle: "Import EPUB, PDF, and CBZ/CBR files into browser Origin Private File System for 100% offline reading.",
    whyItMatters:
      "Your imported books are stored persistently inside the browser/device vault—no internet connection or external server required.",
    routePath: "/shelf",
    shortcutOrBadge: "Sidebar → Local Shelf",
    steps: [
      "Navigate to 'Local Shelf' (/shelf) from the Sidebar or bottom navigation bar.",
      "Drag and drop any .epub, .pdf, or .cbz file onto the upload dropzone (or click 'Import Local Files').",
      "Optionally click 'Load Demo Books' to auto-generate sample EPUB, PDF, and CBZ files to test all three readers immediately.",
      "Link any imported file to an existing Work in your Library using the 'Link to Work' dropdown on the file card.",
    ],
    screenshotCaption: "Screenshot #14: Local Shelf route showing imported EPUB, PDF, and CBZ files stored in OPFS.",
    wireframeHighlights: ["OPFS Offline Storage", "EPUB / PDF / CBZ Support", "1-Click Demo Book Seeder", "Work Linking"],
  },
  {
    id: "epub-reflowable-reader",
    number: "15",
    category: "reader-shelf",
    categoryLabel: "Built-In Ebook & Comic Reader",
    title: "Built-In EPUB Reflowable Reader with Typography & Theme Controls",
    subtitle: "Read novels with customizable font family, font size, line height, column width, reader theme, and TOC drawer.",
    whyItMatters:
      "Provides a distraction-free novel reading environment that automatically saves your chapter and scroll position back to your Work.",
    routePath: "/shelf",
    shortcutOrBadge: "Local Shelf → Open EPUB",
    steps: [
      "From Local Shelf (or Work Detail 'Resume Reading'), open any EPUB file.",
      "Click the Table of Contents icon to jump between chapters.",
      "Open the Reader Settings popover to customize Font Size, Line Spacing, Page Margin Width, and Reader Surface Theme (Dark, Sepia, Light).",
      "Use Previous/Next Chapter buttons or keyboard arrows; your reading progress percentage and chapter anchor save automatically.",
    ],
    screenshotCaption: "Screenshot #15: Built-in EPUB Reader with Table of Contents drawer and typography customization panel.",
    wireframeHighlights: ["Chapter TOC Drawer", "Font & Line-Height Tuning", "Auto Progress Sync"],
  },
  {
    id: "pdf-canvas-text-reader",
    number: "16",
    category: "reader-shelf",
    categoryLabel: "Built-In Ebook & Comic Reader",
    title: "Built-In PDF Reader with High-DPI Canvas & Selectable Text Layer",
    subtitle: "Render scanned or typeset PDF volumes with zoom controls, page jumper, and theme-aware text selection.",
    whyItMatters:
      "Reads light novel PDFs and artbooks directly inside Grimoire with crisp text selection for copying quotes into Memories.",
    routePath: "/shelf",
    shortcutOrBadge: "Local Shelf → Open PDF",
    steps: [
      "Open any PDF file from the Local Shelf or Work Detail.",
      "Use the Zoom In / Zoom Out controls or fit-to-page options in the reader toolbar.",
      "Highlight any passage on the page using the transparent selectable text layer to copy quotes.",
      "Step through pages with keyboard Left/Right arrows while page progress persists automatically.",
    ],
    screenshotCaption: "Screenshot #16: Built-in PDF Reader showing page rendering, zoom toolbar, and selectable text layer.",
    wireframeHighlights: ["PDF.js Canvas Engine", "Selectable Text Layer", "Page & Zoom Persistence"],
  },
  {
    id: "cbz-manga-comic-reader",
    number: "17",
    category: "reader-shelf",
    categoryLabel: "Built-In Ebook & Comic Reader",
    title: "Built-In CBZ Comic & Manga Reader (RTL, Double-Page Spread & Fit Modes)",
    subtitle: "Read archived manga/comic chapters with Right-to-Left manga direction, 2-page spreads, and webtoon vertical scroll.",
    whyItMatters:
      "Tailored specifically for manga (RTL double-page spreads) and manhwa/webtoons (vertical fit-width continuous reading).",
    routePath: "/shelf",
    shortcutOrBadge: "Local Shelf → Open CBZ",
    steps: [
      "Open any .cbz archive from the Local Shelf.",
      "Toggle Reading Direction between LTR (Western Comics) and RTL (Japanese Manga).",
      "Switch Page Layout between Single Page, Double-Page Spread, or Continuous Vertical Scroll.",
      "Toggle image scaling between Fit Height, Fit Width, and Original Size.",
    ],
    screenshotCaption: "Screenshot #17: Built-in CBZ Manga Reader in Double-Page RTL mode with page scrubber.",
    wireframeHighlights: ["RTL Manga Mode", "Double-Page Spreads", "Fit Width / Fit Height"],
  },

  // 6. RETURN DESK & HIATUS RECOVERY
  {
    id: "return-desk-intelligence",
    number: "18",
    category: "return-desk",
    categoryLabel: "Return Desk & Context Recovery",
    title: "The Return Desk — Intelligent Hiatus & Queue Prioritization",
    subtitle: "Automatically surfaces works with New Material, Long Hiatuses, Near Completion, or Quick Wins.",
    whyItMatters:
      "Eliminates 'what should I read next?' decision paralysis by scoring your library based on unread chapters, hiatus duration, and completion proximity.",
    routePath: "/return-desk",
    shortcutOrBadge: "Sidebar → Return Desk",
    steps: [
      "Click 'Return Desk' (/return-desk) in the Sidebar or bottom navigation bar.",
      "Filter return candidates by signal type: All Signals, New Material Available, Long Hiatus Recovery, Near Completion, or Stalled.",
      "Review each Return Card's signal reason badge, unread chapter count, and time since last active.",
      "Click 'Snooze 7d' if you aren't ready yet, or click 'Resume' to jump back in.",
    ],
    screenshotCaption: "Screenshot #18: Return Desk dashboard showing prioritized Return Cards with signal badges and unread counts.",
    wireframeHighlights: ["Signal-Driven Ranking", "Unread Chapter Delta", "1-Click Snooze & Resume"],
  },
  {
    id: "memory-refresher-drawer",
    number: "19",
    category: "return-desk",
    categoryLabel: "Return Desk & Context Recovery",
    title: "Spoiler-Safe Memory Refresher Drawer (30-Second Context Recovery)",
    subtitle: "Review your own past quotes, character notes, and last-read anchor in a side drawer before resuming a stalled work.",
    whyItMatters:
      "Googling a character name after a 6-month break gets you spoiled by wiki death statuses. The Memory Refresher shows only what YOU knew up to your exact chapter.",
    routePath: "/return-desk",
    shortcutOrBadge: "Return Card → Refresh Memory",
    steps: [
      "On any Return Card in the Return Desk, click the 'Refresh Memory' button.",
      "A slide-over drawer opens displaying your last recorded Chapter/Episode anchor, when you paused, and your pinned Memory Cards (Quotes, Notes, Theories, Reactions).",
      "Read through your past notes to recall the plot and character alliances in 30 seconds.",
      "Click 'Resume Reading Now' at the bottom of the drawer to launch straight into the work.",
    ],
    screenshotCaption: "Screenshot #19: Memory Refresher Drawer open over the Return Desk showing spoiler-safe notes and quotes.",
    wireframeHighlights: ["Spoiler-Safe Recap", "Pinned Quotes & Theories", "Direct Resume Action"],
  },

  // 7. MEMORIES, LORE NOTEBOOK & ADAPTATION GRAPH
  {
    id: "memories-quotes-timeline",
    number: "20",
    category: "memory-lore",
    categoryLabel: "Memories, Lore & Graph",
    title: "Personal Memory (Quotes, Theories, Reactions & Bookmarks)",
    subtitle: "Attach timestamped, chapter-anchored memories to any Work and browse them globally in the Memory feed.",
    whyItMatters:
      "Turns passive consumption into a permanent personal commonplace book of your favorite lines, plot theories, and emotional reactions.",
    routePath: "/memory",
    shortcutOrBadge: "Sidebar → Memory",
    steps: [
      "Inside any Work Detail page → 'Memories' tab, click '+ Add Memory' to record a Quote, Note, Theory, Reaction, or Bookmark tied to your current chapter.",
      "Or navigate to the global 'Memory' route (/memory) to browse and search every memory across your entire fiction life.",
      "Filter memories by type (Quote, Theory, Note, Reaction) or search by keyword.",
      "Click any Memory Card's work link to jump directly back to that Work Detail page.",
    ],
    screenshotCaption: "Screenshot #20: Global Memory timeline and Work Detail Memories tab with Quote and Theory cards.",
    wireframeHighlights: ["Chapter-Anchored Quotes", "Plot Theories & Reactions", "Global Memory Search"],
  },
  {
    id: "structured-lore-notebook",
    number: "21",
    category: "memory-lore",
    categoryLabel: "Memories, Lore & Graph",
    title: "Per-Work Structured Lore & Worldbuilding Notebook",
    subtitle: "Maintain a spoiler-free encyclopedia of Characters, Factions, Locations, Cultivation Realms, and Artifacts per Work.",
    whyItMatters:
      "Essential for sprawling web novels and fantasy epics with 100+ named characters, power tiers, and complex political factions.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Work Detail → Notebook Tab",
    steps: [
      "Open a Work Detail page and select the 'Notebook' tab.",
      "Filter or create entries by Lore Category: Character, Location, Faction, World Rule / Power System, or General Note.",
      "Add aliases, role descriptions, and markdown notes for each character or realm.",
      "Pin important entries so they stay at the top of your Work Notebook while reading.",
    ],
    screenshotCaption: "Screenshot #21: Work Detail Lore Notebook tab showing Character, Faction, and Power System cards.",
    wireframeHighlights: ["Character & Faction Cards", "Power System Tracking", "Pinned Lore Entries"],
  },
  {
    id: "adaptation-relation-graph",
    number: "22",
    category: "memory-lore",
    categoryLabel: "Memories, Lore & Graph",
    title: "Cross-Medium Adaptation & Franchise Relation Graph",
    subtitle: "Link Web Novels, Light Novels, Manga, Manhwa, Anime Seasons, Sequels, Prequels, and Spin-offs.",
    whyItMatters:
      "Shows your entire franchise universe in one visual tree—know immediately that Anime Episode 24 corresponds to Manhwa Chapter 110 and Novel Chapter 142.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Work Detail → Relations Tab",
    steps: [
      "Open any Work Detail page and click the 'Relations' tab.",
      "View the visual Relation Tree grouping Adapts / Adapted By, Precede / Sequel, Spin-Off, and Shared Universe links.",
      "Click '+ Link Related Work', choose another Work from your Library, select the relationship type (e.g. 'Adaptation', 'Sequel'), and add an optional transition note (e.g. 'Anime S1 ends at Novel Ch. 65').",
      "Click any linked Work node to navigate across mediums instantaneously.",
    ],
    screenshotCaption: "Screenshot #22: Work Detail Relations tab displaying cross-medium Adaptation & Sequel tree.",
    wireframeHighlights: ["Novel ↔ Manhwa ↔ Anime Links", "Transition Chapter Notes", "1-Click Cross-Navigation"],
  },
  {
    id: "fandom-wiki-links-panel",
    number: "23",
    category: "memory-lore",
    categoryLabel: "Memories, Lore & Graph",
    title: "Curated Fandom, Wiki, Subreddit & Community Links Panel",
    subtitle: "Save trusted character wikis, discussion threads, author socials, and art galleries per Work.",
    whyItMatters:
      "Keeps all community resources, tier lists, and official author links organized right inside the Work's dossier.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Work Detail → Fandom Tab",
    steps: [
      "Open a Work Detail page and switch to the 'Fandom & Links' tab.",
      "Click '+ Add Fandom Link' and choose a category (Wiki, Community/Reddit, Official, Fan Art, Discussion).",
      "Add a spoiler warning note if a wiki link contains end-of-series spoilers.",
    ],
    screenshotCaption: "Screenshot #23: Work Detail Fandom & Links tab with categorized community resources.",
    wireframeHighlights: ["Wiki & Community Links", "Category Badges", "Quick External Launch"],
  },

  // 8. RADAR TRIAGE, UPDATES & MERGE WIZARD
  {
    id: "radar-capture-triage",
    number: "24",
    category: "radar-merge",
    categoryLabel: "Radar, Updates & Merge",
    title: "Radar Capture Inbox & Triage Workflow",
    subtitle: "Dump intriguing recommendations, URLs, and titles into Radar without polluting your curated Library until verified.",
    whyItMatters:
      "Separates 'I saw someone mention this title on Reddit/TikTok' from your committed Library catalog.",
    routePath: "/radar",
    shortcutOrBadge: "Sidebar → Radar",
    steps: [
      "Open the 'Radar' route (/radar) or click 'Quick-Capture to Radar' from the Homepage Portal Directory.",
      "Click '+ Capture to Radar' to quickly log a title, URL, medium, priority level, and why it caught your eye.",
      "Filter Radar captures by Priority, Medium, or Triage Status, and bookmark high-interest items.",
      "When ready to start reading, click 'Promote to Library' on any Radar card to convert it into a full Library Work.",
    ],
    screenshotCaption: "Screenshot #24: Radar Capture Queue with priority badges, filters, and 'Promote to Library' triage action.",
    wireframeHighlights: ["Zero-Friction Capture", "Priority & Medium Filters", "1-Click Promote to Library"],
  },
  {
    id: "updates-certainty-inbox",
    number: "25",
    category: "radar-merge",
    categoryLabel: "Radar, Updates & Merge",
    title: "Updates Feed with Release Certainty Badges & Snooze",
    subtitle: "Track newly detected chapters/episodes with Confirmed, Inferred, or Scheduled certainty indicators.",
    whyItMatters:
      "Distinguishes between verified RSS/API chapter releases ('Confirmed') and estimated release cadences ('Scheduled' / 'Inferred').",
    routePath: "/updates",
    shortcutOrBadge: "Sidebar → Updates",
    steps: [
      "Click 'Updates' (/updates) in the Sidebar (notice the live unread badge count).",
      "Inspect new chapter/episode release cards showing the numeric delta (e.g. '+3 new chapters since Ch. 112') and Update Certainty Badge.",
      "Click 'Mark Seen', 'Snooze', or 'Read Now' to open the preferred source and clear the notification.",
    ],
    screenshotCaption: "Screenshot #25: Updates Inbox showing unread chapter releases, certainty badges, and batch mark-seen controls.",
    wireframeHighlights: ["Confirmed / Inferred Badges", "Unread Chapter Delta", "Snooze & Dismiss"],
  },
  {
    id: "non-destructive-merge-wizard",
    number: "26",
    category: "radar-merge",
    categoryLabel: "Radar, Updates & Merge",
    title: "Non-Destructive Duplicate Work Merge Wizard",
    subtitle: "Combine two duplicate Works while preserving 100% of both works' Access Paths, Memories, Tags, and Highest Progress.",
    whyItMatters:
      "Often you accidentally track a work under its Korean/Japanese romanized title AND its English title. Merging them never deletes a single note or source.",
    routePath: "/work/01JPK3M9V0WORK000000000001",
    shortcutOrBadge: "Work Detail → Merge",
    steps: [
      "On any Work Detail page, click the 'Merge' button in the top action bar.",
      "Search and select the duplicate candidate Work (the wizard automatically scores likely duplicates by title/alias similarity).",
      "Choose which Title, Cover, and Primary State to keep while previewing the unified Access Paths, Memories, and Aliases.",
      "Confirm the merge—the secondary title becomes a searchable Alias on the surviving Work and zero data is lost.",
    ],
    screenshotCaption: "Screenshot #26: 3-Step Non-Destructive Merge Wizard showing side-by-side field resolution.",
    wireframeHighlights: ["Fuzzy Duplicate Detection", "Zero-Data-Loss Union", "Automatic Alias Preservation"],
  },

  // 9. LISTS, CATEGORIES, PRIVATE VAULT & DATA PORTABILITY
  {
    id: "curated-lists-publication",
    number: "27",
    category: "vault-backup",
    categoryLabel: "Lists, Vault & Portability",
    title: "Curated Reading Lists & Shareable Publication Cards",
    subtitle: "Build themed collections with custom ordering, curator notes, and exportable share cards.",
    whyItMatters:
      "Create lists like 'Top 10 Time-Loop Regression Novels' or '2026 Seasonal Anime Watchlist' and generate clean shareable summaries.",
    routePath: "/lists",
    shortcutOrBadge: "Sidebar → Lists",
    steps: [
      "Open 'Lists' (/lists) from the Sidebar and click '+ Create List'.",
      "Add Works to the list from the List editor or via the Library Bulk Action bar.",
      "Open the Publication Panel to generate a shareable read-only card or JSON export of your curated list.",
    ],
    screenshotCaption: "Screenshot #27: Curated Lists view with custom work ordering and Publication Share panel.",
    wireframeHighlights: ["Themed Collections", "Curator Annotations", "Shareable Publication Card"],
  },
  {
    id: "custom-dynamic-categories",
    number: "28",
    category: "vault-backup",
    categoryLabel: "Lists, Vault & Portability",
    title: "My Categories & Custom Taxonomy Organizer",
    subtitle: "Organize works into personal shelves and custom genre/theme taxonomies.",
    whyItMatters:
      "Lets you define your own classification system beyond standard publisher genres.",
    routePath: "/categories",
    shortcutOrBadge: "Sidebar → My Categories",
    steps: [
      "Navigate to 'My Categories' (/categories).",
      "Create custom categories with custom icons/colors and assign Works to them.",
      "Click any category card to filter and inspect all Works inside that shelf.",
    ],
    screenshotCaption: "Screenshot #28: My Categories dashboard with custom shelf cards and work counts.",
    wireframeHighlights: ["Custom Shelf Taxonomy", "Color & Icon Badges", "Instant Category Filtering"],
  },
  {
    id: "discover-recommendations",
    number: "29",
    category: "vault-backup",
    categoryLabel: "Lists, Vault & Portability",
    title: "Discover Engine & Taste-Matched Recommendations",
    subtitle: "Explore curated recommendations matched against your favorite genres, tags, and completed works.",
    whyItMatters:
      "Surfaces high-affinity titles based on the exact tropes and mediums you actually finish.",
    routePath: "/discover",
    shortcutOrBadge: "Sidebar → Discover",
    steps: [
      "Open 'Discover' (/discover) from the Sidebar.",
      "Browse taste-matched clusters and trope spotlights.",
      "Click '+ Add to Library' or '+ Send to Radar' on any recommendation card.",
    ],
    screenshotCaption: "Screenshot #29: Discover route showing taste-matched fiction recommendations and trope clusters.",
    wireframeHighlights: ["Affinity Scoring", "Trope Spotlights", "1-Click Add to Library/Radar"],
  },
  {
    id: "zero-knowledge-private-vault",
    number: "30",
    category: "vault-backup",
    categoryLabel: "Lists, Vault & Portability",
    title: "Hardware-Accelerated Zero-Knowledge Private Vault with Auto-Lock",
    subtitle: "Protect sensitive or private Works behind hardware-accelerated zero-knowledge encryption and instant panic-lock.",
    whyItMatters:
      "Private works are completely invisible in the standard Library, Search, and Return Desk until you unlock the Private Vault with your passphrase.",
    routePath: "/vault",
    shortcutOrBadge: "Ctrl+Shift+L (Panic Lock)",
    steps: [
      "Navigate to 'Private Vault' (/vault) in the Sidebar footer.",
      "Set up your Vault Passphrase (derives an on-device cryptographic key).",
      "Move any Work into the Vault from Work Detail (Shield icon) or Library Bulk Actions.",
      "Lock the Vault manually or press Ctrl+Shift+L (also auto-locks after 15 minutes of inactivity or tab hide).",
    ],
    screenshotCaption: "Screenshot #30: Private Vault unlock screen and encrypted sanctum view.",
    wireframeHighlights: ["Zero-Knowledge Encryption", "On-Device Key Derivation", "Ctrl+Shift+L Panic Lock"],
  },
  {
    id: "cold-storage-archive",
    number: "31",
    category: "vault-backup",
    categoryLabel: "Lists, Vault & Portability",
    title: "Cold Storage Archive with Structured Reason & Snapshot Preservation",
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
    screenshotCaption: "Screenshot #31: Cold Storage Archive modal and Archive catalog with reflection notes and Unarchive button.",
    wireframeHighlights: ["Structured Archive Reasons", "Reflection Notes", "1-Click Unarchive Restore"],
  },
  {
    id: "data-transfer-bookmarks-import",
    number: "32",
    category: "vault-backup",
    categoryLabel: "Lists, Vault & Portability",
    title: "Full JSON Vault Backup, CSV Importer & Browser Bookmarks HTML Parser",
    subtitle: "Export your entire library to portable JSON, or bulk-import thousands of browser bookmarks and CSV rows.",
    whyItMatters:
      "Zero vendor lock-in. Bring 10 years of messy Chrome/Firefox manga bookmark folders into Grimoire in 30 seconds.",
    routePath: "/settings",
    shortcutOrBadge: "Settings → Data Transfer",
    steps: [
      "Go to Settings (/settings) and scroll to the 'Data Transfer & Portability' panel.",
      "Click 'Export Full Backup (.json)' to download a complete snapshot of all Works, Progress, Memories, Lists, and Access Paths.",
      "Click 'Import Browser Bookmarks (.html)' or 'Import CSV' to parse bookmark folders into candidate Works, review deduplication matches, and commit them to your Library.",
    ],
    screenshotCaption: "Screenshot #32: Settings Data Transfer panel showing JSON Backup Export, CSV Importer, and Browser Bookmarks HTML parser.",
    wireframeHighlights: ["1-Click JSON Vault Export", "Chrome/Firefox HTML Importer", "Smart Deduplication Preview"],
  },
];

const CATEGORY_TABS = [
  { id: "all", label: "All 32 Features", icon: Sparkles },
  { id: "room-themes", label: "Room & Themes", icon: Palette },
  { id: "library-views", label: "Library & Views", icon: BookOpen },
  { id: "work-detail", label: "Work Detail", icon: Layers },
  { id: "sources-video", label: "Sources & Video", icon: Film },
  { id: "reader-shelf", label: "Ebook/Comic Reader", icon: HardDrive },
  { id: "return-desk", label: "Return Desk", icon: RotateCcw },
  { id: "memory-lore", label: "Memory & Lore", icon: MessageSquare },
  { id: "radar-merge", label: "Radar & Merge", icon: Radar },
  { id: "vault-backup", label: "Vault & Backup", icon: Shield },
] as const;

const SCREENSHOT_STORAGE_KEY = "cv:feature_screenshots:v1";

const CORE_SCREENSHOT_ITEMS = [
  { id: "room-preloader-profiles", num: "01", name: "Sanctum Room Homepage & 3D Stage" },
  { id: "three-distinct-themes", num: "02", name: "Theme Switcher & 4 Atmospheric Palettes" },
  { id: "library-grid-shelf", num: "03", name: "Library Grid View & Cover Showcase" },
  { id: "library-dense-table", num: "04", name: "Library Spreadsheet / Dense Table View" },
  { id: "multi-select-bulk-actions", num: "05", name: "Multi-Select Bulk Actions Bar" },
  { id: "work-detail-hero-dossier", num: "06", name: "Work Detail Hero & Media Access Sources" },
  { id: "multi-source-access-paths", num: "07", name: "Multi-Source Streamer & Reader Paths" },
  { id: "local-video-player-modal", num: "08", name: "Embedded HTML5 Local Video Player" },
  { id: "epub-3d-reader", num: "09", name: "EPUB 3D Book Reader & Pagination" },
  { id: "pdf-vector-reader", num: "10", name: "Compact PDF Reader (Normalized Zoom)" },
  { id: "cbz-webtoon-reader", num: "11", name: "CBZ Comic/Manga Double-Page Reader" },
  { id: "txt-spread-reader", num: "12", name: "TXT 2-Page Book Reader with Page Turn" },
  { id: "return-desk-triage", num: "13", name: "Return Desk Urgent Priority & Activity Feed" },
  { id: "memories-quotes-timeline", num: "14", name: "Global Memories, Quotes & Lore Feed" },
  { id: "curated-lists-publication", num: "15", name: "Editorial Social Sharing Card Generator" },
  { id: "radar-capture-triage", num: "16", name: "Radar Browser Triage & Quick Capture" },
  { id: "updates-certainty-inbox", num: "17", name: "Updates Feed with Certainty Badges" },
  { id: "non-destructive-merge-wizard", num: "18", name: "Non-Destructive Duplicate Merge Wizard" },
  { id: "zero-knowledge-private-vault", num: "19", name: "Zero-Knowledge Private Vault Unlock" },
  { id: "cold-storage-archive", num: "20", name: "Cold Storage Archive & Retirement History" },
];

export interface FeaturesGuideProps {
  onNavigate?: (href: string) => void;
  onEnterRoomAndNavigate?: (href: string) => void;
}

export function FeaturesGuide({ onNavigate, onEnterRoomAndNavigate }: FeaturesGuideProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "missing" | "attached">("all");
  const [showChecklist, setShowChecklist] = React.useState<boolean>(false);
  const [expandedCards, setExpandedCards] = React.useState<Record<string, boolean>>(() => {
    // Default the first 3 cards open, others compact
    return {
      "room-preloader-profiles": true,
      "three-distinct-themes": true,
      "library-grid-shelf": true,
    };
  });

  const [customScreenshots, setCustomScreenshots] = React.useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(SCREENSHOT_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });

  const [activeUploadFeatureId, setActiveUploadFeatureId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const saveScreenshots = (next: Record<string, string>) => {
    setCustomScreenshots(next);
    try {
      window.localStorage.setItem(SCREENSHOT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota errors if very large uncompressed images are added
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file || !activeUploadFeatureId) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        saveScreenshots({
          ...customScreenshots,
          [activeUploadFeatureId]: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const attachedCount = React.useMemo(() => {
    return CORE_SCREENSHOT_ITEMS.filter((item) => Boolean(customScreenshots[item.id])).length;
  }, [customScreenshots]);

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const setAllCardsExpanded = (expanded: boolean) => {
    const next: Record<string, boolean> = {};
    for (const f of ALL_TINY_FEATURES) {
      next[f.id] = expanded;
    }
    setExpandedCards(next);
  };

  const scrollToFeature = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
  };

  const filteredFeatures = React.useMemo(() => {
    return ALL_TINY_FEATURES.filter((feature) => {
      if (selectedCategory !== "all" && feature.category !== selectedCategory) {
        return false;
      }
      const hasScreenshot = Boolean(customScreenshots[feature.id]);
      if (statusFilter === "attached" && !hasScreenshot) return false;
      if (statusFilter === "missing" && hasScreenshot) return false;

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return (
          feature.title.toLowerCase().includes(q) ||
          feature.subtitle.toLowerCase().includes(q) ||
          feature.whyItMatters.toLowerCase().includes(q) ||
          feature.categoryLabel.toLowerCase().includes(q) ||
          feature.steps.some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [selectedCategory, searchQuery, statusFilter, customScreenshots]);

  const triggerJump = (routePath: string) => {
    if (onEnterRoomAndNavigate) {
      onEnterRoomAndNavigate(routePath);
    } else if (onNavigate) {
      onNavigate(routePath);
    } else {
      window.location.href = routePath;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gm-bg)] text-[var(--gm-text)] pb-24">
      {/* Hidden file input for attaching screenshots */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

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
              <h1 className="text-gm-base sm:text-gm-lg font-bold tracking-tight text-[var(--gm-text)]">
                Help &amp; Feature Guide
              </h1>
              <p className="text-[11px] text-[var(--gm-text-muted)] hidden md:block">
                32 architectural capabilities, step-by-step instructions &amp; screenshot slots
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowChecklist((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-cv border px-3 py-1.5 text-gm-xs font-semibold transition-all cursor-pointer ${
                showChecklist
                  ? "border-[var(--gm-accent)] bg-[var(--gm-accent)] text-white"
                  : "border-[var(--gm-border)] bg-[var(--gm-surface)] text-[var(--gm-text)] hover:bg-[var(--gm-surface-hover)]"
              }`}
            >
              <Camera className="h-3.5 w-3.5 text-[var(--gm-accent-strong)]" />
              <span>Screenshot Checklist</span>
              <span className="rounded-full bg-[var(--gm-bg-elevated)] px-1.5 py-0.2 text-[10px] font-mono font-bold text-[var(--gm-text)]">
                {attachedCount}/20
              </span>
            </button>

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
        {/* Toggleable 20-Screenshot Checklist Panel */}
        {showChecklist && (
          <div className="mb-6 rounded-gm-xl border border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] p-5 shadow-sm animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-[var(--gm-border)]">
              <div>
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-[var(--gm-accent-strong)]" />
                  <h2 className="text-gm-sm font-bold text-[var(--gm-text)]">
                    20 Essential Help Guide Screenshots Checklist
                  </h2>
                </div>
                <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5">
                  Click any screenshot slot below to jump directly to its feature card and upload.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gm-xs font-mono font-semibold text-[var(--gm-accent-strong)] bg-[var(--gm-accent-muted)] px-2.5 py-1 rounded-cv">
                  {attachedCount} of 20 Attached ({Math.round((attachedCount / 20) * 100)}%)
                </span>
                <button
                  type="button"
                  onClick={() => setShowChecklist(false)}
                  className="rounded-cv p-1 text-[var(--gm-text-subtle)] hover:text-[var(--gm-text)] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-3">
              {CORE_SCREENSHOT_ITEMS.map((item) => {
                const isAttached = Boolean(customScreenshots[item.id]);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToFeature(item.id)}
                    className={`flex items-center justify-between p-2 rounded-cv border text-left text-gm-xs transition-all cursor-pointer ${
                      isAttached
                        ? "border-[var(--gm-success)]/40 bg-[var(--gm-success-muted)]/20 text-[var(--gm-text)]"
                        : "border-[var(--gm-border)] bg-[var(--gm-surface)] text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] hover:border-[var(--gm-border-strong)]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <span className="font-mono text-[10px] font-bold text-[var(--gm-accent-strong)] shrink-0">
                        #{item.num}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </div>
                    {isAttached ? (
                      <Check className="h-3.5 w-3.5 text-[var(--gm-success)] shrink-0" />
                    ) : (
                      <Camera className="h-3 w-3 text-[var(--gm-text-subtle)] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search, Category & Filter Bar */}
        <div className="space-y-3 mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 text-[var(--gm-text-subtle)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any feature, step, or shortcut…"
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

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-0.5 text-gm-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-sm transition-colors cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-[var(--gm-surface)] font-semibold text-[var(--gm-text)]"
                      : "text-[var(--gm-text-muted)] hover:text-[var(--gm-text)]"
                  }`}
                >
                  All ({ALL_TINY_FEATURES.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("attached")}
                  className={`px-2.5 py-1 rounded-sm transition-colors cursor-pointer ${
                    statusFilter === "attached"
                      ? "bg-[var(--gm-surface)] font-semibold text-[var(--gm-success)]"
                      : "text-[var(--gm-text-muted)] hover:text-[var(--gm-text)]"
                  }`}
                >
                  Has Image ({attachedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("missing")}
                  className={`px-2.5 py-1 rounded-sm transition-colors cursor-pointer ${
                    statusFilter === "missing"
                      ? "bg-[var(--gm-surface)] font-semibold text-[var(--gm-warning)]"
                      : "text-[var(--gm-text-muted)] hover:text-[var(--gm-text)]"
                  }`}
                >
                  Needs Image ({ALL_TINY_FEATURES.length - attachedCount})
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const allOpen = Object.values(expandedCards).filter(Boolean).length > 5;
                  setAllCardsExpanded(!allOpen);
                }}
                className="inline-flex items-center gap-1 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-2.5 py-1 text-gm-xs font-medium text-[var(--gm-text)] hover:bg-[var(--gm-surface)] transition-colors cursor-pointer"
              >
                <span>Toggle All</span>
              </button>
            </div>
          </div>

          {/* Clean Category Badges */}
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
        </div>

        {/* Clean, Simple Feature Cards */}
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
                {/* Clean Card Header Row */}
                <div
                  onClick={() => toggleCard(feature.id)}
                  className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-[var(--gm-surface)]/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="font-mono text-gm-xs font-bold text-[var(--gm-accent-strong)] bg-[var(--gm-accent-muted)] px-2 py-0.5 rounded-cv shrink-0">
                      #{feature.number}
                    </span>
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
                            <Check className="h-2.5 w-2.5" /> Image Attached
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
                          <ol className="space-y-2">
                            {feature.steps.map((step, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2.5 text-gm-xs text-[var(--gm-text)] leading-relaxed"
                              >
                                <span className="inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[var(--gm-accent-muted)] text-[10px] font-mono font-bold text-[var(--gm-accent-strong)] mt-0.5">
                                  {idx + 1}
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>

                      {/* Right 5 Columns: Clean Screenshot Frame */}
                      <div className="lg:col-span-5 space-y-2.5">
                        <div className="rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] overflow-hidden shadow-2xs">
                          {attachedScreenshot ? (
                            <div className="relative group aspect-[16/10] bg-black/50 flex items-center justify-center overflow-hidden">
                              <img
                                src={attachedScreenshot}
                                alt={feature.title}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setActiveUploadFeatureId(feature.id);
                                fileInputRef.current?.click();
                              }}
                              className="aspect-[16/10] p-4 flex flex-col items-center justify-center text-center cursor-pointer border-2 border-dashed border-[var(--gm-border)] hover:border-[var(--gm-accent)] bg-[var(--gm-surface)]/30 transition-colors"
                            >
                              <div className="h-9 w-9 rounded-full bg-[var(--gm-surface)] border border-[var(--gm-border)] flex items-center justify-center mb-2 text-[var(--gm-accent-strong)]">
                                <Camera className="h-4 w-4" />
                              </div>
                              <span className="text-[11px] font-mono font-bold text-[var(--gm-accent-strong)]">
                                Screenshot Slot #{feature.number}
                              </span>
                              <p className="text-[10px] text-[var(--gm-text-muted)] mt-1 max-w-xs leading-snug">
                                {feature.screenshotCaption}
                              </p>
                              <span className="mt-2 text-[10px] font-semibold text-[var(--gm-accent)] underline">
                                Click to attach image
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Screenshot Actions */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveUploadFeatureId(feature.id);
                              fileInputRef.current?.click();
                            }}
                            className="inline-flex items-center gap-1 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-2.5 py-1 text-gm-xs font-medium text-[var(--gm-text)] hover:bg-[var(--gm-surface-hover)] transition-colors cursor-pointer"
                          >
                            <Upload className="h-3 w-3 text-[var(--gm-accent-strong)]" />
                            <span>{attachedScreenshot ? "Change Image" : "Attach Screenshot"}</span>
                          </button>

                          {attachedScreenshot && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = { ...customScreenshots };
                                delete next[feature.id];
                                saveScreenshots(next);
                              }}
                              className="inline-flex items-center gap-1 rounded-cv px-2 py-1 text-gm-xs text-[var(--gm-danger)] hover:bg-[var(--gm-danger-muted)] transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FeaturesGuide;
