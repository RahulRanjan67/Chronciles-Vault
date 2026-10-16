"""
Chronicles Vault — PC Studio App: 32 Tiny-to-Tiny Features Data Module
Used by pc_workstation_app.py for the integrated PC Help & 32 Features section.
"""

from typing import Any, Dict, List

PC_HELP_32_FEATURES_LIST: List[Dict[str, Any]] = [
    {
        "num": "01",
        "category": "Sanctum Room & Themes",
        "title": "Loading Your Room (Zero-Latency Preloader)",
        "why": "Boots the visual Room shell in <15ms while IndexedDB, LocalStorage, and SQLite sync warm up in the background.",
        "steps": [
            "Launch Chronicles Vault on Web, PC Studio, or Mobile.",
            "Watch the 'Loading Your Room' progress ring animate through stages 01 to 04.",
            "Click 'Enter My Room ✦' once ready."
        ],
        "placeholder": "SCREENSHOT #01: Capture the 'Loading Your Room' hero preloader card showing the arched window and 'Enter My Room ✦' button."
    },
    {
        "num": "02",
        "category": "Sanctum Room & Themes",
        "title": "Prism White & Indigo Theme (Midnight Arcana)",
        "why": "Combines crisp pure-white cards (#ffffff) on an airy ice-indigo canvas (#f4f7ff) with vibrant electric indigo (#4f46e5) accents.",
        "steps": [
            "Look at the top navigation bar or go to Settings.",
            "Click the 'Prism Indigo' theme pill.",
            "Observe the crisp white cards and electric indigo borders across the interface."
        ],
        "placeholder": "SCREENSHOT #02: Capture the Library or Dashboard with the 'Prism Indigo' bright-white and electric-indigo theme active."
    },
    {
        "num": "03",
        "category": "Sanctum Room & Themes",
        "title": "Sunlit White & Warm Amber Theme (Parchment Ink)",
        "why": "Warm alabaster-cream backdrop (#fffaf0) with pure white cards and rich burnt-amber (#d97706) highlights for daytime reading.",
        "steps": [
            "Click the 'Sunlit Amber' theme pill in the top header or Settings.",
            "Open any novel chapter or manga reader to experience warm paper-white contrast."
        ],
        "placeholder": "SCREENSHOT #03: Capture the workspace with the 'Sunlit Amber' warm white & golden-amber theme active."
    },
    {
        "num": "04",
        "category": "Sanctum Room & Themes",
        "title": "Blossom White & Vivid Rose Theme (Xianxia Realm)",
        "why": "100% pure sakura-white (#fff5f7) and vivid coral-crimson (#e11d48) palette with zero blue hues.",
        "steps": [
            "Click the 'Blossom Rose' theme pill in the top header.",
            "Verify the vivid rose-pink buttons, badges, and white surface cards."
        ],
        "placeholder": "SCREENSHOT #04: Capture the workspace with the 'Blossom Rose' bright sakura-white & vivid crimson-rose theme active."
    },
    {
        "num": "05",
        "category": "Sanctum Room & Themes",
        "title": "Multi-Room User Profiles (Room Switcher)",
        "why": "Isolates libraries, bookmarks, reading history, and themes into separate personal 'Rooms' on the same device.",
        "steps": [
            "Open Settings -> Room Profiles (or click the active Room badge in the header).",
            "Create a new Room (e.g., 'Action Manhwa Room' or 'Light Novel Study').",
            "Switch between Rooms seamlessly."
        ],
        "placeholder": "SCREENSHOT #05: Capture the Room Profile Switcher showing multiple personal Rooms."
    },
    {
        "num": "06",
        "category": "Sanctum Room & Themes",
        "title": "Global Command Palette (Ctrl+K / Cmd+K)",
        "why": "Jump to any series, chapter, bookmark, theme, or tool in <50ms without touching the mouse.",
        "steps": [
            "Press Ctrl+K (or click the Search / Command button in the top bar).",
            "Type a work title, 'Theme', or 'Sync' and press Enter."
        ],
        "placeholder": "SCREENSHOT #06: Capture the Ctrl+K Command Palette modal open over the workspace with search results."
    },
    {
        "num": "07",
        "category": "Library & Organization",
        "title": "Multi-Medium Library Hub (Anime, Manga, Manhwa, Novels)",
        "why": "Unifies all 4 storytelling mediums in one responsive bento grid with instant medium tabs.",
        "steps": [
            "Open the Library view from the top navigation.",
            "Click the Medium filter pills: All, Anime, Manga, Manhwa, or Light Novel."
        ],
        "placeholder": "SCREENSHOT #07: Capture the Library Grid showing works across Anime, Manga, Manhwa, and Light Novels."
    },
    {
        "num": "08",
        "category": "Library & Organization",
        "title": "Add & Edit Work Modal with Custom Cover Art",
        "why": "Add any work with custom cover URL or local image, synopsis, release status, medium, and tags.",
        "steps": [
            "Click '+ Add Work' in the Library or PC Studio toolbar.",
            "Fill in Title, Medium, Status, Progress, and Cover URL.",
            "Click 'Save Work to Vault'."
        ],
        "placeholder": "SCREENSHOT #08: Capture the 'Add / Edit Work' modal filled out with a series cover and metadata."
    },
    {
        "num": "09",
        "category": "Library & Organization",
        "title": "One-Click +1 Episode / Chapter Progress Stepper",
        "why": "Increment your watched episode or read chapter count directly from the library card in one click.",
        "steps": [
            "Hover over any work card in the Library or PC Studio table.",
            "Click the '+1 Ep/Ch' button and watch the progress bar and total update immediately."
        ],
        "placeholder": "SCREENSHOT #09: Capture a Work Card highlighting the '+1 Ep/Ch' quick-increment button and progress bar."
    },
    {
        "num": "10",
        "category": "Library & Organization",
        "title": "Advanced Multi-Axis Sorting & Status Filtering",
        "why": "Filter by Reading/Watching, Completed, On Hold, Plan to Read, and sort by Rating, Title, Updated Date, or Progress.",
        "steps": [
            "In the Library toolbar, select a Status pill (e.g., 'Reading / Watching').",
            "Open the Sort dropdown and toggle between 'Last Updated', 'Score (High-Low)', and 'Alphabetical'."
        ],
        "placeholder": "SCREENSHOT #10: Capture the Library filter bar with Status pills and Sort dropdown expanded."
    },
    {
        "num": "11",
        "category": "Library & Organization",
        "title": "Custom Collections, Tags & Smart Shelves",
        "why": "Group works by custom tropes or shelves like 'S-Tier Dungeon Manhwa', 'Regression', or 'Weekend Binge'.",
        "steps": [
            "Click any tag badge on a work card or use the Tag Filter bar.",
            "Add custom comma-separated tags when editing any work."
        ],
        "placeholder": "SCREENSHOT #11: Capture custom trope/genre tags displayed on work cards and the tag filter active."
    },
    {
        "num": "12",
        "category": "Library & Organization",
        "title": "Batch Operations & Bulk Status Editor",
        "why": "Select multiple works at once to bulk-update reading status, tags, or export selection.",
        "steps": [
            "Enable Multi-Select mode in the Library toolbar.",
            "Check 3+ works and apply a bulk status change or tag."
        ],
        "placeholder": "SCREENSHOT #12: Capture the Bulk Selection toolbar with multiple library cards checked."
    },
    {
        "num": "13",
        "category": "Readers & Local Video Player",
        "title": "Zero-Upload Local Video Linking (`URL.createObjectURL` + IndexedDB)",
        "why": "Link `.mp4`, `.mkv`, or `.webm` anime episodes directly from your hard drive with 0 bytes uploaded to the cloud.",
        "steps": [
            "Open any Anime work -> Video Player (or click 'Link Local Video' in PC Studio).",
            "Select a local `.mp4`/`.mkv`/`.webm` file from your computer.",
            "Play immediately with persistent IndexedDB file-handle caching."
        ],
        "placeholder": "SCREENSHOT #13: Capture the Local Video Player playing a linked local anime video file with file badge visible."
    },
    {
        "num": "14",
        "category": "Readers & Local Video Player",
        "title": "Frame-Accurate Video Timestamp Bookmarks",
        "why": "Save exact anime fight scenes, OST drops, or sakuga moments and jump back to the exact second in 1 click.",
        "steps": [
            "While playing a linked video, click '+ Bookmark Timestamp' at your favorite moment.",
            "Add a note (e.g., 'Episode 12 Sakuga Climax - 18:42').",
            "Click the saved timestamp chip to seek the video player immediately."
        ],
        "placeholder": "SCREENSHOT #14: Capture the Video Player showing saved Timestamp Bookmark chips below the scrubber."
    },
    {
        "num": "15",
        "category": "Readers & Local Video Player",
        "title": "Vertical Webtoon / Manhwa Continuous Scroll Reader",
        "why": "Zero-gap vertical canvas engineered for long-strip Korean Manhwa and Chinese Manhua.",
        "steps": [
            "Open a Manhwa work in the Reader.",
            "Select 'Vertical Webtoon Strip' mode.",
            "Scroll smoothly through stitched panels with adjustable container width."
        ],
        "placeholder": "SCREENSHOT #15: Capture the Reader in 'Vertical Webtoon Strip' mode displaying continuous vertical panels."
    },
    {
        "num": "16",
        "category": "Readers & Local Video Player",
        "title": "Manga Page-Flip & RTL Double-Spread Reader",
        "why": "Supports authentic Right-to-Left (RTL) Japanese manga pagination and 2-page wide spreads.",
        "steps": [
            "Open a Manga work in the Reader.",
            "Toggle 'RTL Manga Page' or 'Double Spread' mode in the reader toolbar.",
            "Use Left/Right arrow keys or click page edges to flip."
        ],
        "placeholder": "SCREENSHOT #16: Capture the Manga Reader in Double-Page / RTL mode."
    },
    {
        "num": "17",
        "category": "Readers & Local Video Player",
        "title": "Light Novel Typography & Ambience Customizer",
        "why": "Customize font family, font weight, line height, column width, and paper tint for 10-hour novel binges.",
        "steps": [
            "Open a Light Novel chapter in the Novel Reader.",
            "Open the 'Typography & Ambience' drawer.",
            "Adjust font size, line spacing, and reading width."
        ],
        "placeholder": "SCREENSHOT #17: Capture the Light Novel Reader with the Typography & Font Size controls open."
    },
    {
        "num": "18",
        "category": "Readers & Local Video Player",
        "title": "Auto-Scroll Hands-Free Reading Mode",
        "why": "Smooth variable-speed automatic scrolling so you can read webtoons or novels hands-free.",
        "steps": [
            "Inside the Manhwa or Novel Reader, click the 'Auto-Scroll' toggle.",
            "Adjust the speed slider (1x to 5x) and pause anytime with Spacebar."
        ],
        "placeholder": "SCREENSHOT #18: Capture the Reader HUD showing the active Auto-Scroll speed controller."
    },
    {
        "num": "19",
        "category": "Bookmarks, Lore & Notes",
        "title": "Multi-Filter Bookmark Manager (Sort, Tag, Medium & Search)",
        "why": "Instantly filter hundreds of saved chapter/timestamp bookmarks by medium, emotion tag, work, or date.",
        "steps": [
            "Navigate to the Bookmarks tab (`/bookmarks`).",
            "Filter by Medium (Anime/Manga/Novel) or Tag (e.g., 'Plot Twist', 'Hype', 'Lore').",
            "Toggle sort order between Newest, Oldest, and Chapter Order."
        ],
        "placeholder": "SCREENSHOT #19: Capture the Bookmarks page showing active Tag & Medium filters and sorted bookmark cards."
    },
    {
        "num": "20",
        "category": "Bookmarks, Lore & Notes",
        "title": "Inline Quote & Panel Snippet Highlighter",
        "why": "Save exact novel quotes or panel reactions attached to a specific chapter and page/timestamp.",
        "steps": [
            "While reading or inside Bookmarks, click '+ New Quote / Snippet Bookmark'.",
            "Paste the quote, select an emotion badge, and save."
        ],
        "placeholder": "SCREENSHOT #20: Capture a saved Quote Bookmark card displaying the highlighted quote and chapter badge."
    },
    {
        "num": "21",
        "category": "Bookmarks, Lore & Notes",
        "title": "Interactive Character & Faction Lore Graph",
        "why": "Map out complex Xianxia cultivation realms, noble houses, character alliances, and betrayals without spoilers.",
        "steps": [
            "Open the Lore / Wiki section for any work.",
            "Add Character or Faction nodes and link their relationships."
        ],
        "placeholder": "SCREENSHOT #21: Capture the Character & Faction Lore Wiki / Relationship view."
    },
    {
        "num": "22",
        "category": "Bookmarks, Lore & Notes",
        "title": "Spoiler-Lock Chapter Gate for Notes",
        "why": "Locks lore notes behind a chapter threshold so re-readers or friends never accidentally see future plot twists.",
        "steps": [
            "Create or edit a Lore Entry / Note.",
            "Set 'Spoiler Lock Until Chapter' (e.g., Ch. 150).",
            "Observe the blurred Spoiler Shield badge on locked entries."
        ],
        "placeholder": "SCREENSHOT #22: Capture a Lore Note with the 'Spoiler Shield' lock active."
    },
    {
        "num": "23",
        "category": "Bookmarks, Lore & Notes",
        "title": "Cultivation / Power-Tier Progression Tracker",
        "why": "Track the protagonist's power levels, artifacts, skills, and realm breakthroughs chapter-by-chapter.",
        "steps": [
            "Open a work's Detail Drawer -> Power / Realm Progression.",
            "Add milestone breakthroughs (e.g., 'Ch. 45 — Nascent Soul Realm')."
        ],
        "placeholder": "SCREENSHOT #23: Capture the Power-Tier / Cultivation Realm progression timeline."
    },
    {
        "num": "24",
        "category": "Bookmarks, Lore & Notes",
        "title": "Cross-Medium Adaptation Comparison Matrix",
        "why": "Map where Anime Episode 24 ends in the Manga (Ch. 68) and Light Novel (Vol. 4, Ch. 12) so you can switch mediums seamlessly.",
        "steps": [
            "Open a work's Adaptation Mapper panel.",
            "View or log the exact Anime Episode <-> Manga Chapter <-> Novel Volume bridge."
        ],
        "placeholder": "SCREENSHOT #24: Capture the Cross-Medium Adaptation Bridge showing Anime-to-Manga-to-Novel mapping."
    },
    {
        "num": "25",
        "category": "Analytics, Discovery & Sync",
        "title": "Reading & Watch-Time Analytics Bento Dashboard",
        "why": "Visualizes chapters read, episodes watched, medium breakdown, and daily reading streaks.",
        "steps": [
            "Navigate to the Analytics / Stats view.",
            "Inspect the Medium Breakdown rings, Weekly Activity bars, and Top Genres."
        ],
        "placeholder": "SCREENSHOT #25: Capture the Analytics Dashboard showing reading streaks and medium distribution charts."
    },
    {
        "num": "26",
        "category": "Analytics, Discovery & Sync",
        "title": "24 Popular Manga, Anime, Manhwa & Novel Sites Directory",
        "why": "Curated quick-launch directory of the top 24 official & community portals with instant medium filters.",
        "steps": [
            "On the Web App Homepage (`SanctumHome`), scroll down to 'Popular Reading & Watch Portals'.",
            "Filter by Manga, Anime, Manhwa, or Novel and click any portal card to launch."
        ],
        "placeholder": "SCREENSHOT #26: Capture the '24 Popular Manga / Anime / Manhwa / Novel Sites Directory' section on the Web Homepage."
    },
    {
        "num": "27",
        "category": "Analytics, Discovery & Sync",
        "title": "4-Folder Independent Architecture (Web, PC App, Mobile App, Venv)",
        "why": "Cleanly separates `web/`, `pc app/`, `mobile app/`, and shared Python `venv/` so each platform runs independently.",
        "steps": [
            "Open `chronicles-vault/` in File Explorer or VS Code.",
            "Verify the 4 standalone directories: `web`, `pc app`, `mobile app`, and `venv`."
        ],
        "placeholder": "SCREENSHOT #27: Capture File Explorer or IDE showing the 4 separated folders (`web`, `pc app`, `mobile app`, `venv`)."
    },
    {
        "num": "28",
        "category": "Analytics, Discovery & Sync",
        "title": "Hybrid Local-First CRDT Sync Hub (`127.0.0.1:47920` / LAN)",
        "why": "Merges works and bookmarks across Web, PC Studio, and Samsung Galaxy A14 Mobile over Wi-Fi with zero data loss.",
        "steps": [
            "Click 'Sync Across Devices' in Web, PC Studio, or Mobile.",
            "Verify the 'CRDT Merge Complete' status badge and updated SQLite vault count."
        ],
        "placeholder": "SCREENSHOT #28: Capture the Cross-Platform CRDT Sync status banner showing Web + PC + Mobile synced."
    },
    {
        "num": "29",
        "category": "Analytics, Discovery & Sync",
        "title": "One-Click JSON Vault Backup & Portable Restore",
        "why": "Export your entire vault (works, bookmarks, rooms, and screenshot attachments) as a portable `.json` file anytime.",
        "steps": [
            "Go to Settings -> Data & Backup (or click 'Export JSON' in PC Studio).",
            "Download the `.json` snapshot or restore from an existing backup file."
        ],
        "placeholder": "SCREENSHOT #29: Capture the JSON Backup Export / Import modal or downloaded backup confirmation."
    },
    {
        "num": "30",
        "category": "Analytics, Discovery & Sync",
        "title": "PC Native Local Media Folder Batch Scanner",
        "why": "Recursively scans any folder on your PC for `.mp4`, `.mkv`, `.cbz`, `.epub`, and `.pdf` files and auto-populates your vault.",
        "steps": [
            "In the PC Studio App, click '📂 Scan Media Folder' in the top bar.",
            "Choose any anime/manga folder on your PC.",
            "Watch all discovered files auto-link into your Library."
        ],
        "placeholder": "SCREENSHOT #30: Capture the PC Studio App after scanning a local media folder with linked local file paths."
    },
    {
        "num": "31",
        "category": "Analytics, Discovery & Sync",
        "title": "Samsung Galaxy A14 Zero-Transfer LAN Streaming & Sync",
        "why": "Use Chronicles Vault on your Android Samsung Galaxy A14 while 100% of files and databases sit on your PC.",
        "steps": [
            "Connect your Samsung Galaxy A14 to the same Wi-Fi (or Mobile Hotspot) as your PC.",
            "Open Chrome on your Galaxy A14 and visit `http://10.114.65.145:5174` (or `http://10.114.65.145:47920/mobile`).",
            "Tap 'Enter My Room ✦' and browse/sync your PC vault live from your phone."
        ],
        "placeholder": "SCREENSHOT #31: Capture Chronicles Vault running on your Samsung Galaxy A14 (or mobile viewport) connected to the PC LAN IP."
    },
    {
        "num": "32",
        "category": "Analytics, Discovery & Sync",
        "title": "Interactive 32-Feature Encyclopedia with Live Screenshot Slots",
        "why": "Built-in visual documentation (`Web /features-guide` & `PC App -> Help`) where you can attach your own screenshots to every feature card.",
        "steps": [
            "Open `/features-guide` on Web or click the `❓ Help (32 Features)` tab in the PC Studio App.",
            "Click `📸 Attach Screenshot` on any feature card (#01 to #32) to embed your captured image."
        ],
        "placeholder": "SCREENSHOT #32: Capture the 32-Feature Guide page itself with a custom screenshot attached to one of the cards."
    }
]
