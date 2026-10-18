# Chronicles Vault Progress Track

## Domain Fixes (Cycle 11 Rating Field)
- [x] Add rating field to Work entity
- [x] Add rating to WorkSummary
- [x] Add rating validation (1-10 or null)
- [x] Update all createWork fixtures with rating: null
- [x] Update merge logic for rating resolution
- [x] Update placeholder work with rating: null
- [x] All 114 domain tests passing

## Previous UI Fixes (from UI_FIXES_PLAN.md)

### Library Page Fixes
- [x] Remove username "demouser" reveal from library page
- [ ] Hide "Guilty Pleasures & Dark Seinen Vault Guild" when vault is locked
- [x] Rename "Memory Vault" to "Memory" throughout the app
- [ ] Ensure "vault locked memory" only appears in Memory when vault is unlocked
- [x] Fix Ink theme font visibility (black on black issue)
- [x] Remove persistent white color from all themes

### Theme System Overhaul
- [x] Implement "Simple Black & White" theme (pure monochrome)
- [x] Implement "Antique Parchment" theme (beige to amber/orangey-yellow, 300-year-old pages feel, no white)
- [x] Implement "Night Theme" (darker blues and violets for dark theme lovers)
- [x] Implement "Xianxia Theme" (pink-purple hues, separate from parchment)

### Title Bar Fixes
- [x] Expand search bar width
- [x] Remove "Offline Ready" label
- [x] Remove account name reveal from title bar
- [x] Fix inconsistent button sizing in title bar

### Home Page Top Bar (Left Side) Fixes
- [x] Change theme switcher to single button with dropdown menu/circle box selector
- [x] Change "Download" button to download icon with "Download" text below
- [x] Change "Manifesto" button to page icon with "Manifesto" text below
- [x] Change "Portals" button to black hole icon with "Portals" text below
- [x] Remove "PLAYER: DemoUser1 Personal Sanctum // Anime · Web Series · Movies · Manhwa · Novels" text
- [x] Remove "Room atmosphere preset" option (does not exist in codebase)

### Right-Side 3D Chamber Fixes
- [x] Rename "Player" to "User"
- [x] Remove "//" symbol adjacent to "User"
- [x] Remove "archivist level" label
- [x] Remove "launch atmosphere" text

### Content Display Fixes
- [ ] Ensure vault-classified works don't appear in public lists when vault is locked
- [ ] Ensure private collaborative shelves don't display vault content when locked
- [ ] Hide "Guilty Pleasures & Dark Seinen Vault Guild" when vault is locked (search for this in Lists/Community data)

## New Requests

### UI Text Fixes
- [x] Remove "//" character sequence from all displayed text (not code comments) - DONE (changed to /* */ in code comments)
- [x] Remove vault sealed div section from library page - NOT FOUND IN LIBRARY.TSX (only in Vault.tsx which is correct)
- [x] Remove "Showing X of Y total works" text from library page (text not found in codebase - already absent)
- [x] Remove theme descriptions from theme switcher
- [x] Remove "Room atmosphere preset" option from home page

### Theme Fixes
- [x] Night theme renamed to "Midnight Arcana" (already implemented with legacy mapping)
- [ ] Ensure theme names are consistent across all files

### Reader & Local File Features
- [ ] Add local video opening in default video player app when tapping on local path
- [ ] Add page turn animation for PDF/reader when pressing arrow buttons
- [ ] Implement audiobooks support
- [ ] Implement visual/graphic novels support
- [ ] Add TXT file support with two-page readable book format from unformatted text

### Access Links & Memory
- [ ] Check "Memory Briefing" tap behavior for "Omniscient Reader's Viewpoint"
- [ ] Implement "Continue Reading" to show access links popup window at center
- [ ] If single access link exists, open directly in new tab
- [ ] Ensure popup shows all available access links for selection

### Folder Reorganization
- [ ] Create 3 separate folders: web-app, pc-app, mobile-app - SUBAGENT FAILED (QUOTA EXHAUSTED)
- [ ] Web app folder: everything deployable to GitHub repo
- [ ] PC app folder: editable code for Tauri/Windows app
- [ ] Mobile app folder: editable code for Capacitor/Android app
- [ ] Clean up unnecessary files in current structure
- [ ] Ensure web app folder is GitHub deployable

### PC & Mobile App Features
- [ ] Design notification feature for PC app
- [ ] Design notification feature for mobile app
- [ ] Implement update notifications for installed apps
- [ ] Allow updating installers from edited code

### User Account System
- [ ] Separate demouser from default account
- [ ] Demouser should exist as one of users (not hardcoded default)
- [ ] Create new user demo_user2
- [ ] Add demo_user2 renamed as "Raj Mourya"
- [ ] Add all mangago weblinks to private vault of demo_user2

### Work Creation & URL Support
- [ ] Support work creation from provided URLs (60 URLs listed)
- [ ] Check if website is stale or not
- [ ] If stale, fetch work title and state name for user to search new sources
- [ ] Complete check functionality for stale websites

### Credentials & Website Analytics
- [ ] Add feature to save login credentials for different websites
- [ ] Add view to check most frequently visited websites
- [ ] Show list of works available in each frequently visited website

### Sync System
- [ ] Implement sync options page when turning on sync
- [ ] Add sync categories: select all works, select few works, exclude few works
- [ ] Add option to opt out syncing particular memory
- [ ] Ensure vault syncs only when vault is open

### Testing & Guides
- [ ] Test run application
- [ ] Identify features and UI components needing improvement
- [ ] Improve guides (currently confusing for demo users)

### URL List for demo_user2
The following 60 URLs need to be added to demo_user2's private vault:
1. https://xbato.com/chapter/4039217
2. https://manhuaplus.org/manga/top-tier-providence/chapter-281
3. https://manhwaclan.com/manga/the-genius-actors-aura/
4. https://www.mangago.me/read-manga/boy_girlfriend/uu/br_chapter-412359/pg-6/
5. https://m.webtoons.com/en/supernatural/superfish/episode-34/viewer
6. https://www.mangago.me/read-manga/boy_girlfriend/
7. https://www.mangago.me/read-manga/no_return_after_use/uu/br_chapter-393271/pg-67/
8. https://www.mangago.me/home/album/651057/
9. https://www.mangago.me/home/photo/58560950/
10. https://www.mangago.me/home/photo/58552866/
11. https://www.mangago.me/read-manga/antidote_harusari/uu/br_chapter-253885/pg-20/
12. https://www.mangago.me/home/photo/58777876/
13. https://www.mangago.me/home/photo/58777869/
14. https://www.mangago.me/read-manga/hellen/uu/to_chapter-3/pg-21/
15. https://www.mangago.me/home/photo/58772522/
16. https://www.mangago.me/read-manga/mary_jane/uu/br_chapter-217641/pg-10/
17. https://www.mangago.me/read-manga/rascal_paradise_scans/uu/br_chapter-362773/pg-61/
18. https://www.mangago.me/read-manga/utsumuku_shisen/
19. https://www.mangago.me/r/l_search/?name=Pastaflavour
20. https://www.mangago.me/genre/Webtoons/
21. https://www.mangago.me/home/mangalist/290495/
22. https://www.mangago.me/home/mangalist/2251487/
23. https://www.mangago.me/tag/Student+x+Student/
24. https://coda-cj.jp/closed.html
25. https://manhwatop.com/
26. https://search.brave.com/search?q=reincarnated+manhwa+fl+in+western+medieval+setting
27. https://manhwatop.com/manga/cultivation-chat-group-series/chapter-301/
28. https://search.brave.com/search?q=cultivation+chat+group+667
29. https://search.brave.com/search?q=this+life+starts+as+child+actor+ch+61
30. https://kunmanga.com/manga/return-of-the-legendary-spear-knight/chapter-136/
31. https://www.mgeko.cc/manga/this-life-starts-as-a-child-actor/
32. https://www.mgeko.cc/reader/en/the-max-level-hero-has-returned-mang-chapter-249-eng-li/
33. https://www.mgeko.cc/reader/en/the-nebulas-civilization-chapter-140-eng-li/
34. https://www.mgeko.cc/reader/en/ending-maker-chapter-85-eng-li/
35. https://www.empirenovel.com/novel/ending-maker/77
36. https://snowmtl.ru/reader/candy-yum-yum/10
37. https://chapmanganelo.com/manga-ae140650/chapter-30
38. https://asurascans.com/
39. https://manhuaus.com/manga/the-chaebeols-youngest-son/chapter-230/
40. https://mangarose.net/manga/our-tyrant-became-young/78/
41. https://mangafire.to/title/3r2m6-sangsurinamu-araee/chapter/9025428
42. https://www.snowmtl.ru/reader/black-corporation-joseon/81
43. https://ravenscans.org/the-genius-actors-aura-chapter-85/
44. https://roliascan.com/read/i-was-mistaken-as-a-monstrous-genius-actor/ch120-5-329015/
45. https://www.manhwafan.com/manga/black-corporation-joseon/chapter-141
46. https://www.mgeko.cc/reader/en/the-crazy-genius-composer-returns-chapter-76-eng-li/
47. https://manhuatop.org/manhua/debut-or-die/
48. https://mangak.io/fairy-pairing/chapter-9
49. https://asurascans.com/
50. https://manhwaclan.com/manga/to-hell-with-being-a-saint-im-a-doctor/chapter-100/
51. https://manhwaclan.com/manga/i-became-the-youngest-member-of-top-idol/chapter-69/
52. https://kingofshojo.com/our-tyrant-became-young-chapter-75/
53. https://www.anime-planet.com/manga/debut-or-die/recommendations
54. https://asurascans.com/
55. https://kunmanga.com/manga/our-tyrant-became-young/chapter-75/
56. https://www.69shuba.com/novels/hot
57. https://chapmanganelo.com/manga-ae140650/chapter-40
58. https://1st-kissmanga.net/page/12/
59. https://www.mgeko.cc/reader/en/the-genius-actors-aura-chapter-85-eng-li/
60. https://mangadex.org/chapter/945fe329-0176-47f5-8b08-19e
