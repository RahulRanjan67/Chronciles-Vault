# -*- coding: utf-8 -*-
"""
Script to patch SanctumHome.tsx with all user requirements:
1. Replace "CV" badge with the official Grimoire SVG tome logo emblem with gold star.
2. Update Theme switcher: "02 Antique Parchment" -> "Parchment", and clean single words: "Midnight", "Parchment", "Blossom", "Ink".
3. Remove 1, 2, 3 numbering from Manifesto, Portals, and Standalone Native Installers.
4. Remove all mentions of "32" and "screenshots".
5. Prompt to sign in first when tapping "ENTER YOUR ROOM" or pressing Enter when no user is signed in.
6. Unified .gca import handler that extracts account, signs in, restores data, and immediately opens /library!
7. Expand popular sites with all 15 requested websites (comrademao, fanmtl, mangago, wtr-lab, kissmanga, mgeko, kissasian, moviesmod, royalroad, novelfull, novelbin, toonily, lnmtl, wuxiaworld, foxnovel).
8. Support drama and movie categories.
9. Redesign the 3-column grid into a clean, modern multi-column responsive list format.
"""

import re

file_path = r'c:\Users\67rah\Desktop\Chronciles Vault\chronicles-vault\apps\client\src\routes\SanctumHome.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update PopularSiteEntry category type
old_cat_type = 'readonly category: "manga" | "manhwa" | "novel" | "anime";'
new_cat_type = 'readonly category: "manga" | "manhwa" | "novel" | "anime" | "drama" | "movie";'
content = content.replace(old_cat_type, new_cat_type)

# 2. Add requested sites to POPULAR_READING_SITES
new_sites_code = '''  // POPULAR EXPANDED DIRECTORY (REQUESTED SITES)
  {
    id: "comrademao",
    name: "Comrade Mao",
    url: "https://comrademao.com",
    domain: "comrademao.com",
    category: "novel",
    categoryLabel: "Web Novel MTL",
    badge: "Xianxia MTL",
    description: "High-volume machine-translated Chinese web novels, cultivation sagas, and raw web fiction.",
    languages: "English (MTL)",
  },
  {
    id: "fanmtl",
    name: "FanMTL",
    url: "https://fanmtl.com",
    domain: "fanmtl.com",
    category: "novel",
    categoryLabel: "Web Novel & Fanfic",
    badge: "Fanfic & Novels",
    description: "Curated machine translations of Asian web novels, anime fanfiction, and transmigration serials.",
    languages: "English (MTL)",
  },
  {
    id: "mangago",
    name: "Mangago",
    url: "https://www.mangago.me",
    domain: "mangago.me",
    category: "manga",
    categoryLabel: "Manga & Manhwa",
    badge: "Community Hub",
    description: "Massive online manga, manhwa, and webtoon reading community with active chapter discussions.",
    languages: "English",
  },
  {
    id: "wtr-lab",
    name: "WTR-LAB",
    url: "https://wtr-lab.com",
    domain: "wtr-lab.com",
    category: "novel",
    categoryLabel: "Web Novel AI",
    badge: "AI Translation Lab",
    description: "AI-assisted web novel translation lab with machine-learning glossaries and smooth readability.",
    languages: "Multi-language",
  },
  {
    id: "kissmanga",
    name: "KissManga",
    url: "https://kissmanga.org",
    domain: "kissmanga.org",
    category: "manga",
    categoryLabel: "Classic Manga",
    badge: "Manga Archive",
    description: "Expansive classic manga archive indexing thousands of completed and ongoing graphic novels.",
    languages: "English",
  },
  {
    id: "mgeko",
    name: "MangaGeko (MGeko)",
    url: "https://www.mgeko.cc",
    domain: "mgeko.cc",
    category: "manga",
    categoryLabel: "Manga & Manhwa",
    badge: "Fast Scan Index",
    description: "Fast-loading manga, manhwa, and manhua chapters with clean image servers and dark mode.",
    languages: "English",
  },
  {
    id: "kissasian",
    name: "KissAsian",
    url: "https://kissasian.lu",
    domain: "kissasian.lu",
    category: "drama",
    categoryLabel: "K-Drama & C-Drama",
    badge: "Asian Dramas",
    description: "Leading streaming directory for Korean dramas (K-Dramas), Chinese dramas (C-Dramas), and J-Dramas with English subtitles.",
    languages: "Korean / Chinese (EN Sub)",
  },
  {
    id: "moviesmod",
    name: "MoviesMod",
    url: "https://moviesmod.org",
    domain: "moviesmod.org",
    category: "movie",
    categoryLabel: "Movies & Series",
    badge: "HD Movies & Shows",
    description: "Comprehensive directory for films, cinema releases, web series, and multi-episode television archives.",
    languages: "English / Multi",
  },
  {
    id: "royalroad",
    name: "Royal Road",
    url: "https://www.royalroad.com",
    domain: "royalroad.com",
    category: "novel",
    categoryLabel: "Web Novel",
    badge: "Progression & LitRPG",
    description: "The premier home for original western web fiction, progression fantasy, LitRPG, and time-loop novels.",
    languages: "English",
  },
  {
    id: "novelfull",
    name: "NovelFull",
    url: "https://novelfull.com",
    domain: "novelfull.com",
    category: "novel",
    categoryLabel: "Light Novel",
    badge: "Popular Serials",
    description: "Popular catalog of translated Chinese cultivation novels, Japanese light novels, and Korean epics.",
    languages: "English",
  },
  {
    id: "novelbin",
    name: "NovelBin",
    url: "https://novelbin.me",
    domain: "novelbin.me",
    category: "novel",
    categoryLabel: "Web Novel",
    badge: "Daily Release Hub",
    description: "Daily updated web novel reader with chapter bookmarks, night mode, and massive backlog archives.",
    languages: "English",
  },
  {
    id: "toonily",
    name: "Toonily",
    url: "https://toonily.com",
    domain: "toonily.com",
    category: "manhwa",
    categoryLabel: "Manhwa / Webtoon",
    badge: "High-Res Manhwa",
    description: "Crisp, full-color vertical webtoon releases specializing in action fantasy, regression, and romance manhwa.",
    languages: "English",
  },
  {
    id: "lnmtl",
    name: "LNMTL",
    url: "https://lnmtl.com",
    domain: "lnmtl.com",
    category: "novel",
    categoryLabel: "Xianxia MTL",
    badge: "Glossary MTL",
    description: "Pioneering web novel machine-translation platform with community-trained terminology glossaries.",
    languages: "English (MTL)",
  },
  {
    id: "wuxiaworld",
    name: "Wuxiaworld",
    url: "https://www.wuxiaworld.com",
    domain: "wuxiaworld.com",
    category: "novel",
    categoryLabel: "Official Xianxia",
    badge: "Licensed Translations",
    description: "The premier licensed publisher and reading platform for Chinese xianxia, wuxia, and Korean fantasy novels.",
    languages: "English",
  },
  {
    id: "foxnovel",
    name: "FoxNovel",
    url: "https://foxnovel.com",
    domain: "foxnovel.com",
    category: "novel",
    categoryLabel: "Web Fiction",
    badge: "Romance & Fantasy",
    description: "Curated serialized romance novels, billionaire sagas, and modern urban fantasy serials.",
    languages: "English",
  },
'''

# Insert new sites at the beginning of POPULAR_READING_SITES
content = content.replace("const POPULAR_READING_SITES: readonly PopularSiteEntry[] = [", "const POPULAR_READING_SITES: readonly PopularSiteEntry[] = [\n" + new_sites_code)

# 3. Replace CV badge with Grimoire SVG emblem in header
old_cv_badge = '''          <div className="flex items-center gap-3">
            <div className="h-9 w-9 border-2 border-[var(--gm-border-strong)] bg-[var(--gm-accent)] text-[var(--gm-accent-fg)] flex items-center justify-center font-mono font-bold text-gm-xs shadow-[2px_2px_0px_var(--gm-border-strong)]">
              CV
            </div>'''

new_grimoire_logo = '''          <div className="flex items-center gap-3">
            <div className="h-9 w-9 border-2 border-[var(--gm-border-strong)] bg-[var(--gm-accent)] text-[var(--gm-accent-fg)] flex items-center justify-center shadow-[2px_2px_0px_var(--gm-border-strong)]" title="Grimoire Codex Sanctum">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4zm12 16H6v-2h12v2zm0-4H6v-2h12v2zm0-4h-5V4h5v8z" />
                <circle cx="12" cy="10" r="1.5" fill="#fef08a" />
              </svg>
            </div>'''
content = content.replace(old_cv_badge, new_grimoire_logo)

# 4. Update theme switcher labels (only parchment word, clean names)
old_theme_block = '''            [
              { id: "midnight-arcana", label: "01 Midnight", roomIdx: 0 },
              { id: "parchment-ink", label: "02 Antique Parchment", roomIdx: 1 },
              { id: "xianxia-realm", label: "03 Blossom", roomIdx: 2 },
              { id: "ink", label: "04 Ink", roomIdx: 3 },
            ]'''

new_theme_block = '''            [
              { id: "midnight-arcana", label: "Midnight", roomIdx: 0 },
              { id: "parchment-ink", label: "Parchment", roomIdx: 1 },
              { id: "xianxia-realm", label: "Blossom", roomIdx: 2 },
              { id: "ink", label: "Ink", roomIdx: 3 },
            ]'''
content = content.replace(old_theme_block, new_theme_block)

# 5. Remove 1, 2, 3 numbering from section headers and badges
content = content.replace("<span>01 · ARCHITECTURAL MANIFESTO</span>", "<span>ARCHITECTURAL MANIFESTO</span>")
content = content.replace("<span>02 · GLOBAL PORTAL DIRECTORY (24 CURATED SITES)</span>", "<span>GLOBAL PORTAL DIRECTORY</span>")
content = content.replace("<span>03 · STANDALONE NATIVE INSTALLERS</span>", "<span>STANDALONE NATIVE INSTALLERS</span>")
content = content.replace("01 / ARCHITECTURAL MANIFESTO", "ARCHITECTURAL MANIFESTO")
content = content.replace("02 / GLOBAL PORTAL DIRECTORY (24 SITES)", "GLOBAL PORTAL DIRECTORY")
content = content.replace("[01 · MANIFESTO]", "[MANIFESTO]")
content = content.replace("[02 · SITES]", "[PORTALS]")
content = content.replace("[03 · APPS]", "[DOWNLOADS]")

# 6. Remove mentions of "32" and "screenshots"
content = content.replace("Inspect All 32 Features &amp; Screenshots  ✦", "Inspect Architectural Capabilities &amp; Guide ✦")
content = content.replace("Inspect All 32 Features &amp; Screenshots ✦", "Inspect Architectural Capabilities &amp; Guide ✦")
content = content.replace("all 32 features built into the Help Center", "complete architectural capabilities built into the Help Center")
content = content.replace("32 Features &amp; Screenshots", "Architectural Guide &amp; FAQ")
content = content.replace("Antique Parchment", "Parchment")

# 7. Prompt to sign in first when tapping ENTER YOUR ROOM (or Enter key)
old_enter_hero_button = '''                <button
                  type="button"
                  onClick={() => handleEnterRoom()}
                  className="flex-1 inline-flex items-center justify-center gap-3 border-2 border-[var(--gm-border-strong)] bg-[var(--gm-accent)] px-6 py-4 sm:py-5 text-gm-base sm:text-gm-lg font-mono font-extrabold uppercase tracking-wider text-[var(--gm-accent-fg)] shadow-[6px_6px_0px_var(--gm-border-strong)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_var(--gm-border-strong)] transition-all cursor-pointer"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>ENTER YOUR ROOM ✦</span>
                  <ArrowRight className="h-5 w-5" />
                </button>'''

new_enter_hero_button = '''                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) {
                      setShowSignInModal(true);
                      toast({
                        title: "Please Sign In First",
                        description: "Select a profile, create a new handle, or import a .gca archive to enter your reading sanctum.",
                      });
                    } else {
                      handleEnterRoom();
                    }
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-3 border-2 border-[var(--gm-border-strong)] bg-[var(--gm-accent)] px-6 py-4 sm:py-5 text-gm-base sm:text-gm-lg font-mono font-extrabold uppercase tracking-wider text-[var(--gm-accent-fg)] shadow-[6px_6px_0px_var(--gm-border-strong)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_var(--gm-border-strong)] transition-all cursor-pointer"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>ENTER YOUR ROOM ✦</span>
                  <ArrowRight className="h-5 w-5" />
                </button>'''
content = content.replace(old_enter_hero_button, new_enter_hero_button)

# Update keyboard Enter trigger
old_enter_key_effect = '''  // Press Enter to Enter Room once ready
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Enter" &&
        isRoomReady &&
        !showCreateRoom &&
        document.activeElement?.tagName !== "INPUT"
      ) {
        handleEnterRoom();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isRoomReady, showCreateRoom]);'''

new_enter_key_effect = '''  // Press Enter to Enter Room once ready
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Enter" &&
        isRoomReady &&
        !showCreateRoom &&
        !showSignInModal &&
        !showSignUpModal &&
        document.activeElement?.tagName !== "INPUT"
      ) {
        if (!currentUser) {
          setShowSignInModal(true);
          toast({
            title: "Please Sign In First",
            description: "Select a profile, create a new handle, or import a .gca archive to enter your reading sanctum.",
          });
        } else {
          handleEnterRoom();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isRoomReady, showCreateRoom, showSignInModal, showSignUpModal, currentUser]);'''
content = content.replace(old_enter_key_effect, new_enter_key_effect)

# 8. Unified robust .gca import handler that sets user and opens room immediately
old_import_handlers = '''  const handleImportGcaFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        toast({
          title: "Import Failed",
          description: "Invalid .gca or JSON file format.",
          variant: "destructive",
        });
        return;
      }

      const stateMod = await import("@grimoire/state");
      let result = { worksCreated: 0, memoriesCreated: 0, relationsCreated: 0, listsRestored: 0, user: undefined as string | undefined };
      if (parsed && Array.isArray(parsed.works)) {
        const plannedIds = new Set<string>(parsed.works.map((w: any) => String(w.id)));
        const res = stateMod.applyBackupImport(parsed, plannedIds);
        result = { ...res, user: parsed.user?.username || parsed.account?.username };
      }
      stateMod.useLibraryStore.getState().refresh();

      let detectedUser = result.user;
      if (!detectedUser && parsed) {
        detectedUser =
          parsed.account?.username ||
          parsed.user?.username ||
          parsed.username ||
          (typeof parsed.account === "string" ? parsed.account : undefined);
      }
      if (!detectedUser) {
        detectedUser = file.name.replace(/\\.(gca|cca|json)$/i, "");
      }
      if (!detectedUser || !detectedUser.trim()) {
        detectedUser = "Archivist";
      }

      window.localStorage.setItem("cv:username", detectedUser);
      window.localStorage.setItem("cv:auth_token", `token-${Date.now()}`);
      setCurrentUser(detectedUser);

      const nextSaved: SavedProfileRecord[] = [
        {
          username: detectedUser,
          roomName: `${detectedUser}'s Chamber`,
          themePreference: "midnight-arcana",
          lastActiveAt: new Date().toISOString(),
        },
        ...savedProfiles.filter((p) => p.username.toLowerCase() !== detectedUser.toLowerCase()),
      ];
      setSavedProfiles(nextSaved);
      try {
        window.localStorage.setItem(SAVED_PROFILES_STORAGE_KEY, JSON.stringify(nextSaved));
      } catch {}

      toast({
        title: "Profile Archive Restored",
        description: `Imported ${result.worksCreated} works and ${result.memoriesCreated} memories. Welcome, @${detectedUser}!`,
        variant: "success",
      });

      onEnterRoom();
    } catch (err) {
      toast({
        title: "Import Failed",
        description: err instanceof Error ? err.message : "Failed to import .gca archive.",
        variant: "destructive",
      });
    }
  };

  const handleLandingFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const stateMod = await import("@grimoire/state");
      const parsed = stateMod.parseBackup(text);
      if (!parsed.ok) {
        toast({ title: "Import Failed", description: parsed.errors.join("; "), variant: "destructive" });
        return;
      }
      const snapshot = parsed.value;
      const plannedIds = new Set(snapshot.works.map((w) => w.id));
      const res = stateMod.applyBackupImport(snapshot, plannedIds);
      const anySnapshot = snapshot as unknown as { categories?: unknown[]; credentials?: unknown[] };
      if (typeof window !== "undefined" && Array.isArray(anySnapshot.categories) && anySnapshot.categories.length > 0) {
        try {
          const rawStored = window.localStorage.getItem("cv:custom_categories:v1");
          const existingCategories: any[] = rawStored ? JSON.parse(rawStored) : [];
          const existingIds = new Set(existingCategories.map((c) => c.id));
          const newCats = (anySnapshot.categories as any[]).filter((c) => !existingIds.has(c.id));
          if (newCats.length > 0) {
            window.localStorage.setItem("cv:custom_categories:v1", JSON.stringify([...existingCategories, ...newCats]));
          }
        } catch {}
      }
      if (typeof window !== "undefined" && Array.isArray(anySnapshot.credentials) && anySnapshot.credentials.length > 0) {
        try {
          const rawCreds = window.localStorage.getItem("grimoire:vault:credentials");
          const existingCreds: any[] = rawCreds ? JSON.parse(rawCreds) : [];
          const existingIds = new Set(existingCreds.map((c) => c.id));
          const newCreds = (anySnapshot.credentials as any[]).filter((c) => !existingIds.has(c.id));
          if (newCreds.length > 0) {
            window.localStorage.setItem("grimoire:vault:credentials", JSON.stringify([...existingCreds, ...newCreds]));
          }
        } catch {}
      }
      toast({
        title: "Seed Archive Imported!",
        description: `Imported ${res.worksCreated} works, ${res.memoriesCreated} memories, ${res.relationsCreated} relations. Opening Sanctum Library!`,
      });
      handleEnterRoom("/library");
    } catch (err: unknown) {
      toast({ title: "Import Error", description: err instanceof Error ? err.message : "Failed to import", variant: "destructive" });
    } finally {
      e.target.value = "";
    }
  };'''

new_import_handlers = '''  const handleUniversalArchiveImport = async (file: File) => {
    try {
      const text = await file.text();
      let rawData: any;
      try {
        rawData = JSON.parse(text);
      } catch {
        toast({
          title: "Import Error",
          description: "File is not a valid JSON or .gca format.",
          variant: "destructive",
        });
        return;
      }

      const stateMod = await import("@grimoire/state");

      // Extract user identity
      let detectedUser =
        rawData.user?.username ||
        rawData.account?.username ||
        (typeof rawData.user === "string" ? rawData.user : undefined) ||
        (typeof rawData.account === "string" ? rawData.account : undefined) ||
        rawData.username;

      if (!detectedUser && file.name) {
        detectedUser = file.name
          .replace(/\\.(gca|cca|json|zip)$/i, "")
          .replace(/^grimoire_sample_pack_\\d+_/, "")
          .replace(/[_-]+/g, " ")
          .trim();
      }
      if (!detectedUser || !detectedUser.trim()) {
        detectedUser = "Archivist";
      }

      // Persist user account and session
      window.localStorage.setItem("cv:username", detectedUser);
      window.localStorage.setItem("cv:auth_token", `token-${Date.now()}`);
      setCurrentUser(detectedUser);

      // Import into repository
      let worksCreated = 0;
      let memoriesCreated = 0;
      let relationsCreated = 0;

      if (Array.isArray(rawData.works)) {
        const plannedIds = new Set<string>(rawData.works.map((w: any) => String(w.id)));
        const res = stateMod.applyBackupImport(rawData, plannedIds);
        worksCreated = res.worksCreated;
        memoriesCreated = res.memoriesCreated;
        relationsCreated = res.relationsCreated;
      }

      // Restore categories
      if (Array.isArray(rawData.categories) && rawData.categories.length > 0) {
        try {
          const rawStored = window.localStorage.getItem("cv:custom_categories:v1");
          const existingCategories: any[] = rawStored ? JSON.parse(rawStored) : [];
          const existingIds = new Set(existingCategories.map((c: any) => c.id));
          const newCats = rawData.categories.filter((c: any) => !existingIds.has(c.id));
          if (newCats.length > 0) {
            window.localStorage.setItem("cv:custom_categories:v1", JSON.stringify([...existingCategories, ...newCats]));
          }
        } catch {}
      }

      // Restore credentials
      if (Array.isArray(rawData.credentials) && rawData.credentials.length > 0) {
        try {
          const rawCreds = window.localStorage.getItem("grimoire:vault:credentials");
          const existingCreds: any[] = rawCreds ? JSON.parse(rawCreds) : [];
          const existingIds = new Set(existingCreds.map((c: any) => c.id));
          const newCreds = rawData.credentials.filter((c: any) => !existingIds.has(c.id));
          if (newCreds.length > 0) {
            window.localStorage.setItem("grimoire:vault:credentials", JSON.stringify([...existingCreds, ...newCreds]));
          }
        } catch {}
      }

      // Refresh library store
      stateMod.useLibraryStore.getState().refresh();

      // Update saved profiles
      const nextSaved: SavedProfileRecord[] = [
        {
          username: detectedUser,
          roomName: `${detectedUser}'s Reading Sanctum`,
          themePreference: "midnight-arcana",
          lastActiveAt: new Date().toISOString(),
        },
        ...savedProfiles.filter((p) => p.username.toLowerCase() !== detectedUser.toLowerCase()),
      ];
      setSavedProfiles(nextSaved);
      try {
        window.localStorage.setItem(SAVED_PROFILES_STORAGE_KEY, JSON.stringify(nextSaved));
      } catch {}

      toast({
        title: "Profile Archive Restored!",
        description: `Imported ${worksCreated} works, ${memoriesCreated} memories, ${relationsCreated} relations. Welcome, @${detectedUser}! Opening your reading room...`,
      });

      // IMMEDIATELY ENTER ROOM / LIBRARY
      setIsExitingToRoom(true);
      window.setTimeout(() => {
        onEnterRoom("/library");
      }, 100);
    } catch (err) {
      toast({
        title: "Import Failed",
        description: err instanceof Error ? err.message : "Failed to import .gca archive.",
        variant: "destructive",
      });
    }
  };

  const handleLandingFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      void handleUniversalArchiveImport(file);
    }
  };

  const handleImportGcaFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      void handleUniversalArchiveImport(file);
    }
  };'''

content = content.replace(old_import_handlers, new_import_handlers)

# 9. Redesign Popular Portals: Multiple-Column List Format & Category Filters
old_portals_ui = '''              {/* Sharp Architectural Medium Filter Tabs */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "ALL PORTALS (24)" },
                  { id: "manga", label: "MANGA & COMICS (6)" },
                  { id: "manhwa", label: "MANHWA & WEBTOONS (6)" },
                  { id: "novel", label: "WEB & LIGHT NOVELS (6)" },
                  { id: "anime", label: "ANIME & DONGHUA (6)" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSiteCategory(tab.id as typeof siteCategory)}
                    className={`px-4 py-2 text-gm-xs font-mono font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                      siteCategory === tab.id
                        ? "border-[var(--gm-border-strong)] bg-[var(--gm-accent)] text-[var(--gm-accent-fg)] shadow-[3px_3px_0px_var(--gm-border-strong)]"
                        : "border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] hover:border-[var(--gm-border-strong)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Portal Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSites.map((site) => (
                  <div
                    key={site.id}
                    className="border-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] p-5 flex flex-col justify-between shadow-[3px_3px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-gm-base font-extrabold text-[var(--gm-text)]">
                              {site.name}
                            </h3>
                            <span className="border border-[var(--gm-border-strong)] bg-[var(--gm-accent-muted)] px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-[var(--gm-accent-strong)]">
                              {site.categoryLabel}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-[var(--gm-text-subtle)] mt-0.5">
                            {site.domain} · {site.languages}
                          </p>
                        </div>
                        <span className="border border-[var(--gm-border)] bg-[var(--gm-surface)] px-2 py-0.5 text-[10px] font-mono uppercase text-[var(--gm-text-muted)] shrink-0">
                          {site.badge}
                        </span>
                      </div>

                      <p className="text-gm-xs text-[var(--gm-text-muted)] leading-relaxed">
                        {site.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[var(--gm-border)] flex items-center justify-between gap-2">
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-[var(--gm-surface)] hover:bg-[var(--gm-surface-hover)] border border-[var(--gm-border-strong)] px-3 py-1.5 text-gm-xs font-mono font-bold uppercase text-[var(--gm-text)] transition-colors"
                      >
                        <span>LAUNCH</span>
                        <ExternalLink className="h-3 w-3 text-[var(--gm-accent-strong)]" />
                      </a>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard) {
                              void navigator.clipboard.writeText(site.url);
                            }
                            setCopiedSiteId(site.id);
                            window.setTimeout(() => setCopiedSiteId(null), 1800);
                          }}
                          className="inline-flex items-center gap-1 border border-[var(--gm-border-strong)] bg-[var(--gm-bg)] px-2.5 py-1.5 text-[11px] font-mono font-bold uppercase text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] cursor-pointer"
                          title="Copy portal URL"
                        >
                          {copiedSiteId === site.id ? (
                            <>
                              <Check className="h-3 w-3 text-[var(--gm-success)]" />
                              <span>COPIED</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>URL</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleQuickCaptureSite(site)}
                          className="inline-flex items-center gap-1 border border-[var(--gm-border-strong)] bg-[var(--gm-bg)] px-2.5 py-1.5 text-[11px] font-mono font-bold uppercase text-[var(--gm-accent-strong)] hover:bg-[var(--gm-accent-muted)] cursor-pointer"
                          title="Quick-Capture portal to your Room Radar"
                        >
                          <Radar className="h-3 w-3" />
                          <span>{capturedSiteId === site.id ? "SAVED!" : "+ RADAR"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>'''

new_portals_ui = '''              {/* Clean Architectural Medium Filter Tabs (No hardcoded counts) */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "ALL PORTALS" },
                  { id: "manga", label: "MANGA & COMICS" },
                  { id: "manhwa", label: "MANHWA & WEBTOONS" },
                  { id: "novel", label: "WEB & LIGHT NOVELS" },
                  { id: "anime", label: "ANIME & DONGHUA" },
                  { id: "drama", label: "ASIAN DRAMAS (KDRAMA/CDRAMA)" },
                  { id: "movie", label: "MOVIES & SERIES" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSiteCategory(tab.id as typeof siteCategory)}
                    className={`px-3.5 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                      siteCategory === tab.id
                        ? "border-[var(--gm-border-strong)] bg-[var(--gm-accent)] text-[var(--gm-accent-fg)] shadow-[3px_3px_0px_var(--gm-border-strong)]"
                        : "border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] hover:border-[var(--gm-border-strong)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Redesigned Multiple-Column Dense List Format */}
              <div className="border-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] shadow-[4px_4px_0px_var(--gm-border-strong)] divide-y divide-[var(--gm-border)] overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-2.5 bg-[var(--gm-surface)] font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--gm-text-muted)] border-b border-[var(--gm-border)]">
                  <div className="col-span-3">Reading &amp; Streaming Portal</div>
                  <div className="col-span-2">Format &amp; Category</div>
                  <div className="col-span-4">Catalog Focus &amp; Languages</div>
                  <div className="col-span-3 text-right">Quick Actions</div>
                </div>

                <div className="divide-y divide-[var(--gm-border)]">
                  {filteredSites.map((site) => (
                    <div
                      key={site.id}
                      className="p-4 sm:px-5 sm:py-3.5 flex flex-col md:grid md:grid-cols-12 gap-3 md:items-center hover:bg-[var(--gm-surface)]/50 transition-colors"
                    >
                      {/* Col 1: Portal Name & Domain */}
                      <div className="md:col-span-3 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-gm-sm text-[var(--gm-text)] truncate">
                            {site.name}
                          </h3>
                        </div>
                        <a
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-[var(--gm-accent-strong)] hover:underline inline-flex items-center gap-1 mt-0.5 truncate"
                        >
                          <span>{site.domain}</span>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        </a>
                      </div>

                      {/* Col 2: Category & Badge */}
                      <div className="md:col-span-2 flex items-center gap-2 flex-wrap">
                        <span className="border border-[var(--gm-border-strong)] bg-[var(--gm-accent-muted)] px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-[var(--gm-accent-strong)] rounded-cv shrink-0">
                          {site.categoryLabel}
                        </span>
                        <span className="border border-[var(--gm-border)] bg-[var(--gm-surface)] px-2 py-0.5 text-[10px] font-mono uppercase text-[var(--gm-text-muted)] rounded-cv shrink-0">
                          {site.badge}
                        </span>
                      </div>

                      {/* Col 3: Description & Languages */}
                      <div className="md:col-span-4 text-gm-xs space-y-0.5">
                        <p className="text-[var(--gm-text)] line-clamp-1">
                          {site.description}
                        </p>
                        <p className="font-mono text-[10px] text-[var(--gm-text-subtle)]">
                          {site.languages}
                        </p>
                      </div>

                      {/* Col 4: Quick Action Controls */}
                      <div className="md:col-span-3 flex items-center justify-start md:justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--gm-border)]">
                        <a
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-[var(--gm-surface)] hover:bg-[var(--gm-surface-hover)] border border-[var(--gm-border-strong)] px-2.5 py-1 text-gm-xs font-mono font-bold uppercase text-[var(--gm-text)] transition-colors cursor-pointer"
                        >
                          <span>LAUNCH</span>
                          <ExternalLink className="h-3 w-3 text-[var(--gm-accent-strong)]" />
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard) {
                              void navigator.clipboard.writeText(site.url);
                            }
                            setCopiedSiteId(site.id);
                            window.setTimeout(() => setCopiedSiteId(null), 1800);
                          }}
                          className="inline-flex items-center gap-1 border border-[var(--gm-border-strong)] bg-[var(--gm-bg)] px-2 py-1 text-[11px] font-mono font-bold uppercase text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] cursor-pointer"
                          title="Copy portal URL"
                        >
                          {copiedSiteId === site.id ? (
                            <>
                              <Check className="h-3 w-3 text-[var(--gm-success)]" />
                              <span>COPIED</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>URL</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleQuickCaptureSite(site)}
                          className="inline-flex items-center gap-1 border border-[var(--gm-border-strong)] bg-[var(--gm-bg)] px-2 py-1 text-[11px] font-mono font-bold uppercase text-[var(--gm-accent-strong)] hover:bg-[var(--gm-accent-muted)] cursor-pointer"
                          title="Quick-Capture portal to your Room Radar"
                        >
                          <Radar className="h-3 w-3" />
                          <span>{capturedSiteId === site.id ? "SAVED!" : "+ RADAR"}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>'''

content = content.replace(old_portals_ui, new_portals_ui)

# Make sure hidden inputs point to handleLandingFileImport / handleImportGcaFile
content = content.replace(
    '<input\n        id="landing-gca-import-input"\n        type="file"\n        accept=".gca,.cca,.json"\n        className="hidden"\n        onChange={handleLandingFileImport}\n      />',
    '<input\n        ref={gcaFileInputRef}\n        id="landing-gca-import-input"\n        type="file"\n        accept=".gca,.cca,.json"\n        className="hidden"\n        onChange={handleLandingFileImport}\n      />'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SanctumHome.tsx patched successfully!")
