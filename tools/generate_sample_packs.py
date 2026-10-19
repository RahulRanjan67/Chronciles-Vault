import os
import json
import zipfile
import io
from PIL import Image, ImageDraw

def generate_cover_image(title: str, subtitle: str, bg_color: tuple, text_color: tuple = (255, 255, 255)) -> bytes:
    img = Image.new("RGB", (600, 850), color=bg_color)
    draw = ImageDraw.Draw(img)
    draw.rectangle([20, 20, 580, 830], outline=text_color, width=3)
    draw.rectangle([28, 28, 572, 822], outline=(100, 100, 120), width=1)
    draw.text((300, 380), title, fill=text_color, anchor="mm")
    draw.text((300, 440), subtitle, fill=(180, 180, 190), anchor="mm")
    draw.text((300, 780), "GRIMOIRE ARCHIVES · SOVEREIGN SANCTUM", fill=(130, 130, 150), anchor="mm")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def generate_screenshot_image(feature_name: str, caption: str, accent_color: tuple) -> bytes:
    img = Image.new("RGB", (1280, 720), color=(15, 17, 23))
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, 1280, 50], fill=(25, 28, 38))
    draw.ellipse([20, 18, 34, 32], fill=(239, 68, 68))
    draw.ellipse([42, 18, 56, 32], fill=(245, 158, 11))
    draw.ellipse([64, 18, 78, 32], fill=(16, 185, 129))
    draw.text((640, 25), f"Grimoire — {feature_name}", fill=(200, 200, 200), anchor="mm")
    draw.rectangle([60, 80, 1220, 680], fill=(24, 27, 36), outline=accent_color, width=2)
    draw.text((100, 120), feature_name, fill=accent_color)
    draw.text((100, 160), caption, fill=(210, 210, 220))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

root_dir = r"c:\Users\67rah\Desktop\Chronciles Vault"
os.makedirs(root_dir, exist_ok=True)

# -------------------------------------------------------------
# Pack 1: Xianxia & Progression Fantasy Chronicles
# -------------------------------------------------------------
pack1_works = [
    {
        "id": "work-lotm",
        "title": "Lord of the Mysteries",
        "contentType": "web_novel",
        "origin": "chinese",
        "publicationState": "completed",
        "privacyState": "public",
        "genres": ["Mystery", "Steampunk", "Dark Fantasy", "Occult"],
        "tags": ["Tarot Club", "Potion Pathways", "Eldritch", "Victorian"],
        "description": "Klein Moretti wakes in a steampunk Victorian world governed by 22 potion pathways, ancient gods, and clandestine tarot meetings.",
        "accessPaths": [
            {
                "id": "ap-lotm-web",
                "kind": "web_url",
                "label": "Webnovel Official",
                "url": "https://www.webnovel.com/book/lord-of-mysteries_11022733006234505",
                "isPreferred": True,
            },
            {
                "id": "ap-lotm-wiki",
                "kind": "web_url",
                "label": "LotM Lore Wiki",
                "url": "https://lordofthemysteries.fandom.com/wiki/Lord_of_the_Mysteries_Wiki",
                "isPreferred": False,
            },
        ],
    },
    {
        "id": "work-reverend-insanity",
        "title": "Reverend Insanity",
        "contentType": "web_novel",
        "origin": "chinese",
        "publicationState": "completed",
        "privacyState": "public",
        "genres": ["Xianxia", "Dark Cultivation", "Psychological"],
        "tags": ["Antihero", "Gu Worms", "Spring Autumn Cicada", "Mastermind"],
        "description": "Fang Yuan reincarnates 500 years into the past with the Spring Autumn Cicada, striving for eternal life in a brutal Gu world.",
        "accessPaths": [
            {
                "id": "ap-ri-web",
                "kind": "web_url",
                "label": "NovelUpdates Reading Index",
                "url": "https://www.novelupdates.com/series/reverend-insanity/",
                "isPreferred": True,
            }
        ],
    },
    {
        "id": "work-cradle",
        "title": "Cradle: Unsouled",
        "contentType": "western_novel",
        "origin": "western",
        "publicationState": "completed",
        "privacyState": "public",
        "genres": ["Progression Fantasy", "Cultivation", "Action"],
        "tags": ["Sacred Valley", "Copper to Monarch", "Lindon & Yerin"],
        "description": "Wei Shi Lindon, born without a sacred affinity, undertakes an impossible pilgrimage beyond the mountains to prevent the destruction of his homeland.",
        "accessPaths": [
            {
                "id": "ap-cradle-web",
                "kind": "web_url",
                "label": "Will Wight Store & Portal",
                "url": "https://www.willwight.com/cradle.html",
                "isPreferred": True,
            }
        ],
    },
    {
        "id": "work-shadow-slave",
        "title": "Shadow Slave",
        "contentType": "web_novel",
        "origin": "western",
        "publicationState": "ongoing",
        "privacyState": "public",
        "genres": ["Progression Fantasy", "Survival", "Supernatural"],
        "tags": ["Spell of Nightmare", "Sunless", "Tomb of Ariel", "Divine Shadows"],
        "description": "Growing up in the poverty-stricken outskirts, Sunny is chosen by the Nightmare Spell and transported into a forgotten realm of fallen horrors.",
        "accessPaths": [
            {
                "id": "ap-ss-web",
                "kind": "web_url",
                "label": "Webnovel Portal",
                "url": "https://www.webnovel.com/book/shadow-slave_22166657605766005",
                "isPreferred": True,
            }
        ],
    },
    {
        "id": "work-a-will-eternal",
        "title": "A Will Eternal",
        "contentType": "web_novel",
        "origin": "chinese",
        "publicationState": "completed",
        "privacyState": "public",
        "genres": ["Xianxia", "Comedy", "Cultivation"],
        "tags": ["Bai Xiaochun", "Spirit Stream Sect", "Longevity", "Alchemy"],
        "description": "One will to create the oceans. One will to summon the mulberry fields. One will to slaughter countless devils. One will to live forever.",
        "accessPaths": [
            {
                "id": "ap-awe-web",
                "kind": "web_url",
                "label": "Wuxiaworld Archive",
                "url": "https://www.wuxiaworld.com/novel/a-will-eternal",
                "isPreferred": True,
            }
        ],
    },
]

pack1_memories = [
    {
        "id": "mem-lotm-1",
        "workId": "work-lotm",
        "type": "quote",
        "title": "The Fool's Sacred Credo",
        "body": '"The taste of a Demoness ain\'t bad... We are paupers striving in misfortune, but we are also heroes willing to guard the light." — Captain Dunn Smith, Chapter 213.',
        "spoilerLevel": "minor",
        "privacyState": "public",
        "tags": ["Dunn Smith", "Tingen Arc", "Nighthawks"],
        "createdAt": "2026-10-15T12:00:00Z",
    },
    {
        "id": "mem-ri-1",
        "workId": "work-reverend-insanity",
        "type": "lore",
        "title": "Man is the spirit of all living things",
        "body": "Gu are the essence of heaven and earth. In this world, only benefits are eternal, while emotions are fleeting clouds.",
        "spoilerLevel": "none",
        "privacyState": "public",
        "tags": ["Philosophy", "Fang Yuan", "Gu Lore"],
        "createdAt": "2026-10-16T14:30:00Z",
    },
    {
        "id": "mem-cradle-1",
        "workId": "work-cradle",
        "type": "milestone",
        "title": "Empty Palm Breakthrough",
        "body": "Lindon passes the First Elder's trial through unyielding spirit and clever foundation mastery. Gratitude.",
        "spoilerLevel": "minor",
        "privacyState": "public",
        "tags": ["Breakthrough", "Sacred Arts"],
        "createdAt": "2026-10-17T09:15:00Z",
    },
]

pack1_lists = [
    {
        "id": "list-xianxia-peak",
        "title": "Supreme Progression & Eastern Cultivation",
        "description": "Hand-picked masterworks featuring intricate power systems, cunning protagonists, and deep worldbuilding.",
        "privacyState": "public",
        "items": [
            {
                "id": "li-1",
                "workId": "work-lotm",
                "position": 0,
                "personalNote": "The standard by which all serialized web fiction is measured.",
            },
            {
                "id": "li-2",
                "workId": "work-reverend-insanity",
                "position": 1,
                "personalNote": "Uncompromising intellect and ruthless perseverance.",
            },
            {
                "id": "li-3",
                "workId": "work-cradle",
                "position": 2,
                "personalNote": "Western progression at its absolute finest.",
            },
        ],
    }
]

pack1_data = {
    "format": "grimoire-backup",
    "version": 1,
    "exportedAt": "2026-10-19T18:00:00Z",
    "works": pack1_works,
    "memories": pack1_memories,
    "lists": pack1_lists,
    "relations": [],
}

z1_path = os.path.join(root_dir, "grimoire_sample_pack_1_xianxia_progression.zip")
with zipfile.ZipFile(z1_path, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("archive.gca", json.dumps(pack1_data, indent=2))
    z.writestr("archive.json", json.dumps(pack1_data, indent=2))
    z.writestr("covers/lotm_cover.png", generate_cover_image("Lord of the Mysteries", "Occult & Tarot Pathways", (26, 26, 46)))
    z.writestr("covers/reverend_insanity.png", generate_cover_image("Reverend Insanity", "Perseverance & Gu Cultivation", (38, 20, 20)))
    z.writestr("covers/cradle_unsouled.png", generate_cover_image("Cradle: Unsouled", "Sacred Arts & Progression", (15, 35, 45)))
    z.writestr("screenshots/ss_01_lotm_tarot_notes.png", generate_screenshot_image("LotM — Tarot Club Notes", "Chapter 1380 · Character dossiers and potion formula notes", (236, 72, 153)))
    z.writestr("screenshots/ss_02_reverend_insanity_quote.png", generate_screenshot_image("Reverend Insanity — Quote Memory", "Chapter 1285 · 'I had once screamed, gradually, I lost my voice...'", (239, 68, 68)))
    z.writestr(
        "README.txt",
        "Grimoire Sample Pack 1: Xianxia & Progression Fantasy Chronicles\n\n"
        "Includes:\n"
        "- archive.gca / archive.json (5 works, memories, reading access paths, curated lists)\n"
        "- High-res cover images in covers/\n"
        "- In-app reading & memory screenshots in screenshots/\n\n"
        "How to import:\n"
        "1. Open Grimoire -> Settings -> Data & Backup.\n"
        "2. In 'Restore & Import', select archive.gca or archive.json.\n"
        "3. All works, memories, and reading lists load instantly into your local Sanctum!\n",
    )
print("Pack 1 created successfully:", z1_path)

# -------------------------------------------------------------
# Pack 2: Manga & Anime Masterworks
# -------------------------------------------------------------
pack2_works = [
    {
        "id": "work-frieren",
        "title": "Frieren: Beyond Journey's End",
        "contentType": "manga",
        "origin": "japanese",
        "publicationState": "ongoing",
        "privacyState": "public",
        "genres": ["Fantasy", "Adventure", "Drama", "Slice of Life"],
        "tags": ["Himmel", "Elven Mage", "Memory", "First Class Mage Exam"],
        "description": "The adventure is over, but life goes on for an elf mage just beginning to learn what living and human emotions mean.",
        "accessPaths": [
            {
                "id": "ap-frieren-md",
                "kind": "web_url",
                "label": "MangaDex Simulpub",
                "url": "https://mangadex.org/title/b0b721ff-c388-4486-aa0f-c8b0e92152b0",
                "isPreferred": True,
            }
        ],
    },
    {
        "id": "work-dungeon-meshi",
        "title": "Delicious in Dungeon (Dungeon Meshi)",
        "contentType": "manga",
        "origin": "japanese",
        "publicationState": "completed",
        "privacyState": "public",
        "genres": ["Fantasy", "Comedy", "Gourmet", "Ecological"],
        "tags": ["Monster Cuisine", "Laios Party", "Dungeon Ecology", "Senshi"],
        "description": "Venturing deep into an ancient dungeon to rescue their fallen companion, a brave party survives by cooking and eating the monsters they slay.",
        "accessPaths": [
            {
                "id": "ap-dm-md",
                "kind": "web_url",
                "label": "MangaDex Complete Archive",
                "url": "https://mangadex.org/title/d90ea637-f1e1-4338-b11d-407d4f306682",
                "isPreferred": True,
            }
        ],
    },
    {
        "id": "work-berserk",
        "title": "Berserk (Deluxe Edition)",
        "contentType": "manga",
        "origin": "japanese",
        "publicationState": "ongoing",
        "privacyState": "public",
        "genres": ["Dark Fantasy", "Tragedy", "Action", "Psychological"],
        "tags": ["Guts", "Griffith", "Band of the Hawk", "Eclipse", "Kentaro Miura"],
        "description": "The Black Swordsman Guts wages an unyielding struggle against destiny, demons, and the demonic God Hand across a war-torn continent.",
        "accessPaths": [
            {
                "id": "ap-berserk-viz",
                "kind": "web_url",
                "label": "Dark Horse Official Catalog",
                "url": "https://www.darkhorse.com/Books/3004-325/Berserk-Deluxe-Volume-1-HC",
                "isPreferred": True,
            }
        ],
    },
    {
        "id": "work-chainsaw-man",
        "title": "Chainsaw Man",
        "contentType": "manga",
        "origin": "japanese",
        "publicationState": "ongoing",
        "privacyState": "public",
        "genres": ["Action", "Dark Comedy", "Supernatural", "Horror"],
        "tags": ["Denji", "Makima", "Pochita", "Public Safety", "Tatsuki Fujimoto"],
        "description": "Denji's life of crushing debt turns upside down when he merges with his pet chainsaw devil Pochita, becoming Chainsaw Man.",
        "accessPaths": [
            {
                "id": "ap-csm-plus",
                "kind": "web_url",
                "label": "Manga Plus Shueisha Official",
                "url": "https://mangaplus.shueisha.co.jp/titles/100037",
                "isPreferred": True,
            }
        ],
    },
    {
        "id": "work-vinland-saga",
        "title": "Vinland Saga",
        "contentType": "manga",
        "origin": "japanese",
        "publicationState": "ongoing",
        "privacyState": "public",
        "genres": ["Historical", "Adventure", "Drama", "Seinen"],
        "tags": ["Thorfinn", "Askeladd", "Vikings", "I Have No Enemies"],
        "description": "From vengeance-consumed mercenary child to peace-seeking pioneer, Thorfinn's life chronicles the search for a land without war.",
        "accessPaths": [
            {
                "id": "ap-vinland-kodansha",
                "kind": "web_url",
                "label": "Kodansha Comics Portal",
                "url": "https://kodansha.us/series/vinland-saga/",
                "isPreferred": True,
            }
        ],
    },
]

pack2_memories = [
    {
        "id": "mem-frieren-1",
        "workId": "work-frieren",
        "type": "quote",
        "title": "Himmel's Sunset Reflection",
        "body": '"Even if it was only for a fraction of your long life, I am truly glad we traveled together." — Himmel the Hero.',
        "spoilerLevel": "minor",
        "privacyState": "public",
        "tags": ["Himmel", "Melancholy", "Time"],
        "createdAt": "2026-10-15T15:00:00Z",
    },
    {
        "id": "mem-vinland-1",
        "workId": "work-vinland-saga",
        "type": "quote",
        "title": "A Man Without Enemies",
        "body": '"You have no enemies. No one in this world has any enemies. There is no one that you have the right to hurt." — Thors Snorresson to young Thorfinn.',
        "spoilerLevel": "none",
        "privacyState": "public",
        "tags": ["Thors", "Pacifism", "Vinland"],
        "createdAt": "2026-10-16T18:20:00Z",
    },
]

pack2_lists = [
    {
        "id": "list-manga-classics",
        "title": "The Seinen & Masterpiece Manga Canon",
        "description": "Profound storytelling, world-class illustration, and unforgettable journeys across historical and high fantasy.",
        "privacyState": "public",
        "items": [
            {
                "id": "li-m1",
                "workId": "work-frieren",
                "position": 0,
                "personalNote": "The quintessential meditation on mortality.",
            },
            {
                "id": "li-m2",
                "workId": "work-berserk",
                "position": 1,
                "personalNote": "The summit of dark fantasy art.",
            },
            {
                "id": "li-m3",
                "workId": "work-dungeon-meshi",
                "position": 2,
                "personalNote": "One of the best-plotted endings in manga history.",
            },
        ],
    }
]

pack2_data = {
    "format": "grimoire-backup",
    "version": 1,
    "exportedAt": "2026-10-19T18:00:00Z",
    "works": pack2_works,
    "memories": pack2_memories,
    "lists": pack2_lists,
    "relations": [],
}

z2_path = os.path.join(root_dir, "grimoire_sample_pack_2_manga_anime_chronicles.zip")
with zipfile.ZipFile(z2_path, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("archive.gca", json.dumps(pack2_data, indent=2))
    z.writestr("archive.json", json.dumps(pack2_data, indent=2))
    z.writestr("covers/frieren_cover.png", generate_cover_image("Frieren: Beyond Journey's End", "Epitaph of the Hero Party", (24, 43, 73)))
    z.writestr("covers/dungeon_meshi.png", generate_cover_image("Delicious in Dungeon", "Ecology & Monster Gastronomy", (48, 32, 16)))
    z.writestr("covers/berserk_deluxe.png", generate_cover_image("Berserk: Deluxe Edition", "The Black Swordsman Epic", (20, 20, 24)))
    z.writestr("screenshots/ss_01_frieren_spells.png", generate_screenshot_image("Frieren — Spell Notebook", "Volume 4 · Grimoire collection scratchpad and notes", (99, 102, 241)))
    z.writestr("screenshots/ss_02_berserk_quote.png", generate_screenshot_image("Berserk — Milestone Memory", "Eclipse Aftermath · Guts and the Brand of Sacrifice", (244, 63, 94)))
    z.writestr(
        "README.txt",
        "Grimoire Sample Pack 2: Manga & Anime Masterworks\n\n"
        "Includes:\n"
        "- archive.gca / archive.json (5 works, memories, reading access paths, curated lists)\n"
        "- High-res cover images in covers/\n"
        "- In-app reading & memory screenshots in screenshots/\n\n"
        "How to import:\n"
        "1. Open Grimoire -> Settings -> Data & Backup.\n"
        "2. In 'Restore & Import', select archive.gca.\n"
        "3. Instantly test Frieren, Dungeon Meshi, Berserk, Chainsaw Man and Vinland Saga!\n",
    )
print("Pack 2 created successfully:", z2_path)

# -------------------------------------------------------------
# Pack 3: Cyberpunk, Sci-Fi & Meta-Fiction Chronicles
# -------------------------------------------------------------
pack3_works = [
    {
        "id": "work-orv",
        "title": "Omniscient Reader's Viewpoint",
        "contentType": "web_novel",
        "origin": "korean",
        "publicationState": "completed",
        "privacyState": "public",
        "genres": ["Apocalypse", "Meta-Fiction", "Action", "Psychological"],
        "tags": ["Kim Dokja", "Constellations", "Ways of Survival", "Epilogue"],
        "description": "The world becomes the reality of the post-apocalyptic web novel Kim Dokja read for ten years. As the sole reader who reached the end, he sets out to save his world.",
        "accessPaths": [
            {
                "id": "ap-orv-web",
                "kind": "web_url",
                "label": "Webnovel Translation Portal",
                "url": "https://www.webnovel.com/book/omniscient-reader_12524375105989805",
                "isPreferred": True,
            },
            {
                "id": "ap-orv-asura",
                "kind": "web_url",
                "label": "Asura Comic Manhwa Hub",
                "url": "https://asuracomic.net/series/omniscient-readers-viewpoint",
                "isPreferred": False,
            },
        ],
    },
    {
        "id": "work-tbate",
        "title": "The Beginning After The End",
        "contentType": "web_novel",
        "origin": "korean",
        "publicationState": "ongoing",
        "privacyState": "public",
        "genres": ["Isekai", "High Fantasy", "Action", "Magic"],
        "tags": ["Arthur Leywin", "Sylvie", "Mana Core", "Epheotus"],
        "description": "King Grey awakens into a world of magic and monsters, learning to cultivate his mana core and protecting the people he loves from ancient continental wars.",
        "accessPaths": [
            {
                "id": "ap-tbate-tapas",
                "kind": "web_url",
                "label": "Tapas Official Serial",
                "url": "https://tapas.io/series/TBATE",
                "isPreferred": True,
            }
        ],
    },
    {
        "id": "work-neuromancer",
        "title": "Neuromancer",
        "contentType": "western_novel",
        "origin": "western",
        "publicationState": "completed",
        "privacyState": "public",
        "genres": ["Cyberpunk", "Hard Sci-Fi", "Noir"],
        "tags": ["Case", "Molly Millions", "Wintermute", "Cyberspace Matrix"],
        "description": "The sky above the port was the color of television, tuned to a dead channel. A washed-up computer cowboy is hired for one last impossible run in the matrix.",
        "accessPaths": [
            {
                "id": "ap-neuro-goodreads",
                "kind": "web_url",
                "label": "William Gibson Portal",
                "url": "https://www.goodreads.com/book/show/6088007-neuromancer",
                "isPreferred": True,
            }
        ],
    },
    {
        "id": "work-blame",
        "title": "BLAME!",
        "contentType": "manga",
        "origin": "japanese",
        "publicationState": "completed",
        "privacyState": "public",
        "genres": ["Cyberpunk", "Post-Apocalyptic", "Hard Sci-Fi"],
        "tags": ["Killy", "Netsphere", "Gravitational Beam Emitter", "Tsutomu Nihei"],
        "description": "Killy wanders through an incomprehensibly vast, thousand-story mechanical Megastructure in search of a human carrying Net Terminal Genes.",
        "accessPaths": [
            {
                "id": "ap-blame-kodansha",
                "kind": "web_url",
                "label": "Kodansha Master Edition",
                "url": "https://kodansha.us/series/blame/",
                "isPreferred": True,
            }
        ],
    },
    {
        "id": "work-steins-gate",
        "title": "Steins;Gate",
        "contentType": "western_novel",
        "origin": "japanese",
        "publicationState": "completed",
        "privacyState": "public",
        "genres": ["Sci-Fi", "Thriller", "Mystery"],
        "tags": ["Rintaro Okabe", "Kurisu Makise", "D-Mail", "World Lines", "SERN"],
        "description": "A ragtag group of eccentric Akihabara lab members inadvertently modify the past using a microwave and cell phone, uncovering a global conspiracy.",
        "accessPaths": [
            {
                "id": "ap-sg-steam",
                "kind": "web_url",
                "label": "Spike Chunsoft Portal",
                "url": "https://store.steampowered.com/app/412830/STEINSGATE/",
                "isPreferred": True,
            }
        ],
    },
]

pack3_memories = [
    {
        "id": "mem-orv-1",
        "workId": "work-orv",
        "type": "quote",
        "title": "Tell Me, Foolish Dokja",
        "body": '"If I regressed again, would I ever meet you again?" Yoo Joonghyuk asked. The Demon King of Salvation could only look toward the cold constellation skies.',
        "spoilerLevel": "major",
        "privacyState": "public",
        "tags": ["Kim Dokja", "Yoo Joonghyuk", "Epilogue"],
        "createdAt": "2026-10-14T21:00:00Z",
    },
    {
        "id": "mem-neuro-1",
        "workId": "work-neuromancer",
        "type": "quote",
        "title": "The Dead Channel Sky",
        "body": '"The sky above the port was the color of television, tuned to a dead channel." — Opening line of Neuromancer, 1984.',
        "spoilerLevel": "none",
        "privacyState": "public",
        "tags": ["Cyberpunk", "Classic Quote", "Gibson"],
        "createdAt": "2026-10-15T08:30:00Z",
    },
]

pack3_lists = [
    {
        "id": "list-scifi-pantheon",
        "title": "Cyberpunk Horizons & Meta-Fiction Classics",
        "description": "Exploring the boundaries of reality, simulated matrices, world lines, and apocalyptic fiction.",
        "privacyState": "public",
        "items": [
            {
                "id": "li-s1",
                "workId": "work-orv",
                "position": 0,
                "personalNote": "The ultimate ode to reading and stories.",
            },
            {
                "id": "li-s2",
                "workId": "work-neuromancer",
                "position": 1,
                "personalNote": "The father of the Cyberpunk genre.",
            },
            {
                "id": "li-s3",
                "workId": "work-steins-gate",
                "position": 2,
                "personalNote": "Masterclass in time travel and consequences.",
            },
        ],
    }
]

pack3_data = {
    "format": "grimoire-backup",
    "version": 1,
    "exportedAt": "2026-10-19T18:00:00Z",
    "works": pack3_works,
    "memories": pack3_memories,
    "lists": pack3_lists,
    "relations": [],
}

z3_path = os.path.join(root_dir, "grimoire_sample_pack_3_cyberpunk_scifi_omniscient.zip")
with zipfile.ZipFile(z3_path, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("archive.gca", json.dumps(pack3_data, indent=2))
    z.writestr("archive.json", json.dumps(pack3_data, indent=2))
    z.writestr("covers/orv_cover.png", generate_cover_image("Omniscient Reader's Viewpoint", "Three Ways to Survive", (17, 24, 39)))
    z.writestr("covers/tbate_cover.png", generate_cover_image("The Beginning After The End", "Aether Core & Dicathen Wars", (30, 27, 75)))
    z.writestr("covers/neuromancer_cover.png", generate_cover_image("Neuromancer", "Chiba Sprawl & The Matrix", (12, 74, 96)))
    z.writestr("screenshots/ss_01_orv_dokja_timeline.png", generate_screenshot_image("ORV — Scenario Timeline", "Scenario 46 · Character notes and regression timeline", (14, 165, 233)))
    z.writestr("screenshots/ss_02_neuromancer_quote.png", generate_screenshot_image("Neuromancer — Cyberspace Memory", "Chiba Sprawl · 'The sky above the port was the color of television...'", (16, 185, 129)))
    z.writestr(
        "README.txt",
        "Grimoire Sample Pack 3: Cyberpunk, Sci-Fi & Meta-Fiction Chronicles\n\n"
        "Includes:\n"
        "- archive.gca / archive.json (5 works, memories, reading access paths, curated lists)\n"
        "- High-res cover images in covers/\n"
        "- In-app reading & memory screenshots in screenshots/\n\n"
        "How to import:\n"
        "1. Open Grimoire -> Settings -> Data & Backup.\n"
        "2. In 'Restore & Import', select archive.gca.\n"
        "3. Test ORV, TBATE, Neuromancer, BLAME! and Steins;Gate with complete notes, memories, and reading lists!\n",
    )
print("Pack 3 created successfully:", z3_path)
