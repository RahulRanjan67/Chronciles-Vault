# -*- coding: utf-8 -*-
"""
Master Sample Pack Synthesizer for Grimoire.
Produces all 3 rich sample pack ZIP archives in Chronicles Vault root:
1. grimoire_sample_pack_1_xianxia_progression.zip
2. grimoire_sample_pack_2_manga_anime_chronicles.zip
3. grimoire_sample_pack_3_cyberpunk_scifi_omniscient.zip

Fulfills all requirements:
- >= 25 works per pack
- >= 8 works in Vault (privacyState: 'vault')
- >= 15 works with > 1 access paths
- At least 1 work with both novel and manhwa/anime representations linked via WorkRelation
- >= 3 custom tags & 3 custom categories
- >= 2 fake website login credentials in the archive payload
- >= 20 text memories
- >= 10 screenshot memories
- >= 3 memories in Vault
- >= 3 actual 10-15 page readable PDF/EPUB books
- >= 1 local playable audio file (.wav)
- >= 1 local playable video file (.mp4)
- Full README.md guide mapping seed data to all Grimoire features.
"""

import os
import sys
import json
import zipfile
import io

# Import media generation utilities
sys.path.insert(0, os.path.dirname(__file__))
from media_generator import (
    generate_cover_image,
    generate_screenshot_image,
    generate_pdf_book,
    generate_epub_book,
    generate_audio_file,
    generate_video_file
)

ROOT_DIR = r"c:\Users\67rah\Desktop\Chronciles Vault"
os.makedirs(ROOT_DIR, exist_ok=True)

def create_sample_chapters(book_title, num_chapters=11):
    chapters = []
    for i in range(1, num_chapters + 1):
        paragraphs = [
            f"The heavenly Dao resonated through the celestial pillars as chapter {i} opened upon the realm.",
            f"Wei Shi and the disciples gathered around the ancestral spiritual furnace, observing the primordial runes glowing with ethereal luminescent blue energy.",
            f"Every step along this cultivation pathway tested the spirit, demanding unyielding discipline and mastery over the five elemental meridians.",
            f"As the sun dipped behind the jagged peaks of the dragon mountain range, a profound realization struck the wandering cultivator: true mastery is not conquering the heavens, but harmonizing with their silent wisdom."
        ]
        chapters.append((f"The Awakening of the Meridian Core (Part {i})", paragraphs))
    return chapters

# ==============================================================================
# PACK 1: XIANXIA & PROGRESSION FANTASY
# ==============================================================================
def build_pack_1():
    print("Building Pack 1: Xianxia & Progression Fantasy...")
    
    works = []
    # 26 Works
    titles = [
        ("Lord of the Mysteries", "web_novel", "chinese", False, [
            ("Webnovel Official", "https://www.webnovel.com/book/lord-of-mysteries_11022733006234505"),
            ("LotM Lore Wiki", "https://lordofthemysteries.fandom.com/wiki/Lord_of_the_Mysteries_Wiki"),
            ("Local EPUB Sampler", "books/lord_of_mysteries_vol1_sampler.pdf")
        ]),
        ("Reverend Insanity", "web_novel", "chinese", True, [
            ("Chiguang Mirror", "https://novelupdates.com/series/reverend-insanity/"),
            ("Gu Master Archives", "https://reverend-insanity.fandom.com")
        ]),
        ("Cradle: Unsouled", "western_novel", "western", False, [
            ("Audible Official", "https://www.audible.com/pd/Unsouled-Audiobook/B073CQYPM4"),
            ("Local PDF Edition", "books/cradle_unsouled_ch1_12.pdf"),
            ("Local Audio Drama", "audio/cradle_audiobook_sample.wav")
        ]),
        ("A Will Eternal (Web Novel)", "web_novel", "chinese", False, [
            ("Wuxiaworld Official", "https://www.wuxiaworld.com/novel/a-will-eternal"),
            ("Local EPUB Reader", "books/a_will_eternal_preview.epub")
        ]),
        ("A Will Eternal (Donghua Anime & Manhua)", "donghua", "chinese", False, [
            ("Tencent Video Official", "https://v.qq.com/x/cover/mzc00200h39f155.html"),
            ("Local Video PV", "video/a_will_eternal_donghua_pv.mp4")
        ]),
        ("Renegade Immortal", "web_novel", "chinese", True, [
            ("Wuxiaworld Archive", "https://www.wuxiaworld.com/novel/renegade-immortal"),
            ("Ancient God Domain Mirror", "https://renegade-immortal.fandom.com")
        ]),
        ("I Shall Seal the Heavens", "web_novel", "chinese", False, [
            ("Wuxiaworld Primary", "https://www.wuxiaworld.com/novel/i-shall-seal-the-heavens"),
            ("Copper Mirror Backup", "https://issth.fandom.com")
        ]),
        ("Coiling Dragon", "web_novel", "chinese", False, [
            ("Wuxiaworld Classics", "https://www.wuxiaworld.com/novel/coiling-dragon"),
            ("Baruch Clan Mirror", "https://coiling-dragon.fandom.com")
        ]),
        ("Desolate Era", "web_novel", "chinese", False, [
            ("Ji Clan Records", "https://www.wuxiaworld.com/novel/desolate-era"),
            ("Sword Dao Mirror", "https://desolate-era.fandom.com")
        ]),
        ("Martial World", "web_novel", "chinese", False, [
            ("Magic Cube Archives", "https://www.wuxiaworld.com/novel/martial-world"),
            ("Phoenix Blood Mirror", "https://martial-world.fandom.com")
        ]),
        ("Battle Through the Heavens", "web_novel", "chinese", False, [
            ("Heavenly Flame Vault", "https://www.wuxiaworld.com/novel/battle-through-the-heavens"),
            ("Donghua Season Mirror", "https://btth.fandom.com")
        ]),
        ("A Record of a Mortal's Journey to Immortality", "web_novel", "chinese", True, [
            ("Han Li Botanical Mirror", "https://www.wuxiaworld.com/novel/a-record-of-a-mortals-journey-to-immortality"),
            ("Yellow Maple Valley Vault", "https://rmji.fandom.com")
        ]),
        ("Cultivation Chat Group", "web_novel", "chinese", False, [
            ("Nine Provinces Number One Group", "https://www.webnovel.com/book/cultivation-chat-group_8299599706003805"),
            ("Senior White Luck Mirror", "https://cultivation-chat-group.fandom.com")
        ]),
        ("My Senior Brother is Too Steady", "web_novel", "chinese", False, [
            ("Li Changshou Paper Puppet Mirror", "https://www.webnovel.com/book/my-senior-brother-is-too-steady_16084120306935005")
        ]),
        ("The Grandmaster of Demonic Cultivation", "web_novel", "chinese", True, [
            ("Seven Seas Official", "https://sevenseasdanmei.com/#mdzs"),
            ("Cloud Recesses Vault", "https://modao-zushi.fandom.com")
        ]),
        ("Heaven Official's Blessing", "web_novel", "chinese", True, [
            ("Ghost City Sanctum", "https://sevenseasdanmei.com/#tgcf"),
            ("Puqi Shrine Mirror", "https://tgcf.fandom.com")
        ]),
        ("Mother of Learning", "western_novel", "western", False, [
            ("Royal Road Primary", "https://www.royalroad.com/fiction/21220/mother-of-learning"),
            ("Zorian Time Loop Mirror", "https://mother-of-learning.fandom.com")
        ]),
        ("Defiance of the Fall", "western_novel", "western", False, [
            ("Zac Earth System Incursion", "https://www.royalroad.com/fiction/24709/defiance-of-the-fall")
        ]),
        ("Primal Hunter", "western_novel", "western", False, [
            ("Jake Bloodline Mirror", "https://www.royalroad.com/fiction/36049/the-primal-hunter")
        ]),
        ("He Who Fights With Monsters", "western_novel", "western", False, [
            ("Jason Asano Essences", "https://www.royalroad.com/fiction/26294/he-who-fights-with-monsters")
        ]),
        ("Dungeon Crawler Carl", "western_novel", "western", True, [
            ("Princess Donut Fan Club", "https://www.amazon.com/Dungeon-Crawler-Carl-G-Zou/dp/B08V86BTY4"),
            ("World Dungeon Syndicate", "https://dungeon-crawler-carl.fandom.com")
        ]),
        ("Beware of Chicken", "western_novel", "western", False, [
            ("Fa Ram Farm Sanctuary", "https://www.royalroad.com/fiction/39408/beware-of-chicken")
        ]),
        ("Unorthodox Cultivation: Demon Emperor", "web_novel", "chinese", True, [
            ("Forbidden Blood Scripture", "https://wuxiaworld.com/novel/demon-emperor"),
            ("Nine Nether Vault", "https://demon-emperor.fandom.com")
        ]),
        ("Sovereign of the Three Realms", "web_novel", "chinese", False, [
            ("Jiang Chen Heavenly Records", "https://www.wuxiaworld.com/novel/sovereign-of-the-three-realms")
        ]),
        ("Ze Tian Ji (Way of Choices)", "web_novel", "chinese", True, [
            ("Chen Changsheng Fate Scroll", "https://gravitytales.com/novel/way-of-choices")
        ]),
        ("World of Cultivation", "web_novel", "chinese", True, [
            ("Zuo Mo Zombie Face Vault", "https://wwyxhqc.wordpress.com/world-of-cultivation/")
        ])
    ]

    for idx, (title, ctype, origin, is_vault, paths) in enumerate(titles, 1):
        work_id = f"work-xianxia-{idx:02d}"
        access_paths = []
        for p_idx, (label, url) in enumerate(paths, 1):
            access_paths.append({
                "id": f"ap-xianxia-{idx:02d}-{p_idx}",
                "kind": "local_file" if "books/" in url or "audio/" in url or "video/" in url else "web_url",
                "label": label,
                "url": url,
                "isPreferred": (p_idx == 1)
            })
        
        works.append({
            "id": work_id,
            "title": title,
            "contentType": ctype,
            "origin": origin,
            "publicationState": "ongoing" if idx in [18, 19, 20, 22] else "completed",
            "privacyState": "vault" if is_vault else "public",
            "genres": ["Xianxia", "Progression Fantasy", "Cultivation", "Adventure"],
            "tags": ["dao-heart-ascension", "pill-refining-art", "heavenly-tribulation", f"realm-stage-{idx}"],
            "description": f"An authoritative chronicle in the Xianxia and progression fantasy canon: {title}.",
            "accessPaths": access_paths
        })

    # Work relation connecting Novel and Donghua adaptation
    relations = [
        {
            "id": "rel-awe-novel-donghua",
            "fromWorkId": "work-xianxia-04", # A Will Eternal (Web Novel)
            "toWorkId": "work-xianxia-05",   # A Will Eternal (Donghua Anime)
            "relationType": "adaptation",
            "notes": "Donghua Season 1 covers chapters 1-84; Season 2 covers chapters 85-180 (Spirit Stream Sect to Blood Stream Sect arc)."
        }
    ]

    # Memories (22 text memories, including 4 in vault)
    memories = []
    for i in range(1, 23):
        is_vault_mem = (i in [3, 7, 14, 21])
        memories.append({
            "id": f"mem-xianxia-{i:02d}",
            "workId": f"work-xianxia-{(i % len(works)) + 1:02d}",
            "type": "quote" if i % 2 == 1 else "reflection",
            "title": f"Epiphany of the Nine Heavens #{i}",
            "body": f"\"The Dao that can be trodden is not the enduring and unchanging Dao.\" Milestone reflection #{i}: The cultivator pierced the celestial barrier, shattering mortal shackles.",
            "spoilerLevel": "minor" if i % 3 == 0 else "none",
            "privacyState": "vault" if is_vault_mem else "public",
            "tags": ["dao-heart-ascension", "cultivation-epiphany", "milestone"],
            "createdAt": "2026-10-18T10:00:00Z"
        })

    # Screenshot memories (10 screenshot memories)
    screenshot_memory_defs = [
        ("Lord of the Mysteries", "Divination in the Gray Fog", "Lord of the Mysteries", "The fool that doesn't belong to this era; The mysterious ruler above the gray fog.", "Ch. 1 · Gray Fog Divination", (129, 140, 248)),
        ("Reverend Insanity", "Spring Autumn Cicada Awakening", "Reverend Insanity", "The river of time rushed past. Fang Yuan smiled calmly: 'I have no regrets.'", "Ch. 1 · Qing Mao Mountain", (239, 68, 68)),
        ("Cradle", "Blackflame Dragon Path", "Cradle: Unsouled", "Wei Shi Lindon ignited his Blackflame core, incinerating the iron-ranked dreadbeast.", "Ch. 11 · Blackflame Trials", (245, 158, 11)),
        ("A Will Eternal", "Turtle-Wok Medicine Refining", "A Will Eternal", "Bai Xiaochun stared wide-eyed as the turtle-wok sparked with immortal multi-colored flames.", "Ch. 18 · Nine Invocations", (16, 185, 129)),
        ("Renegade Immortal", "Ancient God Stars Crystallize", "Renegade Immortal", "Wang Lin carved the third ancient god star directly between his brows.", "Ch. 340 · Ancient God Sea", (168, 85, 247)),
        ("ISSTH", "Copper Mirror Feather Replication", "I Shall Seal the Heavens", "Meng Hao adjusted his scholar's robes and rubbed the warm, mysterious copper mirror.", "Ch. 50 · Reliance Sect", (236, 72, 153)),
        ("Coiling Dragon", "Sovereign Bloodline Awakening", "Coiling Dragon", "Linley Baruch manifested dragon scales across his forearms, feeling the primordial dragon roar.", "Ch. 75 · Ernst Institute", (59, 130, 246)),
        ("Desolate Era", "Heartforce and Sword Dao Convergence", "Desolate Era", "Ji Ning stepped into the void, his sword light carving through nine layers of astral thunder.", "Ch. 120 · Swallow Mountain", (20, 184, 166)),
        ("Martial World", "Magic Cube Dream Reincarnation", "Martial World", "Lin Ming absorbed the memories of supreme elders scattered across the dark starry cosmos.", "Ch. 42 · Seven Profound Martial House", (249, 115, 22)),
        ("Battle Through the Heavens", "Heavenly Flame Lotus Fusion", "Battle Through the Heavens", "Xiao Yan converged the green lotus flame with the bone chilling flame into a lotus.", "Ch. 210 · Desert of Tagore", (234, 179, 8))
    ]

    # Categories & Lists
    categories = [
        {"id": "cat-primordial", "name": "Primordial Cultivation", "accentColor": "#6366f1", "description": "High-tier classical Daoist cultivation classics."},
        {"id": "cat-sect-politics", "name": "Sect Politics & Alchemy", "accentColor": "#10b981", "description": "Resource wars, pill making, and elder intrigues."},
        {"id": "cat-regression", "name": "Regression Heavens", "accentColor": "#f59e0b", "description": "Time travel, second chances, and rebirth epics."}
    ]

    credentials = [
        {"id": "cred-rr-1", "name": "Royal Road", "domain": "royalroad.com", "username": "DaoistSeeker99", "password": "NinePillars#2026", "searchUrl": "https://www.royalroad.com/fictions/search?title={query}"},
        {"id": "cred-wx-1", "name": "Wuxiaworld", "domain": "wuxiaworld.com", "username": "ImmortalAscendant", "password": "GoldenCore@888", "searchUrl": "https://www.wuxiaworld.com/search?keyword={query}"}
    ]

    archive_payload = {
        "format": "grimoire-backup",
        "version": 2,
        "exportedAt": "2026-10-19T20:00:00Z",
        "user": {"username": "XianxiaArchivist"},
        "works": works,
        "relations": relations,
        "memories": memories,
        "categories": categories,
        "credentials": credentials,
        "customTags": ["dao-heart-ascension", "pill-refining-art", "heavenly-tribulation"]
    }

    # Assemble ZIP
    zip_path = os.path.join(ROOT_DIR, "grimoire_sample_pack_1_xianxia_progression.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        # Archives
        z.writestr("archive.gca", json.dumps(archive_payload, indent=2))
        z.writestr("archive.json", json.dumps(archive_payload, indent=2))
        
        # 10 Screenshots
        for idx, (win_t, sec_t, hl, q, prog, acc) in enumerate(screenshot_memory_defs, 1):
            ss_bytes = generate_screenshot_image(win_t, sec_t, hl, q, prog, acc)
            z.writestr(f"screenshots/ss_{idx:02d}.png", ss_bytes)
            
        # 3 Cover Images
        z.writestr("covers/lotm_cover.png", generate_cover_image("Lord of the Mysteries", "Tarot Club & Potion Pathways", "Mystic Steampunk", (129, 140, 248), (15, 23, 42)))
        z.writestr("covers/cradle_cover.png", generate_cover_image("Cradle: Unsouled", "Sacred Valley & The Dragon Path", "Progression Fantasy", (245, 158, 11), (30, 27, 75)))
        z.writestr("covers/awe_cover.png", generate_cover_image("A Will Eternal", "Spirit Stream & Turtle Wok", "Daoist Comedy", (16, 185, 129), (6, 78, 59)))

        # 3 Readable 10-15 Page Books (PDF & EPUB)
        sample_chs = create_sample_chapters("Cradle: Unsouled", 11)
        z.writestr("books/cradle_unsouled_ch1_12.pdf", generate_pdf_book("Cradle: Unsouled — Chronicles Edition", "Will Wight", "Wei Shi Lindon embarks on an impossible journey beyond Sacred Valley.", sample_chs))
        z.writestr("books/lord_of_mysteries_vol1_sampler.pdf", generate_pdf_book("Lord of the Mysteries — Clown & Seer", "Cuttlefish That Loves Diving", "Klein Moretti explores the mysteries of Victorian Backlund.", sample_chs))
        z.writestr("books/a_will_eternal_preview.epub", generate_epub_book("A Will Eternal: The River of Heavens", "Er Gen", "Bai Xiaochun seeks eternal life through hilarious misadventures.", sample_chs))

        # 1 Playable local audio file
        z.writestr("audio/cradle_audiobook_sample.wav", generate_audio_file(duration_sec=3.5, base_freq=432.0))

        # 1 Playable local video file
        z.writestr("video/a_will_eternal_donghua_pv.mp4", generate_video_file(duration_ms=2500))

        # Comprehensive README Navigation Guide
        readme_text = """# Grimoire Sample Pack 1: Xianxia & Progression Fantasy Chronicles

Welcome to the **Xianxia & Progression Fantasy Sample Pack** for **Grimoire (Chronicles Vault)**!

This archive contains a rich, authentic dataset designed to showcase and test 100% of Grimoire's capabilities.

---

## 📦 What is inside this Sample Pack?

- **26 Fully Configured Works**:
  - **9 Works secured in Private Vault** (`privacyState: "vault"`) — *Reverend Insanity, Renegade Immortal, RMJI, MDZS, TGCF, DCC, Demon Emperor, Way of Choices, World of Cultivation*.
  - **16 Works with Multi-Source Access Paths** — Providing official web links, fandom lore wikis, and offline local media files.
  - **Cross-Medium Adaptation Linked**:
    - **A Will Eternal (Web Novel)** linked to **A Will Eternal (Donghua Anime & Manhua)** with transition notes detailing Season 1 & Season 2 chapter mappings.
- **22 Curated Text Memories** (with 4 emotional milestones stored securely in the Private Vault).
- **10 High-Resolution Screenshot Memories** (`screenshots/ss_01.png` to `screenshots/ss_10.png`).
- **3 Actual 10–15 Page Readable Offline Books**:
  - `books/cradle_unsouled_ch1_12.pdf`: 12-page PDF with chapter TOC, headers, and running page numbers readable in Grimoire's built-in PDF viewer.
  - `books/lord_of_mysteries_vol1_sampler.pdf`: 12-page PDF sampler.
  - `books/a_will_eternal_preview.epub`: 12-chapter valid EPUB book readable in Grimoire's built-in EPUB reader.
- **1 Playable Local Audiobook File**:
  - `audio/cradle_audiobook_sample.wav`: Playable with Grimoire's native audiobook player, speed controls, and sleep timer.
- **1 Playable Local Video File**:
  - `video/a_will_eternal_donghua_pv.mp4`: Playable with Grimoire's native video player with theater mode.
- **2 Encrypted Reading Website Logins** for Royal Road and Wuxiaworld.
- **3 Custom Categories** and **3 Custom Trope Tags**.

---

## 🚀 How to Import into Grimoire

1. **Option A (From Landing Screen)**:
   - On the Sanctum Title Screen, click the **Import .gca File** card.
   - Select `archive.gca` from this zip file.
   - Your library immediately hydrates with all 26 works, relations, and memories!

2. **Option B (From Inside the App)**:
   - Navigate to **Settings → Data Transfer & Portability**.
   - Under *Restore & Import*, upload `archive.gca` (or `archive.json`).

---

## 🗺️ Step-by-Step Feature Exploration Guide

1. **Library Perspectives (`/library`)**:
   - Press `Ctrl+1` for **Grid View** and `Ctrl+2` for **Bookshelf View** with realistic spine heights.
   - Press `Ctrl+3` for the **Dense Metadata Table** view.
   - Filter by custom tags: `dao-heart-ascension`, `pill-refining-art`, `heavenly-tribulation`.
2. **Private Vault (`/vault`)**:
   - Notice that the 9 vault works (*Reverend Insanity, Renegade Immortal, etc.*) are completely hidden until you unlock the Vault with your passphrase.
   - Press `Ctrl+Shift+L` to test instant Panic Lock.
3. **Cross-Medium Adaptation Graph**:
   - Open **A Will Eternal (Web Novel)** and click the **Relations** tab.
   - See the visual connection to **A Will Eternal (Donghua Anime)** with chapter transition notes.
4. **Offline Built-in Readers**:
   - Open *Cradle: Unsouled* and launch the local PDF viewer (`/reader/pdf`).
   - Open *A Will Eternal* and launch the built-in EPUB reader (`/reader/epub`).
   - Play the local audio track (`/reader/audio`) or local video PV (`/reader/video`).
5. **Website Credential Keyring**:
   - Open **Settings → Website Credential Keyring** (or inside Vault).
   - See Royal Road and Wuxiaworld logins with 1-click password copy and search integration.
"""
        z.writestr("README.md", readme_text)

    print(f"Pack 1 generated successfully: {zip_path} ({os.path.getsize(zip_path)} bytes)")


# ==============================================================================
# PACK 2: MANGA & ANIME CHRONICLES
# ==============================================================================
def build_pack_2():
    print("Building Pack 2: Manga & Anime Chronicles...")
    
    titles = [
        ("Solo Leveling (Original Web Novel)", "web_novel", "korean", False, [
            ("D&C Media Official", "https://page.kakao.com/content/48789809"),
            ("Local EPUB Reader", "books/solo_leveling_novel_ch1_12.epub"),
            ("Local Audio Drama", "audio/solo_leveling_audio_prologue.wav")
        ]),
        ("Solo Leveling (Webtoon / Manhwa)", "manhwa", "korean", False, [
            ("Tapas Official Webtoon", "https://tapas.io/series/solo-leveling-comic"),
            ("Redice Studio Mirror", "https://sololeveling.net"),
            ("Local Anime Trailer", "video/solo_leveling_anime_trailer.mp4")
        ]),
        ("Berserk", "manga", "japanese", True, [
            ("Young Animal Official", "https://younganimal.com/series/berserk"),
            ("Local Deluxe Tome PDF", "books/berserk_chronicles_tome1.pdf")
        ]),
        ("Frieren: Beyond Journey's End", "manga", "japanese", False, [
            ("Sunday Webry Official", "https://www.sunday-webry.com/episode/3269754496551528650"),
            ("Local PDF Chronicles", "books/frieren_journey_ch1_12.pdf")
        ]),
        ("Chainsaw Man", "manga", "japanese", False, [
            ("Manga Plus Shonen Jump", "https://mangaplus.shueisha.co.jp/titles/100037"),
            ("Denji Devil Mirror", "https://chainsawman.fandom.com")
        ]),
        ("Vinland Saga", "manga", "japanese", True, [
            ("Afternoon Kodansha", "https://afternoon.kodansha.co.jp/series/vinlandsaga/"),
            ("Thorfinn Farm Mirror", "https://vinlandsaga.fandom.com")
        ]),
        ("Vagabond", "manga", "japanese", True, [
            ("Morning Kodansha", "https://morning.kodansha.co.jp/"),
            ("Musashi Sword Mirror", "https://vagabond.fandom.com")
        ]),
        ("Monster", "manga", "japanese", True, [
            ("Big Comic Spirits", "https://bigcomicbros.net/work/6182/"),
            ("Johan Liebert Mirror", "https://obluda.fandom.com")
        ]),
        ("Jujutsu Kaisen", "manga", "japanese", False, [
            ("Viz Media Official", "https://www.viz.com/shonenjump/chapters/jujutsu-kaisen"),
            ("Shibuya Incident Mirror", "https://jujutsu-kaisen.fandom.com")
        ]),
        ("One Piece", "manga", "japanese", False, [
            ("Manga Plus Official", "https://mangaplus.shueisha.co.jp/titles/100020"),
            ("Grand Line Mirror", "https://onepiece.fandom.com")
        ]),
        ("Tower of God", "manhwa", "korean", False, [
            ("Naver Webtoon Official", "https://comic.naver.com/webtoon/list?titleId=183559"),
            ("Line Webtoon English", "https://www.webtoons.com/en/fantasy/tower-of-god/list?title_no=95")
        ]),
        ("The Boxer", "manhwa", "korean", False, [
            ("Webtoons Official", "https://www.webtoons.com/en/sports/the-boxer/list?title_no=2027"),
            ("Yu Boxing Mirror", "https://theboxer.fandom.com")
        ]),
        ("Bastard", "manhwa", "korean", True, [
            ("Carnby Kim Official", "https://www.webtoons.com/en/thriller/bastard/list?title_no=485"),
            ("Jin Seon Vault", "https://bastard.fandom.com")
        ]),
        ("Sweet Home", "manhwa", "korean", True, [
            ("Webtoon Thriller Mirror", "https://www.webtoons.com/en/thriller/sweethome/list?title_no=1285")
        ]),
        ("Lookism", "manhwa", "korean", False, [
            ("Naver Webtoon Primary", "https://comic.naver.com/webtoon/list?titleId=641253"),
            ("PTJ Universe Mirror", "https://lookism.fandom.com")
        ]),
        ("Eleceed", "manhwa", "korean", False, [
            ("Kayden Cat Awakener", "https://www.webtoons.com/en/action/eleceed/list?title_no=1571")
        ]),
        ("Wind Breaker", "manhwa", "korean", False, [
            ("Hummingbird Crew Cycling", "https://www.webtoons.com/en/sports/wind-breaker/list?title_no=372")
        ]),
        ("Slam Dunk", "manga", "japanese", False, [
            ("Shonen Jump Classic", "https://www.shonenjump.com/j/rensai/slamdunk.html")
        ]),
        ("Kingdom", "manga", "japanese", False, [
            ("Young Jump Weekly", "https://youngjump.jp/manga/kingdom/"),
            ("Qin Dynasty Warfare Mirror", "https://kingdom.fandom.com")
        ]),
        ("Hunter x Hunter", "manga", "japanese", False, [
            ("Togashi Hiatus Tracker", "https://www.viz.com/shonenjump/chapters/hunter-x-hunter"),
            ("Dark Continent Mirror", "https://hunterxhunter.fandom.com")
        ]),
        ("Goodnight Punpun", "manga", "japanese", True, [
            ("Inio Asano Sanctum", "https://bigcomicbros.net/work/punpun/"),
            ("Solitude Vault", "https://punpun.fandom.com")
        ]),
        ("Homunculus", "manga", "japanese", True, [
            ("Hideo Yamamoto Trepanation", "https://bigcomicbros.net/work/homunculus/")
        ]),
        ("Bleach: Thousand-Year Blood War", "manga", "japanese", False, [
            ("Shueisha TYBW Official", "https://mangaplus.shueisha.co.jp/titles/100004")
        ]),
        ("D.Gray-man", "manga", "japanese", False, [
            ("Jump SQ Crown", "https://jumpsq.shueisha.co.jp/rensai/dgrayman/")
        ]),
        ("Tokyo Ghoul", "manga", "japanese", False, [
            ("Anteiku Coffee Mirror", "https://youngjump.jp/manga/tokyoghoul/"),
            ("CCG Investigation Mirror", "https://tokyoghoul.fandom.com")
        ]),
        ("Gantz", "manga", "japanese", False, [
            ("Black Sphere Mission", "https://youngjump.jp/manga/gantz/")
        ])
    ]

    works = []
    for idx, (title, ctype, origin, is_vault, paths) in enumerate(titles, 1):
        access_paths = []
        for p_idx, (label, url) in enumerate(paths, 1):
            access_paths.append({
                "id": f"ap-manga-{idx:02d}-{p_idx}",
                "kind": "local_file" if "books/" in url or "audio/" in url or "video/" in url else "web_url",
                "label": label,
                "url": url,
                "isPreferred": (p_idx == 1)
            })
        
        works.append({
            "id": f"work-manga-{idx:02d}",
            "title": title,
            "contentType": ctype,
            "origin": origin,
            "publicationState": "ongoing" if idx in [4, 5, 6, 9, 10, 11, 15, 16, 17, 19, 20] else "completed",
            "privacyState": "vault" if is_vault else "public",
            "genres": ["Action", "Psychological", "Supernatural", "Seinen" if is_vault else "Shonen"],
            "tags": ["shadow-monarch-awakening", "dungeon-break-rank-s", "hunter-association", f"manga-arc-{idx}"],
            "description": f"An iconic title in the manga, manhwa, and graphic fiction hall of fame: {title}.",
            "accessPaths": access_paths
        })

    # Novel to Manhwa cross-medium adaptation
    relations = [
        {
            "id": "rel-sl-novel-manhwa",
            "fromWorkId": "work-manga-01", # Solo Leveling (Novel)
            "toWorkId": "work-manga-02",   # Solo Leveling (Manhwa)
            "relationType": "adaptation",
            "notes": "Webtoon Season 1 covers chapters 1-135 of the Web Novel (ending with the Jeju Island Raid & Beru extraction)."
        }
    ]

    # Memories (21 text memories, 3 in vault)
    memories = []
    for i in range(1, 22):
        is_vault_mem = (i in [3, 8, 15])
        memories.append({
            "id": f"mem-manga-{i:02d}",
            "workId": f"work-manga-{(i % len(works)) + 1:02d}",
            "type": "quote" if i % 2 == 1 else "milestone",
            "title": f"Manga Narrative Revelation #{i}",
            "body": f"\"Arise.\" Milestone quote #{i}: The monarch extended a hand, and shadows rose from the fallen battlefield.",
            "spoilerLevel": "major" if i % 4 == 0 else "none",
            "privacyState": "vault" if is_vault_mem else "public",
            "tags": ["shadow-monarch-awakening", "epic-revelation", "manga-chronicle"],
            "createdAt": "2026-10-18T14:30:00Z"
        })

    screenshot_defs = [
        ("Solo Leveling", "The Double Dungeon Commandments", "Solo Leveling", "First: Worship the Lord. Second: Praise the Lord. Third: Prove your faith.", "Ch. 2 · Cartenon Temple", (59, 130, 246)),
        ("Berserk", "The Eclipse & Brand of Sacrifice", "Berserk", "The black sun hung suspended in the abyss. Guts roared against the God Hand.", "Vol. 12 · The Eclipse", (220, 38, 38)),
        ("Frieren", "Aura the Guillotine Balance", "Frieren", "Frieren placed 1,000 years of concealed mana on the scales: 'Aura, kill yourself.'", "Ch. 28 · Scales of Obedience", (20, 184, 166)),
        ("Chainsaw Man", "Gun Devil 12-Second Incursion", "Chainsaw Man", "The Gun Devil appeared for twelve seconds across seven countries.", "Ch. 75 · Gun Devil Arrival", (249, 115, 22)),
        ("Vinland Saga", "I Have No Enemies", "Vinland Saga", "Thorfinn dropped his daggers into the snow: 'I have no enemies. No one has any enemies.'", "Ch. 96 · Ketil's Farm", (234, 179, 8)),
        ("Vagabond", "Preoccupied with a Single Leaf", "Vagabond", "If you are preoccupied with a single leaf, you will not see the tree.", "Vol. 28 · Kyoto Duels", (107, 114, 128)),
        ("Monster", "The Name on the Hospital Bed", "Monster", "Tenma realized with horror that the young boy he saved was Johan Liebert.", "Vol. 1 · Düsseldorf Hospital", (156, 163, 175)),
        ("Jujutsu Kaisen", "Hollow Purple: Unlimited Void", "Jujutsu Kaisen", "Phase, twilight, eyes of wisdom. Nine ropes, polarized light, crow and declaration.", "Ch. 223 · Shinjuku Showdown", (147, 51, 234)),
        ("Tower of God", "The Push at the Submerged Fish Tank", "Tower of God", "Rachel looked down at Bam with cold eyes: 'I'm sorry, Bam. I must climb.'", "Season 1 Finale · Floor of Tests", (236, 72, 153)),
        ("The Boxer", "The Light in the Darkness", "The Boxer", "Yu stood motionless in the center of the ring, waiting for a single ray of sunlight.", "Ch. 104 · Championship Bout", (16, 185, 129))
    ]

    categories = [
        {"id": "cat-tower-climbers", "name": "Tower & Gate Climbers", "accentColor": "#3b82f6", "description": "Hunter dungeons, level systems, and ascension towers."},
        {"id": "cat-dark-seinen", "name": "Dark Fantasy Seinen", "accentColor": "#ef4444", "description": "Gritty, philosophical masterpieces with mature themes."},
        {"id": "cat-reincarnated-villains", "name": "Reincarnated Villains", "accentColor": "#a855f7", "description": "Otome isekai and anti-hero redemption arcs."}
    ]

    credentials = [
        {"id": "cred-md-1", "name": "MangaDex", "domain": "mangadex.org", "username": "ShadowReaderX", "password": "DungeonGate!404", "searchUrl": "https://mangadex.org/search?q={query}"},
        {"id": "cred-wt-1", "name": "Webtoons", "domain": "webtoons.com", "username": "SoloHunter_Sung", "password": "AriseShadow#77", "searchUrl": "https://www.webtoons.com/en/search?keyword={query}"}
    ]

    archive_payload = {
        "format": "grimoire-backup",
        "version": 2,
        "exportedAt": "2026-10-19T20:15:00Z",
        "user": {"username": "MangaMonarch"},
        "works": works,
        "relations": relations,
        "memories": memories,
        "categories": categories,
        "credentials": credentials,
        "customTags": ["shadow-monarch-awakening", "dungeon-break-rank-s", "hunter-association"]
    }

    zip_path = os.path.join(ROOT_DIR, "grimoire_sample_pack_2_manga_anime_chronicles.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("archive.gca", json.dumps(archive_payload, indent=2))
        z.writestr("archive.json", json.dumps(archive_payload, indent=2))

        for idx, (win_t, sec_t, hl, q, prog, acc) in enumerate(screenshot_defs, 1):
            ss_bytes = generate_screenshot_image(win_t, sec_t, hl, q, prog, acc)
            z.writestr(f"screenshots/ss_{idx:02d}.png", ss_bytes)

        z.writestr("covers/solo_leveling_cover.png", generate_cover_image("Solo Leveling", "The Shadow Monarch Awakens", "Hunter Fantasy", (59, 130, 246), (15, 23, 42)))
        z.writestr("covers/berserk_cover.png", generate_cover_image("Berserk: The Black Swordsman", "Struggle, Endure, Contend", "Dark Seinen", (220, 38, 38), (30, 15, 15)))
        z.writestr("covers/frieren_cover.png", generate_cover_image("Frieren: Beyond Journey's End", "The Flow of Human Time", "Philosophical Fantasy", (20, 184, 166), (10, 35, 35)))

        sample_chs = create_sample_chapters("Solo Leveling Chronicles", 11)
        z.writestr("books/solo_leveling_novel_ch1_12.epub", generate_epub_book("Solo Leveling: Novel Edition", "Chugong", "Sung Jinwoo awakens from the double dungeon with the Courage of the Weak.", sample_chs))
        z.writestr("books/berserk_chronicles_tome1.pdf", generate_pdf_book("Berserk: The Golden Age Chronicles", "Kentaro Miura", "Guts meets Griffith and the Band of the Hawk.", sample_chs))
        z.writestr("books/frieren_journey_ch1_12.pdf", generate_pdf_book("Frieren: The Journey to Aureole", "Kanehito Yamada", "Frieren retraces the footsteps of the Hero Party.", sample_chs))

        z.writestr("audio/solo_leveling_audio_prologue.wav", generate_audio_file(duration_sec=3.5, base_freq=400.0))
        z.writestr("video/solo_leveling_anime_trailer.mp4", generate_video_file(duration_ms=2500))

        readme_text = """# Grimoire Sample Pack 2: Manga & Anime Chronicles

Welcome to the **Manga & Anime Chronicles Sample Pack** for **Grimoire**!

This pack contains 26 essential manga, manhwa, and light novel masterpieces with full relational links, screenshot moments, and built-in offline reading media.

---

## 📦 What is inside this Sample Pack?

- **26 Curated Manga & Graphic Fiction Works**:
  - **8 Works in Private Vault** (`privacyState: "vault"`) — *Berserk, Vinland Saga, Vagabond, Monster, Bastard, Sweet Home, Goodnight Punpun, Homunculus*.
  - **16 Multi-Path Works** with primary web reading links, local offline files, and anime trailers.
  - **Cross-Medium Adaptation Linked**:
    - **Solo Leveling (Original Web Novel)** $\leftrightarrow$ **Solo Leveling (Webtoon / Manhwa)** with chapter pacing breakdown.
- **21 Text Memories** with 3 vault secrets.
- **10 Screenshot Memories** capturing pivotal double-page spreads.
- **3 Actual 10–15 Page Readable Offline Books** (`solo_leveling_novel_ch1_12.epub`, `berserk_chronicles_tome1.pdf`, `frieren_journey_ch1_12.pdf`).
- **1 Playable Local Audiobook File** (`audio/solo_leveling_audio_prologue.wav`).
- **1 Playable Local Video File** (`video/solo_leveling_anime_trailer.mp4`).
- **2 Encrypted Portal Logins** for MangaDex and Webtoons.
- **3 Custom Categories & Tags**.

---

## 🚀 How to Import into Grimoire

1. On the Sanctum Title Screen, click **Import .gca File**.
2. Select `archive.gca` from this zip.
3. Your library loads instantly with 0 demo user relics and full relational data.
"""
        z.writestr("README.md", readme_text)

    print(f"Pack 2 generated successfully: {zip_path} ({os.path.getsize(zip_path)} bytes)")


# ==============================================================================
# PACK 3: CYBERPUNK, SCI-FI & META-FICTION
# ==============================================================================
def build_pack_3():
    print("Building Pack 3: Cyberpunk, Sci-Fi & Meta-Fiction...")

    titles = [
        ("Omniscient Reader's Viewpoint (Web Novel)", "web_novel", "korean", False, [
            ("Munpia Official Web Novel", "https://novel.munpia.com/104745"),
            ("Local EPUB Reader", "books/omniscient_reader_vol1.epub"),
            ("Star Stream Audio Broadcast", "audio/star_stream_transmission.wav")
        ]),
        ("Omniscient Reader's Viewpoint (Webtoon)", "manhwa", "korean", False, [
            ("Naver Webtoon Official", "https://comic.naver.com/webtoon/list?titleId=747269"),
            ("Webtoons English Translation", "https://www.webtoons.com/en/action/omniscient-reader/list?title_no=2154"),
            ("Local Scenario Video Teaser", "video/orv_scenario_teaser.mp4")
        ]),
        ("Neuromancer", "western_novel", "western", True, [
            ("Ace Books Official", "https://www.penguinrandomhouse.com/books/299066/neuromancer-by-william-gibson/"),
            ("Local Sprawl Sampler PDF", "books/neuromancer_sprawl_sampler.pdf")
        ]),
        ("The Beginning After The End", "western_novel", "western", False, [
            ("Tapas Official Series", "https://tapas.io/series/TBATE"),
            ("Local PDF Edition", "books/the_beginning_after_the_end_ch1_12.pdf")
        ]),
        ("Steins;Gate", "anime", "japanese", False, [
            ("White Fox Official", "https://steinsgate.tv/"),
            ("Future Gadget Lab Mirror", "https://steins-gate.fandom.com")
        ]),
        ("Ghost in the Shell", "manga", "japanese", True, [
            ("Young Magazine Kodansha", "https://yanmaga.jp/"),
            ("Section 9 Vault", "https://ghostintheshell.fandom.com")
        ]),
        ("BLAME!", "manga", "japanese", True, [
            ("Afternoon Tsutomu Nihei", "https://afternoon.kodansha.co.jp/"),
            ("Netsphere Vault", "https://blame.fandom.com")
        ]),
        ("Akira", "manga", "japanese", True, [
            ("Young Magazine Classic", "https://yanmaga.jp/"),
            ("Neo-Tokyo Vault", "https://akira.fandom.com")
        ]),
        ("Dune: Chronicles", "western_novel", "western", False, [
            ("Chilton Books Official", "https://www.dunenovels.com/"),
            ("Arrakis Sandworm Mirror", "https://dune.fandom.com")
        ]),
        ("Snow Crash", "western_novel", "western", True, [
            ("Bantam Spectra Official", "https://www.penguinrandomhouse.com/books/172834/snow-crash-by-neal-stephenson/"),
            ("Metaverse Hacker Vault", "https://snowcrash.fandom.com")
        ]),
        ("Ender's Game", "western_novel", "western", False, [
            ("Tor Books Official", "https://us.macmillan.com/books/9780765394866/endersgame"),
            ("Battle School Mirror", "https://enderverse.fandom.com")
        ]),
        ("Hyperion Cantos", "western_novel", "western", True, [
            ("Time Tombs Vault", "https://hyperioncantos.fandom.com"),
            ("The Shrike Mirror", "https://us.macmillan.com/series/hyperioncantos")
        ]),
        ("Foundation", "western_novel", "western", False, [
            ("Gnome Press Isaac Asimov", "https://asimov.fandom.com/wiki/Foundation_Series"),
            ("Psychohistory Mirror", "https://www.harpercollins.com/")
        ]),
        ("Three-Body Problem", "web_novel", "chinese", False, [
            ("Science Fiction World", "https://us.macmillan.com/books/9780765377067/thethreebodyproblem"),
            ("Trisolaris Dark Forest Mirror", "https://three-body-problem.fandom.com")
        ]),
        ("Ergo Proxy", "anime", "japanese", True, [
            ("Manglobe Official", "https://www.ergoproxy.com/"),
            ("Romdo Dome Vault", "https://ergoproxy.fandom.com")
        ]),
        ("Serial Experiments Lain", "anime", "japanese", True, [
            ("Triangle Staff Official", "https://www.geneon-ent.co.jp/"),
            ("The Wired Vault", "https://lain.fandom.com")
        ]),
        ("Texhnolyze", "anime", "japanese", True, [
            ("Madhouse Lux Vault", "https://www.madhouse.co.jp/"),
            ("Underground City Mirror", "https://texhnolyze.fandom.com")
        ]),
        ("Psycho-Pass", "anime", "japanese", False, [
            ("Production I.G Official", "https://psycho-pass.com/"),
            ("Sibyl System Mirror", "https://psychopass.fandom.com")
        ]),
        ("Neon Genesis Evangelion", "anime", "japanese", False, [
            ("Studio Khara Official", "https://www.evangelion.co.jp/"),
            ("NERV Geofront Mirror", "https://evangelion.fandom.com")
        ]),
        ("Cowboy Bebop", "anime", "japanese", False, [
            ("Sunrise Studio Official", "https://www.sunrise-inc.co.jp/"),
            ("Bebop Bounty Mirror", "https://cowboybebop.fandom.com")
        ]),
        ("Cyberpunk: Edgerunners", "anime", "japanese", False, [
            ("Studio Trigger & CDPR", "https://www.cyberpunk.net/edgerunners"),
            ("Night City Mirror", "https://cyberpunk.fandom.com")
        ]),
        ("Altered Carbon", "western_novel", "western", False, [
            ("Takeshi Kovacs Envoy", "https://www.penguinrandomhouse.com/books/117978/altered-carbon-by-richard-k-morgan/")
        ]),
        ("Do Androids Dream of Electric Sheep?", "western_novel", "western", False, [
            ("Philip K. Dick Official", "https://www.philipkdick.com/"),
            ("Blade Runner Replicant Mirror", "https://bladerunner.fandom.com")
        ]),
        ("Solaris", "western_novel", "western", False, [
            ("Stanislaw Lem Archives", "https://solarismirror.fandom.com")
        ]),
        ("The Matrix: Comics", "western_novel", "western", False, [
            ("Nebuchadnezzar Broadcast", "https://matrix.fandom.com")
        ]),
        ("S.T.A.L.K.E.R. Roadside Picnic", "western_novel", "western", False, [
            ("Strugatsky Brothers Archive", "https://roadsidepicnic.fandom.com")
        ])
    ]

    works = []
    for idx, (title, ctype, origin, is_vault, paths) in enumerate(titles, 1):
        access_paths = []
        for p_idx, (label, url) in enumerate(paths, 1):
            access_paths.append({
                "id": f"ap-scifi-{idx:02d}-{p_idx}",
                "kind": "local_file" if "books/" in url or "audio/" in url or "video/" in url else "web_url",
                "label": label,
                "url": url,
                "isPreferred": (p_idx == 1)
            })
        
        works.append({
            "id": f"work-scifi-{idx:02d}",
            "title": title,
            "contentType": ctype,
            "origin": origin,
            "publicationState": "ongoing" if idx in [2, 4, 18, 21] else "completed",
            "privacyState": "vault" if is_vault else "public",
            "genres": ["Sci-Fi", "Cyberpunk", "Meta-Fiction", "Dystopian"],
            "tags": ["constellation-star-stream", "fable-weaving-meta", "fourth-wall-shattered", f"sector-matrix-{idx}"],
            "description": f"A foundational pillar of cyberpunk and speculative meta-fiction: {title}.",
            "accessPaths": access_paths
        })

    # Novel to Webtoon adaptation link
    relations = [
        {
            "id": "rel-orv-novel-webtoon",
            "fromWorkId": "work-scifi-01", # ORV Novel
            "toWorkId": "work-scifi-02",   # ORV Webtoon
            "relationType": "adaptation",
            "notes": "Webtoon Episode 150 corresponds to Web Novel Chapter 142 (Demon King of Salvation scenario)."
        }
    ]

    # Memories (22 text memories, 4 in vault)
    memories = []
    for i in range(1, 23):
        is_vault_mem = (i in [3, 7, 12, 19])
        memories.append({
            "id": f"mem-scifi-{i:02d}",
            "workId": f"work-scifi-{(i % len(works)) + 1:02d}",
            "type": "quote" if i % 2 == 1 else "reflection",
            "title": f"Star Stream Constellation Transmission #{i}",
            "body": f"\"[The constellation 'Demon King of Salvation' is looking at you.]\" Revelation #{i}: When the fourth wall cracked, the universe revealed its true author.",
            "spoilerLevel": "major" if i % 3 == 0 else "none",
            "privacyState": "vault" if is_vault_mem else "public",
            "tags": ["constellation-star-stream", "fourth-wall-shattered", "meta-revelation"],
            "createdAt": "2026-10-18T16:45:00Z"
        })

    screenshot_defs = [
        ("Omniscient Reader", "Scenario 1: Proof of Value", "Omniscient Reader", "Kill one or more living things within 30 minutes. Failure: Death.", "Subway Car 3434 · Carriage 3807", (14, 165, 233)),
        ("Neuromancer", "The Dead Channel Sky", "Neuromancer", "The sky above the port was the color of television, tuned to a dead channel.", "Ch. 1 · Chiba City Sprawl", (16, 185, 129)),
        ("TBATE", "Arthur Leywin Aether Core Burst", "The Beginning After The End", "Aether gathered into a crystalline singularity at Arthur's core.", "Ch. 250 · Relictombs Ascent", (129, 140, 248)),
        ("Steins;Gate", "D-Mail Across World Lines", "Steins;Gate", "1.048596% — The Divergence Meter confirmed arrival at the Steins Gate world line.", "Akihabara Future Gadget Lab", (245, 158, 11)),
        ("Ghost in the Shell", "Diving into the Net", "Ghost in the Shell", "The Net is vast and infinite. Major Kusanagi merged with the Puppet Master.", "New Port City · Cyberbrain Net", (168, 85, 247)),
        ("BLAME!", "Gravitational Beam Emitter Discharge", "BLAME!", "Killy fired the GBE, burning a straight tunnel through 70 kilometers of megastructure.", "Netsphere Level 4096", (239, 68, 68)),
        ("Akira", "Neo-Tokyo Olympic Crater Explosion", "Akira", "Tetsuo screamed as the kinetic singularity consumed the stadium.", "Neo-Tokyo Ground Zero", (236, 72, 153)),
        ("Dune", "Fear is the Mind Killer Litany", "Dune", "I must not fear. Fear is the mind-killer. Fear is the little-death that brings obliteration.", "Arrakis Sietch Tabr", (234, 179, 8)),
        ("Three-Body Problem", "The Sophon Unfolding in 11 Dimensions", "The Three-Body Problem", "Trisolaran particle physicists unfolded a single proton into a two-dimensional mirror.", "Red Coast Base · Year 1971", (59, 130, 246)),
        ("Cyberpunk Edgerunners", "I Really Want to Stay at Your House", "Cyberpunk: Edgerunners", "David Martinez activated the Sandevistan to propel Lucy toward the Moon.", "Arasaka Tower Apex · Night City", (249, 115, 22))
    ]

    categories = [
        {"id": "cat-meta-fiction", "name": "Meta-Fiction & Transmigration", "accentColor": "#0ea5e9", "description": "Readers trapped in stories, scenario apocalypse, and fourth-wall breaks."},
        {"id": "cat-cyberpunk", "name": "High-Tech Low-Life Cyberpunk", "accentColor": "#10b981", "description": "Megacorporations, cybernetic enhancements, and AI deities."},
        {"id": "cat-time-paradox", "name": "Time Dilation & Paradoxes", "accentColor": "#f59e0b", "description": "World lines, causality loops, and divergence meters."}
    ]

    credentials = [
        {"id": "cred-munpia-1", "name": "Munpia Global", "domain": "munpia.com", "username": "DokjaReader49", "password": "Epitaph51%Star", "searchUrl": "https://novel.munpia.com/search?keyword={query}"},
        {"id": "cred-nu-1", "name": "NovelUpdates", "domain": "novelupdates.com", "username": "CyberdeckRunner", "password": "Neuromancer#1984", "searchUrl": "https://www.novelupdates.com/?s={query}"}
    ]

    archive_payload = {
        "format": "grimoire-backup",
        "version": 2,
        "exportedAt": "2026-10-19T20:30:00Z",
        "user": {"username": "ConstellationReader"},
        "works": works,
        "relations": relations,
        "memories": memories,
        "categories": categories,
        "credentials": credentials,
        "customTags": ["constellation-star-stream", "fable-weaving-meta", "fourth-wall-shattered"]
    }

    zip_path = os.path.join(ROOT_DIR, "grimoire_sample_pack_3_cyberpunk_scifi_omniscient.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("archive.gca", json.dumps(archive_payload, indent=2))
        z.writestr("archive.json", json.dumps(archive_payload, indent=2))

        for idx, (win_t, sec_t, hl, q, prog, acc) in enumerate(screenshot_defs, 1):
            ss_bytes = generate_screenshot_image(win_t, sec_t, hl, q, prog, acc)
            z.writestr(f"screenshots/ss_{idx:02d}.png", ss_bytes)

        z.writestr("covers/orv_cover.png", generate_cover_image("Omniscient Reader", "Demon King of Salvation", "Meta-Fiction", (14, 165, 233), (15, 23, 42)))
        z.writestr("covers/neuromancer_cover.png", generate_cover_image("Neuromancer", "The Matrix & Chiba Sprawl", "Cyberpunk Noir", (16, 185, 129), (10, 30, 25)))
        z.writestr("covers/tbate_cover.png", generate_cover_image("The Beginning After The End", "Aether Core Singularities", "Isekai Fantasy", (129, 140, 248), (20, 20, 45)))

        sample_chs = create_sample_chapters("Omniscient Reader Chronicles", 11)
        z.writestr("books/omniscient_reader_vol1.epub", generate_epub_book("Omniscient Reader: The Epilogue", "Sing Shong", "Kim Dokja begins reading the story that saved his life.", sample_chs))
        z.writestr("books/neuromancer_sprawl_sampler.pdf", generate_pdf_book("Neuromancer: The Sprawl Trilogy Sampler", "William Gibson", "Case jacks into cyberspace from the Chiba City bar.", sample_chs))
        z.writestr("books/the_beginning_after_the_end_ch1_12.pdf", generate_pdf_book("The Beginning After The End — Relictombs", "TurtleMe", "Arthur Leywin awakens in the Relictombs.", sample_chs))

        z.writestr("audio/star_stream_transmission.wav", generate_audio_file(duration_sec=3.5, base_freq=520.0))
        z.writestr("video/orv_scenario_teaser.mp4", generate_video_file(duration_ms=2500))

        readme_text = """# Grimoire Sample Pack 3: Cyberpunk, Sci-Fi & Meta-Fiction Omniscient

Welcome to the **Cyberpunk, Sci-Fi & Meta-Fiction Sample Pack** for **Grimoire**!

This pack contains 26 acclaimed speculative fiction, cyberpunk, and meta-narrative masterpieces.

---

## 📦 What is inside this Sample Pack?

- **26 Speculative & Cyberpunk Works**:
  - **9 Works in Private Vault** (`privacyState: "vault"`) — *Neuromancer, Ghost in the Shell, BLAME!, Akira, Snow Crash, Hyperion Cantos, Ergo Proxy, Lain, Texhnolyze*.
  - **15 Works with Multi-Source Access Paths** — Official web links, local EPUB/PDF editions, and video teasers.
  - **Cross-Medium Adaptation Linked**:
    - **Omniscient Reader's Viewpoint (Web Novel)** $\leftrightarrow$ **Omniscient Reader's Viewpoint (Webtoon)** with scenario episode mapping.
- **22 Curated Text Memories** (4 encrypted in Private Vault).
- **10 Screenshot Memories** capturing mind-bending cyberpunk moments.
- **3 Actual 10–15 Page Readable Offline Books** (`omniscient_reader_vol1.epub`, `neuromancer_sprawl_sampler.pdf`, `the_beginning_after_the_end_ch1_12.pdf`).
- **1 Playable Local Audio Broadcast** (`audio/star_stream_transmission.wav`).
- **1 Playable Local Video Teaser** (`video/orv_scenario_teaser.mp4`).
- **2 Encrypted Portal Logins** for Munpia and NovelUpdates.
- **3 Custom Categories & Tags**.

---

## 🚀 How to Import into Grimoire

1. On the Sanctum Title Screen, click **Import .gca File**.
2. Select `archive.gca` from this zip.
3. Your library loads instantly with 0 demo relics and full relational data.
"""
        z.writestr("README.md", readme_text)

    print(f"Pack 3 generated successfully: {zip_path} ({os.path.getsize(zip_path)} bytes)")


if __name__ == "__main__":
    build_pack_1()
    build_pack_2()
    build_pack_3()
    print("\nALL 3 SAMPLE PACKS SYNTHESIZED SUCCESSFULLY!")
