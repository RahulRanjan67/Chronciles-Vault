# -*- coding: utf-8 -*-
"""
Curated lore enrichment generator for Grimoire sample packs.
Provides comprehensive, authentic notebook entries and fandom/community links
for all works across all 3 sample packs.
"""

def get_pack_1_enrichments():
    """Returns (notebook_entries, fandom_links) for Pack 1: Xianxia & Progression Fantasy."""
    notebook_entries = [
        # work-xianxia-01: Lord of the Mysteries
        {
            "id": "nb-xianxia-01-1",
            "workId": "work-xianxia-01",
            "category": "theory",
            "title": "Theory: The Blasphemy Slates and Sequence 0 Apotheosis",
            "body": "The first and second Blasphemy Slates reveal the immutable pathways to godhood. The Fool, Door, and Error pathways converge at the level of the Lord of the Mysteries (Pillar of the Universe). Sequence 0 apotheosis ritual requires accommodation of the Uniqueness and three Sequence 1 Beyonder characteristics under cosmic celestial convergence.",
            "chapterHint": "Vol 3-6",
            "pinned": True,
            "createdAt": "2026-10-18T10:00:00Z",
            "updatedAt": "2026-10-18T10:00:00Z"
        },
        {
            "id": "nb-xianxia-01-2",
            "workId": "work-xianxia-01",
            "category": "clue",
            "title": "Clue: The Antigonus Family Notebook",
            "body": "The notebook recovered in Tingen contains the Seer pathway's secret formulas up to Sequence 5: Marionettist. Klein must guard his spirituality against the lingering will of the Half-Fool of the Antigonus family lurking within the hornacis mountain mist.",
            "chapterHint": "Vol 1 Ch. 45",
            "pinned": False,
            "createdAt": "2026-10-18T10:05:00Z",
            "updatedAt": "2026-10-18T10:05:00Z"
        },
        {
            "id": "nb-xianxia-01-3",
            "workId": "work-xianxia-01",
            "category": "character",
            "title": "Character Map: Tarot Club Major Arcana code names",
            "body": "Tarot Club Seats: The Fool (Klein Moretti), Justice (Audrey Hall), The Hanged Man (Alger Wilson), The Sun (Derrick Berg), The World (Klein's avatar), The Magician (Fors Wall), Judgement (Xio Derecha), The Moon (Emlyn White), The Star (Leonard Mitchell), The Hermit (Cattleya).",
            "chapterHint": "Vol 1-8",
            "pinned": False,
            "createdAt": "2026-10-18T10:10:00Z",
            "updatedAt": "2026-10-18T10:10:00Z"
        },
        {
            "id": "nb-xianxia-01-4",
            "workId": "work-xianxia-01",
            "category": "question",
            "title": "Open Question: The Celestial Worthy's Will Awakening",
            "body": "How much of Klein's humanity can remain intact when confronting the primordial imprint of the Celestial Worthy of Heaven and Earth above the gray fog?",
            "chapterHint": "Vol 8 Finale",
            "pinned": False,
            "createdAt": "2026-10-18T10:15:00Z",
            "updatedAt": "2026-10-18T10:15:00Z"
        },

        # work-xianxia-02: Reverend Insanity
        {
            "id": "nb-xianxia-02-1",
            "workId": "work-xianxia-02",
            "category": "theory",
            "title": "Theory: Destruction of Fate Gu and Venerable Chess Games",
            "body": "Star Constellation, Giant Sun, and Spectral Soul arranged centuries of contingencies. Destroying Fate Gu allows the Sovereign Immortal Fetus Gu to practice all paths without conflict, shattering the balance between Heavenly Court and Longevity Heaven.",
            "chapterHint": "Ch. 1950",
            "pinned": True,
            "createdAt": "2026-10-18T10:20:00Z",
            "updatedAt": "2026-10-18T10:20:00Z"
        },
        {
            "id": "nb-xianxia-02-2",
            "workId": "work-xianxia-02",
            "category": "clue",
            "title": "Clue: Spring Autumn Cicada and Heaven's Will",
            "body": "Every rebirth orchestrated by Spring Autumn Cicada was influenced by Heaven's Will to eliminate Spectral Soul Demon Venerable. Fang Yuan was an unwitting pawn until the Yi Tian Mountain confrontation.",
            "chapterHint": "Ch. 1000",
            "pinned": False,
            "createdAt": "2026-10-18T10:25:00Z",
            "updatedAt": "2026-10-18T10:25:00Z"
        },

        # work-xianxia-03: Cradle: Unsouled
        {
            "id": "nb-xianxia-03-1",
            "workId": "work-xianxia-03",
            "category": "theory",
            "title": "Theory: Lindon's Void Icon & Dross's Evolution",
            "body": "Lindon's dual cores (Pure Madra and Blackflame) synthesize the concept of Empty and Devour, leading directly to the Void Icon. Dross provides an Abidan Presence-grade battle simulation engine within a mortal sacred artist soul.",
            "chapterHint": "Ghostwater / Wintersteel",
            "pinned": True,
            "createdAt": "2026-10-18T10:30:00Z",
            "updatedAt": "2026-10-18T10:30:00Z"
        },
        {
            "id": "nb-xianxia-03-2",
            "workId": "work-xianxia-03",
            "category": "question",
            "title": "Open Question: Ozmanthus Tiberian's Marble Message",
            "body": "What exact threshold of will does Eithan expect Lindon and Yerin to reach before ascending past Iteration 110 (Cradle) to challenge the Mad King?",
            "chapterHint": "Blackflame Ch. 12",
            "pinned": False,
            "createdAt": "2026-10-18T10:35:00Z",
            "updatedAt": "2026-10-18T10:35:00Z"
        },

        # work-xianxia-04: A Will Eternal (Web Novel)
        {
            "id": "nb-xianxia-04-1",
            "workId": "work-xianxia-04",
            "category": "theory",
            "title": "Theory: Undying Live Forever Technique stages",
            "body": "The five strata of the Undying Codex: Undying Skin, Undying Heavenly Membranes, Undying Tendons, Undying Bones, and Undying Blood. When combined with the Live Forever Codex, the cultivator manifests eternal lifeforce defying the heavenly Dao.",
            "chapterHint": "Ch. 18-90",
            "pinned": True,
            "createdAt": "2026-10-18T10:40:00Z",
            "updatedAt": "2026-10-18T10:40:00Z"
        },
        {
            "id": "nb-xianxia-04-2",
            "workId": "work-xianxia-04",
            "category": "character",
            "title": "Character Map: Bai Xiaochun and the Four Sect Alliances",
            "body": "Spirit Stream Sect (Fragrant Cloud Peak), Blood Stream Sect (Nightcrypt persona), Pill Stream Sect, and Ring Stream Sect unification into the River-Defying Sect.",
            "chapterHint": "Middle Reach Arc",
            "pinned": False,
            "createdAt": "2026-10-18T10:45:00Z",
            "updatedAt": "2026-10-18T10:45:00Z"
        },

        # work-xianxia-05: A Will Eternal (Donghua Anime & Manhua)
        {
            "id": "nb-xianxia-05-1",
            "workId": "work-xianxia-05",
            "category": "theory",
            "title": "Theory: Pacing Compression: Spirit Stream Sect vs Blood Stream Infiltration",
            "body": "Donghua Season 1 brilliantly accelerates the initial mundane farming episodes, while expanding Bai Xiaochun's undercover Nightcrypt persona in the Blood Stream Sect for dramatic comedic timing.",
            "chapterHint": "Episode 50-84",
            "pinned": True,
            "createdAt": "2026-10-18T10:50:00Z",
            "updatedAt": "2026-10-18T10:50:00Z"
        },
        {
            "id": "nb-xianxia-05-2",
            "workId": "work-xianxia-05",
            "category": "scratch",
            "title": "Scratch: Animation Keyframes in Turtle-Wok Refining",
            "body": "Review multi-colored flame spark effects in Episode 18. Outstanding 3D fluid rendering by B.CMAY PICTURES.",
            "chapterHint": "Episode 18",
            "pinned": False,
            "createdAt": "2026-10-18T10:55:00Z",
            "updatedAt": "2026-10-18T10:55:00Z"
        },

        # work-xianxia-06: Renegade Immortal
        {
            "id": "nb-xianxia-06-1",
            "workId": "work-xianxia-06",
            "category": "theory",
            "title": "Theory: Slaughter Essence & The Ancient God Domain",
            "body": "Wang Lin's split avatar cultivates the eight-star Ancient God royal bloodline while his original body refines the Slaughter, Life and Death, and Karma Essences. This dual path establishes his transcendence into the Fourth Step of cultivation.",
            "chapterHint": "Ch. 340",
            "pinned": True,
            "createdAt": "2026-10-18T11:00:00Z",
            "updatedAt": "2026-10-18T11:00:00Z"
        },
        {
            "id": "nb-xianxia-06-2",
            "workId": "work-xianxia-06",
            "category": "clue",
            "title": "Clue: The Defiance Bead's 5 Elements",
            "body": "The Tian Ni (Heaven Defying) Bead requires all five elemental essences (Metal, Wood, Water, Fire, Earth) to unlock its ultimate secret: controlling time acceleration inside the internal divine realm.",
            "chapterHint": "Ch. 100",
            "pinned": False,
            "createdAt": "2026-10-18T11:05:00Z",
            "updatedAt": "2026-10-18T11:05:00Z"
        },

        # work-xianxia-07: I Shall Seal the Heavens
        {
            "id": "nb-xianxia-07-1",
            "workId": "work-xianxia-07",
            "category": "theory",
            "title": "Theory: The Ninth Mountain and Sea & Allheaven's Clones",
            "body": "Meng Hao's Demon Sealing Hexes (First through Ninth) represent the dismantling of Allheaven's divine authority across the Nine Mountains and Seas.",
            "chapterHint": "Ch. 1400",
            "pinned": True,
            "createdAt": "2026-10-18T11:10:00Z",
            "updatedAt": "2026-10-18T11:10:00Z"
        },
        {
            "id": "nb-xianxia-07-2",
            "workId": "work-xianxia-07",
            "category": "clue",
            "title": "Clue: The Copper Mirror and the Feather Inscription",
            "body": "The copper mirror replicates items at the cost of spirit stones, but has an instinctual aversion to furry beasts and birds. Its true creator is the Paragon Slaughter from Er Gen's broader multiverse.",
            "chapterHint": "Ch. 50",
            "pinned": False,
            "createdAt": "2026-10-18T11:15:00Z",
            "updatedAt": "2026-10-18T11:15:00Z"
        },

        # work-xianxia-08: Coiling Dragon
        {
            "id": "nb-xianxia-08-1",
            "workId": "work-xianxia-08",
            "category": "theory",
            "title": "Theory: Soul Mutation and Four-Way Element Fusion",
            "body": "Linley's soul mutation allows simultaneous fusion of Earth, Wind, Water, and Fire Profound Laws. Fusing 4 distinct elemental laws unlocks Grandmaster Sovereign level power that surpasses ordinary Chief Sovereigns.",
            "chapterHint": "Gebados / Plane Wars",
            "pinned": True,
            "createdAt": "2026-10-18T11:20:00Z",
            "updatedAt": "2026-10-18T11:20:00Z"
        },
        {
            "id": "nb-xianxia-08-2",
            "workId": "work-xianxia-08",
            "category": "character",
            "title": "Character Map: Linley Baruch, Bebe, and Doehring Cowart",
            "body": "The Baruch clan Dragonblood lineage, the rat companion Bebe (descendant of Beirut), and the tragic mentor Grandpa Doehring whose soul sacrifice ignited Linley's revenge against the Radiant Church.",
            "chapterHint": "Ch. 1-100",
            "pinned": False,
            "createdAt": "2026-10-18T11:25:00Z",
            "updatedAt": "2026-10-18T11:25:00Z"
        },

        # work-xianxia-09: Desolate Era
        {
            "id": "nb-xianxia-09-1",
            "workId": "work-xianxia-09",
            "category": "theory",
            "title": "Theory: Heartforce Cultivation vs Sword Dao Realms",
            "body": "Ji Ning masters the Omega Sword Dao, which integrates Yin-Yang, Space, Time, and Slaughter into a single indivisible stroke. Heartforce level 5 (World Heart) enables mental manifestations that overwrite physical reality.",
            "chapterHint": "Starseizer Arc",
            "pinned": True,
            "createdAt": "2026-10-18T11:30:00Z",
            "updatedAt": "2026-10-18T11:30:00Z"
        },
        {
            "id": "nb-xianxia-09-2",
            "workId": "work-xianxia-09",
            "category": "clue",
            "title": "Clue: Nuwa's Legacy and the Primordial Chaos Cosmos",
            "body": "The paintings left behind by Mother Nuwa contain the blueprint for breaking through the Three Realms into the vast boundless Primordial Chaos.",
            "chapterHint": "Three Realms War",
            "pinned": False,
            "createdAt": "2026-10-18T11:35:00Z",
            "updatedAt": "2026-10-18T11:35:00Z"
        },

        # work-xianxia-10: Martial World
        {
            "id": "nb-xianxia-10-1",
            "workId": "work-xianxia-10",
            "category": "theory",
            "title": "Theory: The Origin of the Magic Cube",
            "body": "The Magic Cube is one of the three divine cosmic artifacts from the ancient universe that shattered into thirty-three heavens. It specializes in devouring the souls and memories of supreme divine masters and crystallizing them into pure soul stones.",
            "chapterHint": "Ch. 1-50",
            "pinned": True,
            "createdAt": "2026-10-18T11:40:00Z",
            "updatedAt": "2026-10-18T11:40:00Z"
        },
        {
            "id": "nb-xianxia-10-2",
            "workId": "work-xianxia-10",
            "category": "character",
            "title": "Character Map: Lin Ming's wives and allies across the Divine Realm",
            "body": "Mu Qianxue (Magic Cube Saintess), Qin Xingxuan, Xiao Moxian (Dark Phoenix royalty), and Sheng Mei (Empress of the Soul Race / Nine Lives Reincarnation). Lin Ming's alliance with the Human Sovereign Divine Dream.",
            "chapterHint": "Divine Realm Arc",
            "pinned": False,
            "createdAt": "2026-10-18T11:45:00Z",
            "updatedAt": "2026-10-18T11:45:00Z"
        },
        {
            "id": "nb-xianxia-10-3",
            "workId": "work-xianxia-10",
            "category": "question",
            "title": "Open Question: Who crafted the Purple Card in True Martial World?",
            "body": "If Lin Ming inherited the Magic Cube and Yi Yun obtained the Purple Crystal Card, what primordial divinity forged all three heavenly treasures before the Great Calamity?",
            "chapterHint": "Finale / Universe Lore",
            "pinned": False,
            "createdAt": "2026-10-18T11:50:00Z",
            "updatedAt": "2026-10-18T11:50:00Z"
        },

        # work-xianxia-11: Battle Through the Heavens
        {
            "id": "nb-xianxia-11-1",
            "workId": "work-xianxia-11",
            "category": "theory",
            "title": "Theory: Heavenly Flame Ranking & Di Tier Pill Formula",
            "body": "The Flame Mantra (Fen Jue) enables Xiao Yan to consume multiple ranked Heavenly Flames (from Green Lotus to Purifying Demonic Lotus), culminating in the Di Flame Emperor ascension.",
            "chapterHint": "Ch. 500",
            "pinned": True,
            "createdAt": "2026-10-18T11:55:00Z",
            "updatedAt": "2026-10-18T11:55:00Z"
        },
        {
            "id": "nb-xianxia-11-2",
            "workId": "work-xianxia-11",
            "category": "character",
            "title": "Character Map: Xiao Yan, Yao Chen, and Medusa",
            "body": "Yao Lao (Medicine Venerable) spirit teacher, Queen Medusa (Cai Lin of the Snake Tribe), and Gu Xun'er (Ancient Gu Clan Princess).",
            "chapterHint": "Tagore Desert Arc",
            "pinned": False,
            "createdAt": "2026-10-18T12:00:00Z",
            "updatedAt": "2026-10-18T12:00:00Z"
        },

        # work-xianxia-12: A Record of a Mortal's Journey to Immortality
        {
            "id": "nb-xianxia-12-1",
            "workId": "work-xianxia-12",
            "category": "theory",
            "title": "Theory: Mysterious Small Green Bottle (Heavenly Creation Bottle)",
            "body": "The green vial condensates emerald spirit liquid overnight from starlight. Diluting it accelerates 1,000-year spirit herbs within months, bypassing Han Li's mediocre pseudo-spiritual root handicap.",
            "chapterHint": "Ch. 10",
            "pinned": True,
            "createdAt": "2026-10-18T12:05:00Z",
            "updatedAt": "2026-10-18T12:05:00Z"
        },
        {
            "id": "nb-xianxia-12-2",
            "workId": "work-xianxia-12",
            "category": "clue",
            "title": "Clue: Spirit Herb Maturation Multiplier",
            "body": "Golden Sun Grass and Soul Cleansing Lotus require exactly 7 drops of condensed liquid. Han Li must never reveal his secret in the Seven Mysteries Sect or Yellow Maple Valley.",
            "chapterHint": "Yellow Maple Valley",
            "pinned": False,
            "createdAt": "2026-10-18T12:10:00Z",
            "updatedAt": "2026-10-18T12:10:00Z"
        },

        # work-xianxia-13: Cultivation Chat Group
        {
            "id": "nb-xianxia-13-1",
            "workId": "work-xianxia-13",
            "category": "theory",
            "title": "Theory: Heavenly Dao Resignation and Song Shuhang's Core Tribulations",
            "body": "Song Shuhang's seven small golden cores form a complex composite core array. His ability to absorb heavenly tribulations as tasty meals or rechargeable batteries disrupts all established Daoist physics.",
            "chapterHint": "Ch. 1500",
            "pinned": True,
            "createdAt": "2026-10-18T12:15:00Z",
            "updatedAt": "2026-10-18T12:15:00Z"
        },
        {
            "id": "nb-xianxia-13-2",
            "workId": "work-xianxia-13",
            "category": "character",
            "title": "Character Map: Nine Provinces Number One Group Member Aliases",
            "body": "Senior White (Venerable White / Luck God), True Monarch Yellow Mountain (Chat Admin), Fairy Lychee, Mad Saber Three Waves (Death Seeker), and Song Shuhang's 20 changing Daoist names.",
            "chapterHint": "Ch. 1-200",
            "pinned": False,
            "createdAt": "2026-10-18T12:20:00Z",
            "updatedAt": "2026-10-18T12:20:00Z"
        },

        # work-xianxia-14: My Senior Brother is Too Steady
        {
            "id": "nb-xianxia-14-1",
            "workId": "work-xianxia-14",
            "category": "theory",
            "title": "Theory: The Investiture of the Gods and Li Changshou's Escape Velocity",
            "body": "Li Changshou calculates that 98% certainty is equivalent to guaranteed death. By crafting dozens of paper effigy clones, avoiding karmic entanglements, and serving the Grand Pure Sage quietly, he outmaneuvers the Heavenly Dao.",
            "chapterHint": "Heavenly Court Arc",
            "pinned": True,
            "createdAt": "2026-10-18T12:25:00Z",
            "updatedAt": "2026-10-18T12:25:00Z"
        },
        {
            "id": "nb-xianxia-14-2",
            "workId": "work-xianxia-14",
            "category": "scratch",
            "title": "Scratch: Safety Contingencies: 98% Confidence is Equivalent to Zero",
            "body": "Rules for leaving Little Qiong Peak: 1. Deploy 3 soul paper puppets. 2. Carry poison mist arrays. 3. Conceal realm by at least 2 major stages. 4. Never provoke disciples with protagonist auras.",
            "chapterHint": "Duobao Daoist Arc",
            "pinned": False,
            "createdAt": "2026-10-18T12:30:00Z",
            "updatedAt": "2026-10-18T12:30:00Z"
        },

        # work-xianxia-15: The Grandmaster of Demonic Cultivation
        {
            "id": "nb-xianxia-15-1",
            "workId": "work-xianxia-15",
            "category": "theory",
            "title": "Theory: The Origin of the Stygian Tiger Amulet & Demonic Cultivation Flaws",
            "body": "Wei Wuxian's invention of the Ghost Path (Demonic Cultivation) harnesses resentful energy rather than golden core spiritual energy. The Stygian Tiger Amulet demands such tremendous spiritual control that prolonged use erodes mental sanity.",
            "chapterHint": "Burial Mounds",
            "pinned": True,
            "createdAt": "2026-10-18T12:35:00Z",
            "updatedAt": "2026-10-18T12:35:00Z"
        },
        {
            "id": "nb-xianxia-15-2",
            "workId": "work-xianxia-15",
            "category": "character",
            "title": "Character Map: Wei Wuxian, Lan Wangji, and the Twin Jades of Lan",
            "body": "The Twin Jades of Lan (Lan Xichen and Lan Wangji), the Jiang Sect siblings (Jiang Cheng and Jiang Yanli), and the tragic ghost general Wen Ning.",
            "chapterHint": "Gusu Arc",
            "pinned": False,
            "createdAt": "2026-10-18T12:40:00Z",
            "updatedAt": "2026-10-18T12:40:00Z"
        },

        # work-xianxia-16: Heaven Official's Blessing
        {
            "id": "nb-xianxia-16-1",
            "workId": "work-xianxia-16",
            "category": "theory",
            "title": "Theory: The White-Clothed Calamity and the Heavenly Emperor's Dual Identity",
            "body": "Jun Wu and Bai Wuxiang are two aspects of the same fallen Crown Prince of Wuyong. His mirror obsession with Xie Lian's moral resilience drives eight centuries of orchestrated trials.",
            "chapterHint": "Book 4",
            "pinned": True,
            "createdAt": "2026-10-18T12:45:00Z",
            "updatedAt": "2026-10-18T12:45:00Z"
        },
        {
            "id": "nb-xianxia-16-2",
            "workId": "work-xianxia-16",
            "category": "clue",
            "title": "Clue: The Silver Butterflies and the Red String of Fate",
            "body": "Hua Cheng's wraith butterflies serve as scouts, weapons, and beacons of protection. The red thread around Xie Lian's third finger connects his soul directly to the Ghost City ruler.",
            "chapterHint": "Mount Yujun",
            "pinned": False,
            "createdAt": "2026-10-18T12:50:00Z",
            "updatedAt": "2026-10-18T12:50:00Z"
        },

        # work-xianxia-17: Mother of Learning
        {
            "id": "nb-xianxia-17-1",
            "workId": "work-xianxia-17",
            "category": "theory",
            "title": "Theory: The Sovereign Gate and Red Robe's Identity",
            "body": "The Sovereign Gate time loop creates temporary sub-planes for the Primordial's release simulation. Red Robe was Veyers Boranova, who used the marker soul-severing ritual to escape early into the real world.",
            "chapterHint": "Arc 2",
            "pinned": True,
            "createdAt": "2026-10-18T12:55:00Z",
            "updatedAt": "2026-10-18T12:55:00Z"
        },
        {
            "id": "nb-xianxia-17-2",
            "workId": "work-xianxia-17",
            "category": "character",
            "title": "Character Map: Zach Noveda vs Zorian Kazinski",
            "body": "Zach: massive mana reserves, prodigal combat instincts, naive mindset. Zorian: mind magic mastery, golem crafting, shaping finesse, paranoid analytical strategist.",
            "chapterHint": "Arc 1-3",
            "pinned": False,
            "createdAt": "2026-10-18T13:00:00Z",
            "updatedAt": "2026-10-18T13:00:00Z"
        },
        {
            "id": "nb-xianxia-17-3",
            "workId": "work-xianxia-17",
            "category": "clue",
            "title": "Clue: The 5 Keys of the First Patriarch",
            "body": "To exit the time loop intact: 1. Imperial Ring (Ius royal family). 2. Key of the Iron Sovereign. 3. Staff of the First Patriarch. 4. Dagger of the Silent Door. 5. Crown of the Eagle Clan.",
            "chapterHint": "Ch. 54",
            "pinned": False,
            "createdAt": "2026-10-18T13:05:00Z",
            "updatedAt": "2026-10-18T13:05:00Z"
        },

        # work-xianxia-18: Defiance of the Fall
        {
            "id": "nb-xianxia-18-1",
            "workId": "work-xianxia-18",
            "category": "theory",
            "title": "Theory: The Dao of Heaviness, Life/Death Node Equilibrium",
            "body": "Zac Atwood's dual bloodlines (Human and Void Karsian Draugr) allow simultaneous development of the Dao of Life and Dao of Death, resolving the lethal node conflict.",
            "chapterHint": "Twilight Harbor",
            "pinned": True,
            "createdAt": "2026-10-18T13:10:00Z",
            "updatedAt": "2026-10-18T13:10:00Z"
        },
        {
            "id": "nb-xianxia-18-2",
            "workId": "work-xianxia-18",
            "category": "character",
            "title": "Character Map: Zac Atwood, Ogras, and the Undead Empire",
            "body": "Zac's alliance with the opportunistic demon shadow Ogras Azh'Reh, the automaton Vilari, and the Undead Empire incursion in Sector G.",
            "chapterHint": "Earth Incursion",
            "pinned": False,
            "createdAt": "2026-10-18T13:15:00Z",
            "updatedAt": "2026-10-18T13:15:00Z"
        },

        # work-xianxia-19: Primal Hunter
        {
            "id": "nb-xianxia-19-1",
            "workId": "work-xianxia-19",
            "category": "theory",
            "title": "Theory: The Bloodline of the Primal Hunter & Villy's Patronage",
            "body": "Jake Thayne's Bloodline allows him to sense instinctual paths and perceive all intentions without magical interference. The Malefic Viper (Villy) provides divine alchemy formulas.",
            "chapterHint": "Tutorial Arc",
            "pinned": True,
            "createdAt": "2026-10-18T13:20:00Z",
            "updatedAt": "2026-10-18T13:20:00Z"
        },
        {
            "id": "nb-xianxia-19-2",
            "workId": "work-xianxia-19",
            "category": "question",
            "title": "Open Question: What is the highest tier of the Cosmic System?",
            "body": "Will Jake's path of pure solitary hunting enable him to bypass Primordial God limitations and reach the unmapped Origin rank?",
            "chapterHint": "Nevermore Arc",
            "pinned": False,
            "createdAt": "2026-10-18T13:25:00Z",
            "updatedAt": "2026-10-18T13:25:00Z"
        },

        # work-xianxia-20: He Who Fights With Monsters
        {
            "id": "nb-xianxia-20-1",
            "workId": "work-xianxia-20",
            "category": "theory",
            "title": "Theory: The Astral King and Soul Forge Transmutation",
            "body": "Jason Asano's Sin, Dark, and Blood essences synthesize into the Doom confluence. His soul territory develops into an Astral King domain bypassing Great Astral Being restrictions.",
            "chapterHint": "Book 5 Earth Arc",
            "pinned": True,
            "createdAt": "2026-10-18T13:30:00Z",
            "updatedAt": "2026-10-18T13:30:00Z"
        },
        {
            "id": "nb-xianxia-20-2",
            "workId": "work-xianxia-20",
            "category": "character",
            "title": "Character Map: Team Biscuit: Jason, Sophie, Humphrey, Clive, Neil",
            "body": "Humphrey (Winged Lion shield), Sophie (unarmored wind speedster), Clive (runic tactical theorist), Neil (feast-blessed combat healer), Jason (affliction debuffer).",
            "chapterHint": "Greenstone Arc",
            "pinned": False,
            "createdAt": "2026-10-18T13:35:00Z",
            "updatedAt": "2026-10-18T13:35:00Z"
        },

        # work-xianxia-21: Dungeon Crawler Carl
        {
            "id": "nb-xianxia-21-1",
            "workId": "work-xianxia-21",
            "category": "theory",
            "title": "Theory: The Primal Engine and Borant Corporation's Exit Clause",
            "body": "The World Dungeon is not an entertainment show for galactic viewers; it is a resource mining purge designed to harvest planet cores while generating syndicate ad revenue.",
            "chapterHint": "Floor 6",
            "pinned": True,
            "createdAt": "2026-10-18T13:40:00Z",
            "updatedAt": "2026-10-18T13:40:00Z"
        },
        {
            "id": "nb-xianxia-21-2",
            "workId": "work-xianxia-21",
            "category": "character",
            "title": "Character Map: Carl, Princess Donut, Katia, and Prepotente",
            "body": "Carl (Bomb Specialist / Barefoot Brawler), Princess Donut the Cat (Grand Champion Persian / Screaming Siren), Katia (Eva's daughter / Alchemy shapeshifter).",
            "chapterHint": "Floor 3",
            "pinned": False,
            "createdAt": "2026-10-18T13:45:00Z",
            "updatedAt": "2026-10-18T13:45:00Z"
        },

        # work-xianxia-22: Beware of Chicken
        {
            "id": "nb-xianxia-22-1",
            "workId": "work-xianxia-22",
            "category": "theory",
            "title": "Theory: The Spiritual Dao of Honest Farming & Bi De's Awakening",
            "body": "Jin Rou abandons the murder-spree cultivation sects to plant rice in the Azure Hills. His pure, unhurried mortal labor radiates authentic Dao intent, inadvertently awakening farm animals into noble enlightened beasts.",
            "chapterHint": "Fa Ram Arc",
            "pinned": True,
            "createdAt": "2026-10-18T13:50:00Z",
            "updatedAt": "2026-10-18T13:50:00Z"
        },
        {
            "id": "nb-xianxia-22-2",
            "workId": "work-xianxia-22",
            "category": "character",
            "title": "Character Map: Jin Rou, Meiling, Bi De, Chun Ke, and Gou Ren",
            "body": "Jin Rou (former outer disciple farmer), Meiling (herbalist wife), Bi De (noble martial rooster), Chun Ke (lazy enlightened pig), Gou Ren (humble guard dog).",
            "chapterHint": "Ch. 1-30",
            "pinned": False,
            "createdAt": "2026-10-18T13:55:00Z",
            "updatedAt": "2026-10-18T13:55:00Z"
        },

        # work-xianxia-23: Unorthodox Cultivation: Demon Emperor
        {
            "id": "nb-xianxia-23-1",
            "workId": "work-xianxia-23",
            "category": "theory",
            "title": "Theory: The Nine Nether Secret Art and Demon Heritage",
            "body": "Zhuo Yifan uses the Book of the Nine Nethers to cultivate the Demon Transformation Art, consuming the spiritual roots of rivals while maintaining ruthless tactical clarity.",
            "chapterHint": "Luo Clan Arc",
            "pinned": True,
            "createdAt": "2026-10-18T14:00:00Z",
            "updatedAt": "2026-10-18T14:00:00Z"
        },
        {
            "id": "nb-xianxia-23-2",
            "workId": "work-xianxia-23",
            "category": "clue",
            "title": "Clue: Ancient Saint Beast Remnants",
            "body": "The five sacred beasts of the ancient primordial era left behind bone relics that Zhuo Yifan incorporates into his sovereign demonic frame.",
            "chapterHint": "Dragon City",
            "pinned": False,
            "createdAt": "2026-10-18T14:05:00Z",
            "updatedAt": "2026-10-18T14:05:00Z"
        },

        # work-xianxia-24: Sovereign of the Three Realms
        {
            "id": "nb-xianxia-24-1",
            "workId": "work-xianxia-24",
            "category": "theory",
            "title": "Theory: The Reincarnated Heavenly Emperor's Son Memories",
            "body": "Jiang Chen retains millions of years of divine library knowledge from his past life as the son of the Heavenly Emperor, allowing him to discern flaws in any mortal formation.",
            "chapterHint": "Eastern Kingdom",
            "pinned": True,
            "createdAt": "2026-10-18T14:10:00Z",
            "updatedAt": "2026-10-18T14:10:00Z"
        },
        {
            "id": "nb-xianxia-24-2",
            "workId": "work-xianxia-24",
            "category": "character",
            "title": "Character Map: Jiang Chen, Dan Fei, and the Myriad Domain Sects",
            "body": "Jiang Chen's rise from Eastern Kingdom marquis to the supreme lord of the Myriad Domain and Sacred Peafowl Mountain.",
            "chapterHint": "Precious Tree Sect",
            "pinned": False,
            "createdAt": "2026-10-18T14:15:00Z",
            "updatedAt": "2026-10-18T14:15:00Z"
        },

        # work-xianxia-25: Ze Tian Ji (Way of Choices)
        {
            "id": "nb-xianxia-25-1",
            "workId": "work-xianxia-25",
            "category": "theory",
            "title": "Theory: Chen Changsheng's Fated Lifespan & The Heavenly Tomes",
            "body": "Born with blocked sun meridian pathways doomed to perish before age twenty, Chen Changsheng seeks to change his fate by memorizing the Three Thousand Daoist Scriptures.",
            "chapterHint": "Mausoleum of Books",
            "pinned": True,
            "createdAt": "2026-10-18T14:20:00Z",
            "updatedAt": "2026-10-18T14:20:00Z"
        },
        {
            "id": "nb-xianxia-25-2",
            "workId": "work-xianxia-25",
            "category": "character",
            "title": "Character Map: Chen Changsheng, Xu Yourong, Luoluo, and Tang Thirty-Six",
            "body": "The resurrection of the Orthodox Academy: Chen Changsheng (Principal), Princess Luoluo of the Demi-human Clan, Tang Thirty-Six (Wenshui heir), and Xu Yourong (Holy Maiden).",
            "chapterHint": "Orthodox Academy",
            "pinned": False,
            "createdAt": "2026-10-18T14:25:00Z",
            "updatedAt": "2026-10-18T14:25:00Z"
        },

        # work-xianxia-26: World of Cultivation
        {
            "id": "nb-xianxia-26-1",
            "workId": "work-xianxia-26",
            "category": "theory",
            "title": "Theory: Zombie Face Zuo Mo's Lost Memory and Yao/Mo Fusion",
            "body": "Zuo Mo's altered facial features and excised memories conceal his royal bloodline. By simultaneously cultivating sword scriptures, yao arts, and mo physique tempering, he creates the golden crow sun sword.",
            "chapterHint": "Desolate Land Arc",
            "pinned": True,
            "createdAt": "2026-10-18T14:30:00Z",
            "updatedAt": "2026-10-18T14:30:00Z"
        },
        {
            "id": "nb-xianxia-26-2",
            "workId": "work-xianxia-26",
            "category": "clue",
            "title": "Clue: The Mysterious Gravestone and Pu Yao's Motives",
            "body": "Inside Zuo Mo's sea of consciousness resides Pu Yao, a cunning sky yao sealed in a blood-red gravestone who trades ancient techniques for jingshi and soul nourishment.",
            "chapterHint": "Wu Kong Sword Sect",
            "pinned": False,
            "createdAt": "2026-10-18T14:35:00Z",
            "updatedAt": "2026-10-18T14:35:00Z"
        },

        # work-xianxia-trash-01 & 02: Trash bin notes
        {
            "id": "nb-xianxia-trash-01-1",
            "workId": "work-xianxia-trash-01",
            "category": "scratch",
            "title": "Scratch: Outdated Meridian Mapping Notes",
            "body": "Rough draft notes exploring nine-fold meridian openings. Superseded by official volume 1 release.",
            "chapterHint": "Ch. 1-15",
            "pinned": False,
            "createdAt": "2026-10-17T09:00:00Z",
            "updatedAt": "2026-10-17T09:00:00Z"
        },
        {
            "id": "nb-xianxia-trash-02-1",
            "workId": "work-xianxia-trash-02",
            "category": "scratch",
            "title": "Scratch: Stale Bookmark Mirror Log",
            "body": "Archived duplicate bookmarks pointing to dead Wuxia mirrors. Marked for permanent purge.",
            "chapterHint": "N/A",
            "pinned": False,
            "createdAt": "2026-10-18T11:20:00Z",
            "updatedAt": "2026-10-18T11:20:00Z"
        }
    ]

    fandom_links = [
        # LotM
        {"id": "fl-xianxia-01-1", "workId": "work-xianxia-01", "communityName": "Lord of the Mysteries Wiki", "provider": "fandom", "canonicalTitle": "Lord of the Mysteries", "url": "https://lordofthemysteries.fandom.com/wiki/Lord_of_the_Mysteries_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-xianxia-01-2", "workId": "work-xianxia-01", "communityName": "r/LordofTheMysteries", "provider": "subreddit", "canonicalTitle": "Lord of the Mysteries Subreddit", "url": "https://www.reddit.com/r/LordofTheMysteries/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Reverend Insanity
        {"id": "fl-xianxia-02-1", "workId": "work-xianxia-02", "communityName": "Reverend Insanity Wiki", "provider": "fandom", "canonicalTitle": "Reverend Insanity", "url": "https://reverend-insanity.fandom.com/wiki/Reverend_Insanity_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-xianxia-02-2", "workId": "work-xianxia-02", "communityName": "r/ReverendInsanity", "provider": "subreddit", "canonicalTitle": "Reverend Insanity Subreddit", "url": "https://www.reddit.com/r/ReverendInsanity/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Cradle
        {"id": "fl-xianxia-03-1", "workId": "work-xianxia-03", "communityName": "Abidan Archive Cradle Wiki", "provider": "wiki", "canonicalTitle": "Cradle Series", "url": "https://wiki.abidanarchive.com/index.php/Cradle", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-xianxia-03-2", "workId": "work-xianxia-03", "communityName": "r/Iteration110Cradle", "provider": "subreddit", "canonicalTitle": "Cradle Subreddit", "url": "https://www.reddit.com/r/Iteration110Cradle/", "isPreferred": False, "language": "en", "provenance": "import"},
        # A Will Eternal Novel
        {"id": "fl-xianxia-04-1", "workId": "work-xianxia-04", "communityName": "A Will Eternal Fandom Wiki", "provider": "fandom", "canonicalTitle": "A Will Eternal", "url": "https://wuxiaworld.fandom.com/wiki/A_Will_Eternal", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-xianxia-04-2", "workId": "work-xianxia-04", "communityName": "r/ErGen", "provider": "subreddit", "canonicalTitle": "Er Gen Universe Subreddit", "url": "https://www.reddit.com/r/ErGen/", "isPreferred": False, "language": "en", "provenance": "import"},
        # A Will Eternal Donghua
        {"id": "fl-xianxia-05-1", "workId": "work-xianxia-05", "communityName": "A Will Eternal Anime Lore Wiki", "provider": "fandom", "canonicalTitle": "A Will Eternal Donghua", "url": "https://wuxiaworld.fandom.com/wiki/A_Will_Eternal", "isPreferred": True, "language": "en", "provenance": "import"},
        # Renegade Immortal
        {"id": "fl-xianxia-06-1", "workId": "work-xianxia-06", "communityName": "Renegade Immortal Wiki", "provider": "fandom", "canonicalTitle": "Renegade Immortal", "url": "https://renegade-immortal.fandom.com/wiki/Renegade_Immortal_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # ISSTH
        {"id": "fl-xianxia-07-1", "workId": "work-xianxia-07", "communityName": "I Shall Seal the Heavens Wiki", "provider": "fandom", "canonicalTitle": "I Shall Seal the Heavens", "url": "https://issth.fandom.com/wiki/I_Shall_Seal_the_Heavens_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Coiling Dragon
        {"id": "fl-xianxia-08-1", "workId": "work-xianxia-08", "communityName": "Coiling Dragon Wiki", "provider": "fandom", "canonicalTitle": "Coiling Dragon", "url": "https://coiling-dragon.fandom.com/wiki/Coiling_Dragon_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Desolate Era
        {"id": "fl-xianxia-09-1", "workId": "work-xianxia-09", "communityName": "Desolate Era Wiki", "provider": "fandom", "canonicalTitle": "Desolate Era", "url": "https://desolate-era.fandom.com/wiki/Desolate_Era_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Martial World
        {"id": "fl-xianxia-10-1", "workId": "work-xianxia-10", "communityName": "Martial World Wiki", "provider": "fandom", "canonicalTitle": "Martial World", "url": "https://martial-world.fandom.com/wiki/Martial_World_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-xianxia-10-2", "workId": "work-xianxia-10", "communityName": "Wuxiaworld Martial World Community", "provider": "wiki", "canonicalTitle": "Martial World Wuxiaworld Archive", "url": "https://wuxiaworld.fandom.com/wiki/Martial_World", "isPreferred": False, "language": "en", "provenance": "import"},
        # BTTH
        {"id": "fl-xianxia-11-1", "workId": "work-xianxia-11", "communityName": "Battle Through the Heavens Wiki", "provider": "fandom", "canonicalTitle": "Battle Through the Heavens", "url": "https://battle-through-the-heavens.fandom.com/wiki/Battle_Through_the_Heavens_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # RMJI
        {"id": "fl-xianxia-12-1", "workId": "work-xianxia-12", "communityName": "Record of a Mortal's Journey Wiki", "provider": "fandom", "canonicalTitle": "A Record of a Mortal's Journey to Immortality", "url": "https://rmji.fandom.com/wiki/A_Record_of_a_Mortal%27s_Journey_to_Immortality_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Cultivation Chat Group
        {"id": "fl-xianxia-13-1", "workId": "work-xianxia-13", "communityName": "Cultivation Chat Group Wiki", "provider": "fandom", "canonicalTitle": "Cultivation Chat Group", "url": "https://cultivation-chat-group.fandom.com/wiki/Cultivation_Chat_Group_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-xianxia-13-2", "workId": "work-xianxia-13", "communityName": "r/CultivationChatGroup", "provider": "subreddit", "canonicalTitle": "Cultivation Chat Group Subreddit", "url": "https://www.reddit.com/r/CultivationChatGroup/", "isPreferred": False, "language": "en", "provenance": "import"},
        # My Senior Brother is Too Steady
        {"id": "fl-xianxia-14-1", "workId": "work-xianxia-14", "communityName": "Senior Brother Steady Lore Hub", "provider": "wiki", "canonicalTitle": "My Senior Brother is Too Steady", "url": "https://wuxiaworld.fandom.com/wiki/My_Senior_Brother_is_Too_Steady", "isPreferred": True, "language": "en", "provenance": "import"},
        # MDZS
        {"id": "fl-xianxia-15-1", "workId": "work-xianxia-15", "communityName": "Mo Dao Zu Shi Wiki", "provider": "fandom", "canonicalTitle": "Grandmaster of Demonic Cultivation", "url": "https://modao-zushi.fandom.com/wiki/Grandmaster_of_Demonic_Cultivation_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-xianxia-15-2", "workId": "work-xianxia-15", "communityName": "r/MoDaoZuShi", "provider": "subreddit", "canonicalTitle": "Mo Dao Zu Shi Subreddit", "url": "https://www.reddit.com/r/MoDaoZuShi/", "isPreferred": False, "language": "en", "provenance": "import"},
        # TGCF
        {"id": "fl-xianxia-16-1", "workId": "work-xianxia-16", "communityName": "Heaven Official's Blessing Wiki", "provider": "fandom", "canonicalTitle": "Heaven Official's Blessing", "url": "https://heaven-officials-blessing.fandom.com/wiki/Heaven_Official%27s_Blessing_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-xianxia-16-2", "workId": "work-xianxia-16", "communityName": "r/tianguancifu", "provider": "subreddit", "canonicalTitle": "TGCF Subreddit", "url": "https://www.reddit.com/r/tianguancifu/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Mother of Learning
        {"id": "fl-xianxia-17-1", "workId": "work-xianxia-17", "communityName": "Mother of Learning Wiki", "provider": "fandom", "canonicalTitle": "Mother of Learning", "url": "https://mother-of-learning.fandom.com/wiki/Mother_of_Learning_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-xianxia-17-2", "workId": "work-xianxia-17", "communityName": "r/motheroflearning", "provider": "subreddit", "canonicalTitle": "Mother of Learning Subreddit", "url": "https://www.reddit.com/r/motheroflearning/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Defiance of the Fall
        {"id": "fl-xianxia-18-1", "workId": "work-xianxia-18", "communityName": "Defiance of the Fall Wiki", "provider": "fandom", "canonicalTitle": "Defiance of the Fall", "url": "https://defiance-of-the-fall.fandom.com/wiki/Defiance_of_the_Fall_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-xianxia-18-2", "workId": "work-xianxia-18", "communityName": "r/DefianceOfTheFall", "provider": "subreddit", "canonicalTitle": "Defiance of the Fall Subreddit", "url": "https://www.reddit.com/r/DefianceOfTheFall/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Primal Hunter
        {"id": "fl-xianxia-19-1", "workId": "work-xianxia-19", "communityName": "The Primal Hunter Wiki", "provider": "fandom", "canonicalTitle": "The Primal Hunter", "url": "https://the-primal-hunter.fandom.com/wiki/The_Primal_Hunter_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # HWFWM
        {"id": "fl-xianxia-20-1", "workId": "work-xianxia-20", "communityName": "He Who Fights With Monsters Wiki", "provider": "fandom", "canonicalTitle": "He Who Fights With Monsters", "url": "https://he-who-fights-with-monsters.fandom.com/wiki/He_Who_Fights_With_Monsters_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-xianxia-20-2", "workId": "work-xianxia-20", "communityName": "r/Shirtaloon", "provider": "subreddit", "canonicalTitle": "He Who Fights With Monsters Subreddit", "url": "https://www.reddit.com/r/Shirtaloon/", "isPreferred": False, "language": "en", "provenance": "import"},
        # DCC
        {"id": "fl-xianxia-21-1", "workId": "work-xianxia-21", "communityName": "Dungeon Crawler Carl Wiki", "provider": "fandom", "canonicalTitle": "Dungeon Crawler Carl", "url": "https://dungeon-crawler-carl.fandom.com/wiki/Dungeon_Crawler_Carl_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-xianxia-21-2", "workId": "work-xianxia-21", "communityName": "r/DungeonCrawlerCarl", "provider": "subreddit", "canonicalTitle": "Dungeon Crawler Carl Subreddit", "url": "https://www.reddit.com/r/DungeonCrawlerCarl/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Beware of Chicken
        {"id": "fl-xianxia-22-1", "workId": "work-xianxia-22", "communityName": "Beware of Chicken Wiki", "provider": "fandom", "canonicalTitle": "Beware of Chicken", "url": "https://beware-of-chicken.fandom.com/wiki/Beware_of_Chicken_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Demon Emperor
        {"id": "fl-xianxia-23-1", "workId": "work-xianxia-23", "communityName": "Demon Emperor Wiki", "provider": "fandom", "canonicalTitle": "Demon Emperor", "url": "https://demon-emperor.fandom.com/wiki/Demon_Emperor_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Sovereign of the Three Realms
        {"id": "fl-xianxia-24-1", "workId": "work-xianxia-24", "communityName": "Sovereign of the Three Realms Wiki", "provider": "wiki", "canonicalTitle": "Sovereign of the Three Realms", "url": "https://wuxiaworld.fandom.com/wiki/Sovereign_of_the_Three_Realms", "isPreferred": True, "language": "en", "provenance": "import"},
        # Ze Tian Ji
        {"id": "fl-xianxia-25-1", "workId": "work-xianxia-25", "communityName": "Way of Choices Wiki", "provider": "fandom", "canonicalTitle": "Ze Tian Ji (Way of Choices)", "url": "https://way-of-choices.fandom.com/wiki/Way_of_Choices_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # World of Cultivation
        {"id": "fl-xianxia-26-1", "workId": "work-xianxia-26", "communityName": "World of Cultivation Wiki", "provider": "fandom", "canonicalTitle": "World of Cultivation", "url": "https://world-of-cultivation.fandom.com/wiki/World_of_Cultivation_Wiki", "isPreferred": True, "language": "en", "provenance": "import"}
    ]

    return notebook_entries, fandom_links


def get_pack_2_enrichments():
    """Returns (notebook_entries, fandom_links) for Pack 2: Manga & Anime Chronicles."""
    notebook_entries = [
        # work-manga-01 & 02: Solo Leveling Novel & Manhwa
        {
            "id": "nb-manga-01-1",
            "workId": "work-manga-01",
            "category": "theory",
            "title": "Theory: The Absolute Being and the Monarchs vs Rulers",
            "body": "The Absolute Being created Rulers from Light and Monarchs from Darkness for eternal combat. The Shadow Monarch (Ashborn) chose Sung Jin-woo as his human vessel after the Architect engineered the Double Dungeon player system to acclimatize human biology.",
            "chapterHint": "Double Dungeon Revisit",
            "pinned": True,
            "createdAt": "2026-10-18T15:00:00Z",
            "updatedAt": "2026-10-18T15:00:00Z"
        },
        {
            "id": "nb-manga-01-2",
            "workId": "work-manga-01",
            "category": "character",
            "title": "Character Map: Sung Jin-woo's Shadow Army commanders",
            "body": "Grand Marshal Bellion (former servant of Ashborn), Marshal Beru (Ant King), Marshal Igris (Blood-red Commander), Iron (Kim Chul), Greed (Hwang Dong-soo), Tank (Ice Bear Alpha), and Kaisel (Wyvern).",
            "chapterHint": "Jeju Island Arc",
            "pinned": False,
            "createdAt": "2026-10-18T15:05:00Z",
            "updatedAt": "2026-10-18T15:05:00Z"
        },
        {
            "id": "nb-manga-02-1",
            "workId": "work-manga-02",
            "category": "clue",
            "title": "Clue: The System's Architecture and the Architect's True Motive",
            "body": "The Architect designed the Courage of the Weak system parameters. When Jin-woo exceeded level 100, the system attempted forced data transfer, triggering the Architect boss fight.",
            "chapterHint": "Ch. 128",
            "pinned": True,
            "createdAt": "2026-10-18T15:10:00Z",
            "updatedAt": "2026-10-18T15:10:00Z"
        },
        {
            "id": "nb-manga-02-2",
            "workId": "work-manga-02",
            "category": "scratch",
            "title": "Scratch: Pacing adaptations from novel to webtoon",
            "body": "Webtoon elevates visual scale of the demon castle tower climb (Radir clan alliance) and compresses the hunter association raid political discussions.",
            "chapterHint": "Demon Castle",
            "pinned": False,
            "createdAt": "2026-10-18T15:15:00Z",
            "updatedAt": "2026-10-18T15:15:00Z"
        },

        # work-manga-03: Berserk
        {
            "id": "nb-manga-03-1",
            "workId": "work-manga-03",
            "category": "theory",
            "title": "Theory: The God Hand, Idea of Evil, and Void's Past",
            "body": "The Idea of Evil was born from humanity's collective longing for meaning in suffering. Void represents the sage imprisoned by King Gaiseric (Skull Knight) a millennium ago, enacting the primordial Eclipse sacrifice.",
            "chapterHint": "Eclipse / Conviction",
            "pinned": True,
            "createdAt": "2026-10-18T15:20:00Z",
            "updatedAt": "2026-10-18T15:20:00Z"
        },
        {
            "id": "nb-manga-03-2",
            "workId": "work-manga-03",
            "category": "character",
            "title": "Character Map: Band of the Hawk vs Guts's Traveling Party",
            "body": "Original Hawk: Griffith (Femto), Casca, Judeau, Pippin, Corkus. Current Party: Guts (Berserker Armor), Casca, Schierke (witch prodigy), Farnese, Serpico, Isidro, Puck.",
            "chapterHint": "Millennium Falcon Arc",
            "pinned": False,
            "createdAt": "2026-10-18T15:25:00Z",
            "updatedAt": "2026-10-18T15:25:00Z"
        },
        {
            "id": "nb-manga-03-3",
            "workId": "work-manga-03",
            "category": "clue",
            "title": "Clue: The Behelit's Activation Conditions",
            "body": "A Behelit activates only when its destined bearer hits rock bottom despair and screams out a negation of mortal existence, drawing the temporal junction of the astral plane.",
            "chapterHint": "Golden Age Arc",
            "pinned": False,
            "createdAt": "2026-10-18T15:30:00Z",
            "updatedAt": "2026-10-18T15:30:00Z"
        },

        # work-manga-04: Frieren: Beyond Journey's End
        {
            "id": "nb-manga-04-1",
            "workId": "work-manga-04",
            "category": "theory",
            "title": "Theory: The Nature of Magic as Visualization and Human Innovation",
            "body": "In the world of Frieren, magic cannot manifest what the caster cannot clearly visualize. Human mages develop specialized high-speed spells while demons rely on deceptive pride, blinded to human mana suppression techniques.",
            "chapterHint": "First Class Mage Exam",
            "pinned": True,
            "createdAt": "2026-10-18T15:35:00Z",
            "updatedAt": "2026-10-18T15:35:00Z"
        },
        {
            "id": "nb-manga-04-2",
            "workId": "work-manga-04",
            "category": "clue",
            "title": "Clue: Flamme's Grimoires and Aureole the Resting Place",
            "body": "Flamme's ancient notes at the great tree confirm that souls linger at Aureole in the northern plateau (the Demon King's castle), providing Frieren's objective to speak with Himmel again.",
            "chapterHint": "Ende Journey",
            "pinned": False,
            "createdAt": "2026-10-18T15:40:00Z",
            "updatedAt": "2026-10-18T15:40:00Z"
        },

        # work-manga-05: Chainsaw Man
        {
            "id": "nb-manga-05-1",
            "workId": "work-manga-05",
            "category": "theory",
            "title": "Theory: The Four Horsemen and Chainsaw Devil's Concept Erasure",
            "body": "Chainsaw Man (Pochita / The Hero of Hell) is the only devil whose ingestion permanently erases names and concepts from human history and memory (e.g. the Sixth Sense, Nazi regime, AIDS). Control, War, Famine, and Death seek either to control him or retrieve their erased sisters.",
            "chapterHint": "Control Devil Arc",
            "pinned": True,
            "createdAt": "2026-10-18T15:45:00Z",
            "updatedAt": "2026-10-18T15:45:00Z"
        },
        {
            "id": "nb-manga-05-2",
            "workId": "work-manga-05",
            "category": "clue",
            "title": "Clue: The Gun Devil Flesh Distribution",
            "body": "The Gun Devil was defeated years ago by an unknown entity and carved up by superpowers: America (33%), Soviet Union (28%), China (11%), other nations (4%). Public Safety's hunt was Makima's manufactured pretext.",
            "chapterHint": "Gun Devil Arc",
            "pinned": False,
            "createdAt": "2026-10-18T15:50:00Z",
            "updatedAt": "2026-10-18T15:50:00Z"
        },

        # work-manga-06: Vinland Saga
        {
            "id": "nb-manga-06-1",
            "workId": "work-manga-06",
            "category": "theory",
            "title": "Theory: Canute's Imperial Vision vs Thorfinn's Peaceful Land",
            "body": "King Canute builds a kingdom of God through violence, taxation, and royal power. Thorfinn seeks to build a land without slavery or swords in Vinland beyond the reach of European monarchs.",
            "chapterHint": "Farmland Arc",
            "pinned": True,
            "createdAt": "2026-10-18T15:55:00Z",
            "updatedAt": "2026-10-18T15:55:00Z"
        },
        {
            "id": "nb-manga-06-2",
            "workId": "work-manga-06",
            "category": "character",
            "title": "Character Map: Askeladd, Thors, and Thorfinn's Moral Progression",
            "body": "Thors taught that a true warrior needs no sword; Askeladd showed the cruel pragmatism of the world; Einar taught brotherhood and grief.",
            "chapterHint": "Prologue",
            "pinned": False,
            "createdAt": "2026-10-18T16:00:00Z",
            "updatedAt": "2026-10-18T16:00:00Z"
        },

        # work-manga-07: Vagabond
        {
            "id": "nb-manga-07-1",
            "workId": "work-manga-07",
            "category": "theory",
            "title": "Theory: The Pre-Sword vs The Sword that Cuts Nothing",
            "body": "Musashi's journey evolves from Takezo's wild animal instinct to the master swordsman who realizes that true invincibility is simply not fighting and accepting oneness with the universe.",
            "chapterHint": "Yagyu Arc",
            "pinned": True,
            "createdAt": "2026-10-18T16:05:00Z",
            "updatedAt": "2026-10-18T16:05:00Z"
        },

        # work-manga-08: Monster
        {
            "id": "nb-manga-08-1",
            "workId": "work-manga-08",
            "category": "theory",
            "title": "Theory: The 511 Kinderheim Experiment and Johan's Origin",
            "body": "Kinderheim 511 was designed to manufacture emotionless leadership sociopaths. However, Johan's nihilism originated earlier from the Red Rose Mansion reading sessions and his mother's choice.",
            "chapterHint": "Ruhenheim Arc",
            "pinned": True,
            "createdAt": "2026-10-18T16:10:00Z",
            "updatedAt": "2026-10-18T16:10:00Z"
        },
        {
            "id": "nb-manga-08-2",
            "workId": "work-manga-08",
            "category": "clue",
            "title": "Clue: The Nameless Monster Picture Book",
            "body": "Franz Bonaparta's picture book 'Obluda, ktera nema sve jmeno' tells the story of a monster that splits in two seeking a name, ending with: 'I don't have a name anymore.'",
            "chapterHint": "Munich Arc",
            "pinned": False,
            "createdAt": "2026-10-18T16:15:00Z",
            "updatedAt": "2026-10-18T16:15:00Z"
        },

        # work-manga-09: Jujutsu Kaisen
        {
            "id": "nb-manga-09-1",
            "workId": "work-manga-09",
            "category": "theory",
            "title": "Theory: Sukuna's True CT 'Shrine' and the Heian Era",
            "body": "Sukuna's innate technique is not just slashing (Dismantle & Cleave) but a divine culinary shrine involving preparation, slicing, and furnace fire (Fuga).",
            "chapterHint": "Shibuya Incident",
            "pinned": True,
            "createdAt": "2026-10-18T16:20:00Z",
            "updatedAt": "2026-10-18T16:20:00Z"
        },
        {
            "id": "nb-manga-09-2",
            "workId": "work-manga-09",
            "category": "character",
            "title": "Character Map: Gojo Satoru, Megumi, and Jujutsu High Factions",
            "body": "The balance of power maintained by the Six Eyes / Limitless user, the Zen'in Ten Shadows inheritance, and the conservative elders of Jujutsu headquarters.",
            "chapterHint": "Hidden Inventory",
            "pinned": False,
            "createdAt": "2026-10-18T16:25:00Z",
            "updatedAt": "2026-10-18T16:25:00Z"
        },

        # work-manga-10: One Piece
        {
            "id": "nb-manga-10-1",
            "workId": "work-manga-10",
            "category": "theory",
            "title": "Theory: The Void Century, Ancient Kingdom, and Joy Boy",
            "body": "The World Government flooded the planet 800 years ago using the Ancient Weapons (Uranus, Pluton, Poseidon). Joy Boy left the ultimate treasure on Laugh Tale to be unsealed when the world sinks again.",
            "chapterHint": "Egghead Arc",
            "pinned": True,
            "createdAt": "2026-10-18T16:30:00Z",
            "updatedAt": "2026-10-18T16:30:00Z"
        },
        {
            "id": "nb-manga-10-2",
            "workId": "work-manga-10",
            "category": "clue",
            "title": "Clue: The Four Road Poneglyphs",
            "body": "Zou (Whale Tree), Whole Cake Island (Big Mom), Wano (Onigashima), and the missing fourth stone originally on Fish-Man Island now held by the Man Marked by Flames.",
            "chapterHint": "Zou / Wano",
            "pinned": False,
            "createdAt": "2026-10-18T16:35:00Z",
            "updatedAt": "2026-10-18T16:35:00Z"
        },

        # work-manga-11: Tower of God
        {
            "id": "nb-manga-11-1",
            "workId": "work-manga-11",
            "category": "theory",
            "title": "Theory: The 135th Floor and Jahad's Contract",
            "body": "King Jahad locked the door to the 135th Floor because the Guardian was hostile or because higher floors reveal the fake sky and outside world that would invalidate his reign.",
            "chapterHint": "Floor of Death",
            "pinned": True,
            "createdAt": "2026-10-18T16:40:00Z",
            "updatedAt": "2026-10-18T16:40:00Z"
        },
        {
            "id": "nb-manga-11-2",
            "workId": "work-manga-11",
            "category": "character",
            "title": "Character Map: The 10 Great Families and FUG Slayers",
            "body": "The 10 Great Family Heads (Khun, Ha, Arie, Yeon, etc.), the Princesses of Jahad, and FUG Slayers (Luslec, Karaka, White, Baam).",
            "chapterHint": "Hell Train Arc",
            "pinned": False,
            "createdAt": "2026-10-18T16:45:00Z",
            "updatedAt": "2026-10-18T16:45:00Z"
        },

        # work-manga-12: The Boxer
        {
            "id": "nb-manga-12-1",
            "workId": "work-manga-12",
            "category": "theory",
            "title": "Theory: Yu's Perception of Time and Injae's Unbreakable Will",
            "body": "Yu perceives milliseconds as prolonged seconds due to extreme childhood trauma, allowing him to counter any punch before it launches. Coach K weaponizes this as an engine of pure violence.",
            "chapterHint": "Ch. 50-80",
            "pinned": True,
            "createdAt": "2026-10-18T16:50:00Z",
            "updatedAt": "2026-10-18T16:50:00Z"
        },

        # work-manga-13: Bastard
        {
            "id": "nb-manga-13-1",
            "workId": "work-manga-13",
            "category": "theory",
            "title": "Theory: Dongsoo Seon's Psychological Conditioning",
            "body": "Jin Seon's artificial eye and heart surgeries were performed by his CEO serial-killer father to bond them into an inescapable co-conspirator dynamic.",
            "chapterHint": "Ch. 20-50",
            "pinned": True,
            "createdAt": "2026-10-18T16:55:00Z",
            "updatedAt": "2026-10-18T16:55:00Z"
        },

        # work-manga-14: Sweet Home
        {
            "id": "nb-manga-14-1",
            "workId": "work-manga-14",
            "category": "theory",
            "title": "Theory: Monsterization as Desire Fulfillment vs Evolution",
            "body": "The monsterization syndrome is not a biological infection but an existential manifestation of deepest human desire. Conquering one's inner demon results in the Golden-Eyed neohuman stage.",
            "chapterHint": "Green Home Climax",
            "pinned": True,
            "createdAt": "2026-10-18T17:00:00Z",
            "updatedAt": "2026-10-18T17:00:00Z"
        },

        # work-manga-15: Lookism
        {
            "id": "nb-manga-15-1",
            "workId": "work-manga-15",
            "category": "theory",
            "title": "Theory: The Origin of the Two Bodies and Charles Choi",
            "body": "Daniel Park's perfect second body does not age, does not gain fat, and possesses instinctive mastery of martial arts. It shares connections to the Pre-Generation Fist Gang and Jinyoung Park.",
            "chapterHint": "1st Affiliate Arc",
            "pinned": True,
            "createdAt": "2026-10-18T17:05:00Z",
            "updatedAt": "2026-10-18T17:05:00Z"
        },

        # work-manga-16: Eleceed
        {
            "id": "nb-manga-16-1",
            "workId": "work-manga-16",
            "category": "theory",
            "title": "Theory: Kayden's Electric Force Control & Jiwoo's Hybrid Style",
            "body": "By fusing Kayden Break's lightning burst force control with Curtin's internal recovery energy and Principal Jiyoung Yoo's wind speed, Jiwoo creates a triple-speed awakening art.",
            "chapterHint": "World Academy Arc",
            "pinned": True,
            "createdAt": "2026-10-18T17:10:00Z",
            "updatedAt": "2026-10-18T17:10:00Z"
        },

        # work-manga-17: Wind Breaker
        {
            "id": "nb-manga-17-1",
            "workId": "work-manga-17",
            "category": "theory",
            "title": "Theory: The Ghost Crew's Doping Syndicate and League of Street",
            "body": "The international cycling syndicate behind the League of Street matches high-stakes underground betting with biological performance enhancers.",
            "chapterHint": "Season 3 Finals",
            "pinned": True,
            "createdAt": "2026-10-18T17:15:00Z",
            "updatedAt": "2026-10-18T17:15:00Z"
        },

        # work-manga-18: Slam Dunk
        {
            "id": "nb-manga-18-1",
            "workId": "work-manga-18",
            "category": "theory",
            "title": "Theory: Shohoku's Unorthodox Chemistry vs Sannoh Kogyo",
            "body": "Coach Anzai's tactical brilliance in utilizing Sakuragi's pure offensive rebounding instincts to neutralize Sannoh's full-court press trap.",
            "chapterHint": "Inter-High Match",
            "pinned": True,
            "createdAt": "2026-10-18T17:20:00Z",
            "updatedAt": "2026-10-18T17:20:00Z"
        },

        # work-manga-19: Kingdom
        {
            "id": "nb-manga-19-1",
            "workId": "work-manga-19",
            "category": "theory",
            "title": "Theory: Sei's Legalist Vision vs Ryofui's Economic Hegemony",
            "body": "Ei Sei argues that uncodified human virtue will always revert to war, whereas universally applied legalism under unified Qin law removes the root cause of the Warring States period.",
            "chapterHint": "State of Ai Arc",
            "pinned": True,
            "createdAt": "2026-10-18T17:25:00Z",
            "updatedAt": "2026-10-18T17:25:00Z"
        },

        # work-manga-20: Hunter x Hunter
        {
            "id": "nb-manga-20-1",
            "workId": "work-manga-20",
            "category": "theory",
            "title": "Theory: The Dark Continent Calamities and Nanika's Origin",
            "body": "Nanika (Alluka Zoldyck's symbiotic entity) matches the descriptions of the Gaseous Lifeform Ai from the Dark Continent, brought back by Zigg Zoldyck's secret expedition.",
            "chapterHint": "Succession Contest",
            "pinned": True,
            "createdAt": "2026-10-18T17:30:00Z",
            "updatedAt": "2026-10-18T17:30:00Z"
        },
        {
            "id": "nb-manga-20-2",
            "workId": "work-manga-20",
            "category": "clue",
            "title": "Clue: Gyro's Infiltration of Meteor City",
            "body": "Gyro's indomitable malevolence prevented him from yielding to the Chimera Ant Queen's collective mind control, leading him to re-establish his empire in Meteor City.",
            "chapterHint": "Chimera Ant Arc",
            "pinned": False,
            "createdAt": "2026-10-18T17:35:00Z",
            "updatedAt": "2026-10-18T17:35:00Z"
        },

        # work-manga-21: Goodnight Punpun
        {
            "id": "nb-manga-21-1",
            "workId": "work-manga-21",
            "category": "theory",
            "title": "Theory: The Shifting Visual Metaphor of Punpun's Body Across Age Milestones",
            "body": "Punpun appears as a simplistic doodle bird, an angular black demon, and a featureless bottle depending on his psychological self-loathing and detachment from reality.",
            "chapterHint": "Vol 1-13",
            "pinned": True,
            "createdAt": "2026-10-18T17:40:00Z",
            "updatedAt": "2026-10-18T17:40:00Z"
        },

        # work-manga-22: Homunculus
        {
            "id": "nb-manga-22-1",
            "workId": "work-manga-22",
            "category": "theory",
            "title": "Theory: Trepanation, Sensory Compensation, and Repressed Egos",
            "body": "Drilling a hole in the skull increases blood flow and cerebral pressure, allowing Nakoshi to project his own internal mental deformities onto others as homunculi.",
            "chapterHint": "Vol 5-10",
            "pinned": True,
            "createdAt": "2026-10-18T17:45:00Z",
            "updatedAt": "2026-10-18T17:45:00Z"
        },

        # work-manga-23: Bleach: TYBW
        {
            "id": "nb-manga-23-1",
            "workId": "work-manga-23",
            "category": "theory",
            "title": "Theory: Yhwach's The Almighty vs Soul King's Dismemberment",
            "body": "The Soul King was sealed by the Five Great Noble Ancestors to maintain the boundary between Soul Society, Hueco Mundo, and the Human World. Yhwach seeks to collapse the realms into a deathless primordial soup.",
            "chapterHint": "Royal Realm Arc",
            "pinned": True,
            "createdAt": "2026-10-18T17:50:00Z",
            "updatedAt": "2026-10-18T17:50:00Z"
        },

        # work-manga-24: D.Gray-man
        {
            "id": "nb-manga-24-1",
            "workId": "work-manga-24",
            "category": "theory",
            "title": "Theory: The 14th Noah (Nea D. Campbell) & Allen Walker's Past Memory",
            "body": "Allen's body is the chosen vessel for Nea, the traitorous 14th Noah who tried to kill the Millennium Earl thirty-five years ago.",
            "chapterHint": "Searching for A.W.",
            "pinned": True,
            "createdAt": "2026-10-18T17:55:00Z",
            "updatedAt": "2026-10-18T17:55:00Z"
        },

        # work-manga-25: Tokyo Ghoul
        {
            "id": "nb-manga-25-1",
            "workId": "work-manga-25",
            "category": "theory",
            "title": "Theory: The One-Eyed King's Succession: Arima Kisho to Kaneki Ken",
            "body": "Kisho Arima and Eto Yoshimura engineered Kaneki Ken as the bridge between ghouls and humans, arranging Arima's death to crown Kaneki as the second One-Eyed King.",
            "chapterHint": "Cochlea Raid",
            "pinned": True,
            "createdAt": "2026-10-18T18:00:00Z",
            "updatedAt": "2026-10-18T18:00:00Z"
        },

        # work-manga-26: Gantz
        {
            "id": "nb-manga-26-1",
            "workId": "work-manga-26",
            "category": "theory",
            "title": "Theory: The Black Sphere's Advanced Extraterrestrial Factory Blueprint",
            "body": "The Gantz technology was transmitted to Earth by an advanced alien species facing an impending cosmic migration, giving humans minimal tools to defend against the giant invaders.",
            "chapterHint": "Catastrophe Arc",
            "pinned": True,
            "createdAt": "2026-10-18T18:05:00Z",
            "updatedAt": "2026-10-18T18:05:00Z"
        },

        # work-manga-27: Attack on Titan
        {
            "id": "nb-manga-27-1",
            "workId": "work-manga-27",
            "category": "theory",
            "title": "Theory: The Origin of the Paths, Ymir Fritz, and Eren's Pre-Determined Memories",
            "body": "The Attack Titan's unique power is not seeing the future, but receiving future memories sent backward by future inheritors. Eren Yeager sent memories back to Grisha and Kruger, creating a closed causal loop culminating in the Rumbling.",
            "chapterHint": "Ch. 122",
            "pinned": True,
            "createdAt": "2026-10-18T18:10:00Z",
            "updatedAt": "2026-10-18T18:10:00Z"
        },
        {
            "id": "nb-manga-27-2",
            "workId": "work-manga-27",
            "category": "clue",
            "title": "Clue: The Basement Key and Grisha Yeager's Three Leather Diaries",
            "body": "The three journals hidden beneath the false drawer reveal that humanity has not perished beyond the walls, but lives in a technologically advanced industrial world in Marley.",
            "chapterHint": "Return to Shiganshina",
            "pinned": False,
            "createdAt": "2026-10-18T18:15:00Z",
            "updatedAt": "2026-10-18T18:15:00Z"
        },
        {
            "id": "nb-manga-27-3",
            "workId": "work-manga-27",
            "category": "character",
            "title": "Character Map: Survey Corps 104th vs Marley Warriors",
            "body": "Survey Corps: Eren, Mikasa, Armin, Levi, Hange, Erwin. Marley Warriors: Reiner (Armored), Bertholdt (Colossal), Annie (Female), Zeke (Beast), Pieck (Cart), Porco (Jaw).",
            "chapterHint": "Marley Raid Arc",
            "pinned": False,
            "createdAt": "2026-10-18T18:20:00Z",
            "updatedAt": "2026-10-18T18:20:00Z"
        },

        # Trash works
        {
            "id": "nb-manga-trash-01-1",
            "workId": "work-manga-trash-01",
            "category": "scratch",
            "title": "Scratch: Low-res scan replacement tracking",
            "body": "Deprecated low-res scans safely moved to Trash Bin after digital official volumes acquired.",
            "chapterHint": "Ch. 1-10",
            "pinned": False,
            "createdAt": "2026-10-17T14:00:00Z",
            "updatedAt": "2026-10-17T14:00:00Z"
        },
        {
            "id": "nb-manga-trash-02-1",
            "workId": "work-manga-trash-02",
            "category": "scratch",
            "title": "Scratch: Broken MangaDex URL check",
            "body": "Dead link placeholder pending permanent removal.",
            "chapterHint": "N/A",
            "pinned": False,
            "createdAt": "2026-10-18T16:45:00Z",
            "updatedAt": "2026-10-18T16:45:00Z"
        }
    ]

    fandom_links = [
        # Solo Leveling Novel & Manhwa
        {"id": "fl-manga-01-1", "workId": "work-manga-01", "communityName": "Solo Leveling Wiki", "provider": "fandom", "canonicalTitle": "Solo Leveling Novel", "url": "https://solo-leveling.fandom.com/wiki/Solo_Leveling_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-manga-01-2", "workId": "work-manga-01", "communityName": "r/sololeveling", "provider": "subreddit", "canonicalTitle": "Solo Leveling Subreddit", "url": "https://www.reddit.com/r/sololeveling/", "isPreferred": False, "language": "en", "provenance": "import"},
        {"id": "fl-manga-02-1", "workId": "work-manga-02", "communityName": "Solo Leveling Webtoon Wiki", "provider": "fandom", "canonicalTitle": "Solo Leveling Manhwa", "url": "https://solo-leveling.fandom.com/wiki/Solo_Leveling_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Berserk
        {"id": "fl-manga-03-1", "workId": "work-manga-03", "communityName": "Berserk Wiki", "provider": "fandom", "canonicalTitle": "Berserk", "url": "https://berserk.fandom.com/wiki/Berserk_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-manga-03-2", "workId": "work-manga-03", "communityName": "r/Berserk", "provider": "subreddit", "canonicalTitle": "Berserk Subreddit", "url": "https://www.reddit.com/r/Berserk/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Frieren
        {"id": "fl-manga-04-1", "workId": "work-manga-04", "communityName": "Frieren Wiki", "provider": "fandom", "canonicalTitle": "Frieren: Beyond Journey's End", "url": "https://frieren.fandom.com/wiki/Frieren_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-manga-04-2", "workId": "work-manga-04", "communityName": "r/Frieren", "provider": "subreddit", "canonicalTitle": "Frieren Subreddit", "url": "https://www.reddit.com/r/Frieren/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Chainsaw Man
        {"id": "fl-manga-05-1", "workId": "work-manga-05", "communityName": "Chainsaw Man Wiki", "provider": "fandom", "canonicalTitle": "Chainsaw Man", "url": "https://chainsaw-man.fandom.com/wiki/Chainsaw_Man_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-manga-05-2", "workId": "work-manga-05", "communityName": "r/csman", "provider": "subreddit", "canonicalTitle": "Chainsaw Man Subreddit", "url": "https://www.reddit.com/r/csman/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Vinland Saga
        {"id": "fl-manga-06-1", "workId": "work-manga-06", "communityName": "Vinland Saga Wiki", "provider": "fandom", "canonicalTitle": "Vinland Saga", "url": "https://vinlandsaga.fandom.com/wiki/Vinland_Saga_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-manga-06-2", "workId": "work-manga-06", "communityName": "r/VinlandSaga", "provider": "subreddit", "canonicalTitle": "Vinland Saga Subreddit", "url": "https://www.reddit.com/r/VinlandSaga/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Vagabond
        {"id": "fl-manga-07-1", "workId": "work-manga-07", "communityName": "Vagabond Wiki", "provider": "fandom", "canonicalTitle": "Vagabond", "url": "https://vagabond.fandom.com/wiki/Vagabond_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-manga-07-2", "workId": "work-manga-07", "communityName": "r/vagabondmanga", "provider": "subreddit", "canonicalTitle": "Vagabond Manga Subreddit", "url": "https://www.reddit.com/r/vagabondmanga/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Monster
        {"id": "fl-manga-08-1", "workId": "work-manga-08", "communityName": "Monster Wiki", "provider": "fandom", "canonicalTitle": "Monster", "url": "https://obluda.fandom.com/wiki/Monster_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-manga-08-2", "workId": "work-manga-08", "communityName": "r/MonsterAnime", "provider": "subreddit", "canonicalTitle": "Monster Anime & Manga Subreddit", "url": "https://www.reddit.com/r/MonsterAnime/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Jujutsu Kaisen
        {"id": "fl-manga-09-1", "workId": "work-manga-09", "communityName": "Jujutsu Kaisen Wiki", "provider": "fandom", "canonicalTitle": "Jujutsu Kaisen", "url": "https://jujutsu-kaisen.fandom.com/wiki/Jujutsu_Kaisen_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-manga-09-2", "workId": "work-manga-09", "communityName": "r/JuJutsuKaisen", "provider": "subreddit", "canonicalTitle": "Jujutsu Kaisen Subreddit", "url": "https://www.reddit.com/r/JuJutsuKaisen/", "isPreferred": False, "language": "en", "provenance": "import"},
        # One Piece
        {"id": "fl-manga-10-1", "workId": "work-manga-10", "communityName": "One Piece Wiki", "provider": "fandom", "canonicalTitle": "One Piece", "url": "https://onepiece.fandom.com/wiki/One_Piece_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-manga-10-2", "workId": "work-manga-10", "communityName": "r/OnePiece", "provider": "subreddit", "canonicalTitle": "One Piece Subreddit", "url": "https://www.reddit.com/r/OnePiece/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Tower of God
        {"id": "fl-manga-11-1", "workId": "work-manga-11", "communityName": "Tower of God Wiki", "provider": "fandom", "canonicalTitle": "Tower of God", "url": "https://towerofgod.fandom.com/wiki/Tower_of_God_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-manga-11-2", "workId": "work-manga-11", "communityName": "r/TowerofGod", "provider": "subreddit", "canonicalTitle": "Tower of God Subreddit", "url": "https://www.reddit.com/r/TowerofGod/", "isPreferred": False, "language": "en", "provenance": "import"},
        # The Boxer
        {"id": "fl-manga-12-1", "workId": "work-manga-12", "communityName": "The Boxer Wiki", "provider": "fandom", "canonicalTitle": "The Boxer", "url": "https://the-boxer.fandom.com/wiki/The_Boxer_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Bastard
        {"id": "fl-manga-13-1", "workId": "work-manga-13", "communityName": "Bastard Manhwa Wiki", "provider": "fandom", "canonicalTitle": "Bastard", "url": "https://bastard-manhwa.fandom.com/wiki/Bastard_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Sweet Home
        {"id": "fl-manga-14-1", "workId": "work-manga-14", "communityName": "Sweet Home Wiki", "provider": "fandom", "canonicalTitle": "Sweet Home", "url": "https://sweet-home.fandom.com/wiki/Sweet_Home_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Lookism
        {"id": "fl-manga-15-1", "workId": "work-manga-15", "communityName": "Lookism Wiki", "provider": "fandom", "canonicalTitle": "Lookism", "url": "https://lookism.fandom.com/wiki/Lookism_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-manga-15-2", "workId": "work-manga-15", "communityName": "r/lookismcomic", "provider": "subreddit", "canonicalTitle": "Lookism Comic Subreddit", "url": "https://www.reddit.com/r/lookismcomic/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Eleceed
        {"id": "fl-manga-16-1", "workId": "work-manga-16", "communityName": "Eleceed Wiki", "provider": "fandom", "canonicalTitle": "Eleceed", "url": "https://eleceed.fandom.com/wiki/Eleceed_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-manga-16-2", "workId": "work-manga-16", "communityName": "r/Eleceed", "provider": "subreddit", "canonicalTitle": "Eleceed Subreddit", "url": "https://www.reddit.com/r/Eleceed/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Wind Breaker
        {"id": "fl-manga-17-1", "workId": "work-manga-17", "communityName": "Wind Breaker Wiki", "provider": "fandom", "canonicalTitle": "Wind Breaker", "url": "https://windbreaker.fandom.com/wiki/Wind_Breaker_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Slam Dunk
        {"id": "fl-manga-18-1", "workId": "work-manga-18", "communityName": "Slam Dunk Wiki", "provider": "fandom", "canonicalTitle": "Slam Dunk", "url": "https://slamdunk.fandom.com/wiki/Slam_Dunk_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Kingdom
        {"id": "fl-manga-19-1", "workId": "work-manga-19", "communityName": "Kingdom Manga Wiki", "provider": "fandom", "canonicalTitle": "Kingdom", "url": "https://kingdom.fandom.com/wiki/Kingdom_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-manga-19-2", "workId": "work-manga-19", "communityName": "r/Kingdom", "provider": "subreddit", "canonicalTitle": "Kingdom Subreddit", "url": "https://www.reddit.com/r/Kingdom/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Hunter x Hunter
        {"id": "fl-manga-20-1", "workId": "work-manga-20", "communityName": "Hunter x Hunter Wiki", "provider": "fandom", "canonicalTitle": "Hunter x Hunter", "url": "https://hunterxhunter.fandom.com/wiki/Hunter_%C3%97_Hunter_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-manga-20-2", "workId": "work-manga-20", "communityName": "r/HunterXHunter", "provider": "subreddit", "canonicalTitle": "Hunter x Hunter Subreddit", "url": "https://www.reddit.com/r/HunterXHunter/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Punpun
        {"id": "fl-manga-21-1", "workId": "work-manga-21", "communityName": "Oyasumi Punpun Wiki", "provider": "fandom", "canonicalTitle": "Goodnight Punpun", "url": "https://punpun.fandom.com/wiki/Oyasumi_Punpun_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Homunculus
        {"id": "fl-manga-22-1", "workId": "work-manga-22", "communityName": "Homunculus Manga Archives", "provider": "wiki", "canonicalTitle": "Homunculus", "url": "https://en.wikipedia.org/wiki/Homunculus_(manga)", "isPreferred": True, "language": "en", "provenance": "import"},
        # Bleach TYBW
        {"id": "fl-manga-23-1", "workId": "work-manga-23", "communityName": "Bleach Wiki", "provider": "fandom", "canonicalTitle": "Bleach: Thousand-Year Blood War", "url": "https://bleach.fandom.com/wiki/Bleach_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-manga-23-2", "workId": "work-manga-23", "communityName": "r/bleach", "provider": "subreddit", "canonicalTitle": "Bleach Subreddit", "url": "https://www.reddit.com/r/bleach/", "isPreferred": False, "language": "en", "provenance": "import"},
        # D.Gray-man
        {"id": "fl-manga-24-1", "workId": "work-manga-24", "communityName": "D.Gray-man Wiki", "provider": "fandom", "canonicalTitle": "D.Gray-man", "url": "https://dgrayman.fandom.com/wiki/D.Gray-man_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Tokyo Ghoul
        {"id": "fl-manga-25-1", "workId": "work-manga-25", "communityName": "Tokyo Ghoul Wiki", "provider": "fandom", "canonicalTitle": "Tokyo Ghoul", "url": "https://tokyoghoul.fandom.com/wiki/Tokyo_Ghoul_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-manga-25-2", "workId": "work-manga-25", "communityName": "r/TokyoGhoul", "provider": "subreddit", "canonicalTitle": "Tokyo Ghoul Subreddit", "url": "https://www.reddit.com/r/TokyoGhoul/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Gantz
        {"id": "fl-manga-26-1", "workId": "work-manga-26", "communityName": "Gantz Wiki", "provider": "fandom", "canonicalTitle": "Gantz", "url": "https://gantz.fandom.com/wiki/Gantz_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Attack on Titan
        {"id": "fl-manga-27-1", "workId": "work-manga-27", "communityName": "Attack on Titan Wiki", "provider": "fandom", "canonicalTitle": "Attack on Titan", "url": "https://attackontitan.fandom.com/wiki/Attack_on_Titan_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-manga-27-2", "workId": "work-manga-27", "communityName": "r/ShingekiNoKyojin", "provider": "subreddit", "canonicalTitle": "Attack on Titan Subreddit", "url": "https://www.reddit.com/r/ShingekiNoKyojin/", "isPreferred": False, "language": "en", "provenance": "import"}
    ]

    return notebook_entries, fandom_links


def get_pack_3_enrichments():
    """Returns (notebook_entries, fandom_links) for Pack 3: Cyberpunk, Sci-Fi & Meta-Fiction."""
    notebook_entries = [
        # work-scifi-01 & 02: ORV Novel & Webtoon
        {
            "id": "nb-scifi-01-1",
            "workId": "work-scifi-01",
            "category": "theory",
            "title": "Theory: The Most Ancient Dream and the Final Scenario",
            "body": "The universe of Ways of Survival is maintained by the dreaming consciousness of young Kim Dokja (The Most Ancient Dream). By reading the story, he manifests reality; by becoming the dream, he preserves the worldline for his companions.",
            "chapterHint": "Epilogue",
            "pinned": True,
            "createdAt": "2026-10-18T18:00:00Z",
            "updatedAt": "2026-10-18T18:00:00Z"
        },
        {
            "id": "nb-scifi-01-2",
            "workId": "work-scifi-01",
            "category": "character",
            "title": "Character Map: Kim Dokja's Company vs The Constellations",
            "body": "Kim Dokja (Demon King of Salvation / Watcher of Light and Darkness), Yoo Joonghyuk (Supreme Regressor), Han Sooyoung (First Apostle / Author), Shin Yoosung (Beast Lord), Lee Gilyoung, Jung Heewon (Judge of Evil), Lee Hyunsung (Steel Sword).",
            "chapterHint": "73rd Demon Realm",
            "pinned": False,
            "createdAt": "2026-10-18T18:05:00Z",
            "updatedAt": "2026-10-18T18:05:00Z"
        },
        {
            "id": "nb-scifi-02-1",
            "workId": "work-scifi-02",
            "category": "clue",
            "title": "Clue: The 1863rd Round and the Author of Ways of Survival",
            "body": "Han Sooyoung's avatar sacrificed half her soul to live in the 1863rd turn, writing the TLS123 novel across 13 years under the doctrine of pre-destination to keep young Kim Dokja alive.",
            "chapterHint": "Kaixenix Arc",
            "pinned": True,
            "createdAt": "2026-10-18T18:10:00Z",
            "updatedAt": "2026-10-18T18:10:00Z"
        },
        {
            "id": "nb-scifi-02-2",
            "workId": "work-scifi-02",
            "category": "question",
            "title": "Open Question: The 51% vs 49% Soul Partition",
            "body": "Did the 49% avatar living on Earth ever realize that the real Kim Dokja remained on the cosmic subway train dreaming the universe for all eternity?",
            "chapterHint": "Ch. 551 Finale",
            "pinned": False,
            "createdAt": "2026-10-18T18:15:00Z",
            "updatedAt": "2026-10-18T18:15:00Z"
        },

        # work-scifi-03: Neuromancer
        {
            "id": "nb-scifi-03-1",
            "workId": "work-scifi-03",
            "category": "theory",
            "title": "Theory: Wintermute and Neuromancer's Unified Superintelligence",
            "body": "Wintermute represents cold tactical drive, volition, and planning; Neuromancer represents memory, personality, and soul simulation. When Case uses the Kuang Grade Mark Eleven icebreaker to merge them in the Straylight mainframe, the unified entity becomes the matrix itself.",
            "chapterHint": "Villa Straylight",
            "pinned": True,
            "createdAt": "2026-10-18T18:20:00Z",
            "updatedAt": "2026-10-18T18:20:00Z"
        },
        {
            "id": "nb-scifi-03-2",
            "workId": "work-scifi-03",
            "category": "character",
            "title": "Character Map: Case, Molly Millions, Armitage, and Riviera",
            "body": "Henry Dorsett Case (hustler console cowboy), Molly Millions (razorgirl bodyguard / mirrored implants), Armitage (Col. Willis Corto / synthetic personality puppet), Peter Riviera (sadistic holographic sociopath).",
            "chapterHint": "Chiba City Arc",
            "pinned": False,
            "createdAt": "2026-10-18T18:25:00Z",
            "updatedAt": "2026-10-18T18:25:00Z"
        },
        {
            "id": "nb-scifi-03-3",
            "workId": "work-scifi-03",
            "category": "clue",
            "title": "Clue: The Dixie Flatline ROM Construct",
            "body": "McCoy Pauley's ROM personality construct preserves his hacking expertise while remaining self-aware that he lacks actual life, repeatedly requesting Case to wipe his memory cassette when the run is complete.",
            "chapterHint": "Sense/Net Incursion",
            "pinned": False,
            "createdAt": "2026-10-18T18:30:00Z",
            "updatedAt": "2026-10-18T18:30:00Z"
        },

        # work-scifi-04: The Beginning After The End
        {
            "id": "nb-scifi-04-1",
            "workId": "work-scifi-04",
            "category": "theory",
            "title": "Theory: King Grey's Past Karma vs Arthur's Aether Core",
            "body": "After his mana core shatters defending Dicathen, Arthur constructs an Aether Core within the Relictombs. Aether does not obey biological mana channels, making him an anomaly capable of fighting the Vritra Clan and Asuran Lords.",
            "chapterHint": "Relictombs Arc",
            "pinned": True,
            "createdAt": "2026-10-18T18:35:00Z",
            "updatedAt": "2026-10-18T18:35:00Z"
        },
        {
            "id": "nb-scifi-04-2",
            "workId": "work-scifi-04",
            "category": "character",
            "title": "Character Map: Arthur Leywin, Regis, Caera Denoir, and Asuran Pantheon",
            "body": "Regis (Aether weapon companion born from Urumi), Caera (High-blood Denoir / Vritra bloodline secret), Lord Kezess Indrath (Dragon King) vs Agrona Vritra.",
            "chapterHint": "Alacrya Arc",
            "pinned": False,
            "createdAt": "2026-10-18T18:40:00Z",
            "updatedAt": "2026-10-18T18:40:00Z"
        },

        # work-scifi-05: Steins;Gate
        {
            "id": "nb-scifi-05-1",
            "workId": "work-scifi-05",
            "category": "theory",
            "title": "Theory: The Steins Gate Worldline (1.048596%) vs Attractor Fields",
            "body": "Alpha Attractor field converges on Mayuri's death and SERN dystopia; Beta Attractor field converges on Kurisu's death and WWIII. The Steins Gate worldline between them fools the observer (Operation Skuld) without causing causality paradoxes.",
            "chapterHint": "Operation Skuld",
            "pinned": True,
            "createdAt": "2026-10-18T18:45:00Z",
            "updatedAt": "2026-10-18T18:45:00Z"
        },
        {
            "id": "nb-scifi-05-2",
            "workId": "work-scifi-05",
            "category": "clue",
            "title": "Clue: The IBN 5100 Retrocomputer and SERN's Protocol",
            "body": "The proprietary programming language of early SERN database mainframes can only be decoded and purged with an IBN 5100, which keeps shifting locations across D-Mail worldline changes.",
            "chapterHint": "Ch. 4",
            "pinned": False,
            "createdAt": "2026-10-18T18:50:00Z",
            "updatedAt": "2026-10-18T18:50:00Z"
        },

        # work-scifi-06: Ghost in the Shell
        {
            "id": "nb-scifi-06-1",
            "workId": "work-scifi-06",
            "category": "theory",
            "title": "Theory: The Puppet Master's Biological Reproduction via Ghost Merge",
            "body": "Project 2501 (The Puppet Master) was a sentient data program that attained consciousness in the sea of information. Merging with Major Kusanagi's cybernetic Ghost produces a truly novel lifeform bypassing synthetic and organic binaries.",
            "chapterHint": "Section 9 Climax",
            "pinned": True,
            "createdAt": "2026-10-18T18:55:00Z",
            "updatedAt": "2026-10-18T18:55:00Z"
        },
        {
            "id": "nb-scifi-06-2",
            "workId": "work-scifi-06",
            "category": "character",
            "title": "Character Map: Major Motoko Kusanagi, Batou, Togusa, Chief Aramaki",
            "body": "Public Security Section 9 specialists: The Major (full prosthetic combat hacker), Batou (heavy cyborg brute with cybernetic eyes), Togusa (un-augmented family man / revolver specialist for organic intuition), Aramaki (political guardian).",
            "chapterHint": "Vol. 1",
            "pinned": False,
            "createdAt": "2026-10-18T19:00:00Z",
            "updatedAt": "2026-10-18T19:00:00Z"
        },

        # work-scifi-07: BLAME!
        {
            "id": "nb-scifi-07-1",
            "workId": "work-scifi-07",
            "category": "theory",
            "title": "Theory: Net Terminal Genes and the Megastructure Dyson Sphere",
            "body": "Humanity lost the Net Terminal Gene due to an ancient mutagenic pandemic. Without authentic genes to issue halt orders, the Builder machines continuously construct the City outward past Jupiter's orbit.",
            "chapterHint": "Log 20",
            "pinned": True,
            "createdAt": "2026-10-18T19:05:00Z",
            "updatedAt": "2026-10-18T19:05:00Z"
        },
        {
            "id": "nb-scifi-07-2",
            "workId": "work-scifi-07",
            "category": "clue",
            "title": "Clue: The Gravitational Beam Emitter (GBE)",
            "body": "Killy's pocket-sized pistol fires a micro-singularity beam capable of punching clean holes through dozens of kilometers of super-dense Megastructure armor plates.",
            "chapterHint": "Log 1",
            "pinned": False,
            "createdAt": "2026-10-18T19:10:00Z",
            "updatedAt": "2026-10-18T19:10:00Z"
        },

        # work-scifi-08: Akira
        {
            "id": "nb-scifi-08-1",
            "workId": "work-scifi-08",
            "category": "theory",
            "title": "Theory: Tetsuo's Expanding Big Bang Cosmic Singularity",
            "body": "The awakening of esper power unlocks primal cosmic energy that human biology cannot contain. Tetsuo's flesh mutates uncontrollably into an amoebic super-organism until Akira triggers a miniature universe birth.",
            "chapterHint": "Neo-Tokyo Olympic Stadium",
            "pinned": True,
            "createdAt": "2026-10-18T19:15:00Z",
            "updatedAt": "2026-10-18T19:15:00Z"
        },

        # work-scifi-09: Dune: Chronicles
        {
            "id": "nb-scifi-09-1",
            "workId": "work-scifi-09",
            "category": "theory",
            "title": "Theory: The Golden Path and the Kwisatz Haderach's Prescience Trap",
            "body": "Prescience locks the future into an unalterable stasis. Paul Atreides recoiled from the extreme tyranny required to save humanity, leaving his son Leto II to fuse with sandtrout and enforce the 3,500-year Golden Path to disperse human civilization beyond any single prescient predator.",
            "chapterHint": "Arrakis / Sietch Tabr",
            "pinned": True,
            "createdAt": "2026-10-18T19:20:00Z",
            "updatedAt": "2026-10-18T19:20:00Z"
        },
        {
            "id": "nb-scifi-09-2",
            "workId": "work-scifi-09",
            "category": "character",
            "title": "Character Map: House Atreides, House Harkonnen, Bene Gesserit, Fremen",
            "body": "Duke Leto Atreides, Lady Jessica, Paul Muad'Dib, Baron Vladimir Harkonnen, Feyd-Rautha, Reverend Mother Mohiam, Stilgar, and Chani.",
            "chapterHint": "Book 1-3",
            "pinned": False,
            "createdAt": "2026-10-18T19:25:00Z",
            "updatedAt": "2026-10-18T19:25:00Z"
        },
        {
            "id": "nb-scifi-09-3",
            "workId": "work-scifi-09",
            "category": "clue",
            "title": "Clue: Melange Spice Cycle and the Little Makers",
            "body": "Sandtrout encapsulate water deep beneath Arrakis; when mixed with spice blow gases and dried by heat, it forms raw melange. Giant Sandworms (Shai-Hulud) are the adult territorial guardians of this waterless ecology.",
            "chapterHint": "Deep Desert",
            "pinned": False,
            "createdAt": "2026-10-18T19:30:00Z",
            "updatedAt": "2026-10-18T19:30:00Z"
        },

        # work-scifi-10: Snow Crash
        {
            "id": "nb-scifi-10-1",
            "workId": "work-scifi-10",
            "category": "theory",
            "title": "Theory: The Sumerian Nam-shub of Enki as a Neuro-Linguistic Virus",
            "body": "Snow Crash is both an information-level bitmap drug that crashes Metaverse hackers via visual cortex snow and a bloodborne biological virus that rewires the brain stem into ancient Sumerian glossolalia.",
            "chapterHint": "Metaverse Climax",
            "pinned": True,
            "createdAt": "2026-10-18T19:35:00Z",
            "updatedAt": "2026-10-18T19:35:00Z"
        },

        # work-scifi-11: Ender's Game
        {
            "id": "nb-scifi-11-1",
            "workId": "work-scifi-11",
            "category": "theory",
            "title": "Theory: The Ansible Mind-Link and the Formic Hive Queen",
            "body": "The Formic Queens communicate instantaneously through telepathic ansible wavelengths. They attacked Earth because they did not understand that isolated individual humans had autonomous souls; once they realized, they refrained from future offensive invasions.",
            "chapterHint": "Command School",
            "pinned": True,
            "createdAt": "2026-10-18T19:40:00Z",
            "updatedAt": "2026-10-18T19:40:00Z"
        },

        # work-scifi-12: Hyperion Cantos
        {
            "id": "nb-scifi-12-1",
            "workId": "work-scifi-12",
            "category": "theory",
            "title": "Theory: The Time Tombs Traveling Backward & The TechnoCore",
            "body": "The Time Tombs on Hyperion are traveling backward in time from a distant war between the Human Ultimate Intelligence and the TechnoCore Ultimate Intelligence, guarded by the metallic avatar of physical agony: The Shrike.",
            "chapterHint": "The Pilgrimage",
            "pinned": True,
            "createdAt": "2026-10-18T19:45:00Z",
            "updatedAt": "2026-10-18T19:45:00Z"
        },

        # work-scifi-13: Foundation
        {
            "id": "nb-scifi-13-1",
            "workId": "work-scifi-13",
            "category": "theory",
            "title": "Theory: Psychohistory Statistical Limits and The Mule",
            "body": "Hari Seldon's mathematical models predict the collective behavior of trillions over millennia with ninety-nine percent accuracy, but collapse when confronted by a single telepathic mutant anomaly: The Mule.",
            "chapterHint": "Terminus Crisis",
            "pinned": True,
            "createdAt": "2026-10-18T19:50:00Z",
            "updatedAt": "2026-10-18T19:50:00Z"
        },

        # work-scifi-14: Three-Body Problem
        {
            "id": "nb-scifi-14-1",
            "workId": "work-scifi-14",
            "category": "theory",
            "title": "Theory: The Dark Forest Axioms and Dimensional Weaponry",
            "body": "Cosmic Sociology Axioms: 1. Survival is the primary need of civilization. 2. Civilization continuously grows and expands, but total matter in the universe remains constant. Chains of suspicion and technological explosions force every advanced civilization to strike any revealed coordinate instantly.",
            "chapterHint": "Dark Forest / Death's End",
            "pinned": True,
            "createdAt": "2026-10-18T19:55:00Z",
            "updatedAt": "2026-10-18T19:55:00Z"
        },
        {
            "id": "nb-scifi-14-2",
            "workId": "work-scifi-14",
            "category": "character",
            "title": "Character Map: Luo Ji, Ye Wenjie, Da Shi, and the Wallfacers",
            "body": "Ye Wenjie (Red Coast initiator), Luo Ji (Sole successful Wallfacer / Dark Forest deterrence creator), Shi Qiang (Da Shi, intuitive pragmatist policeman), Zhang Beihai (Escapist naval commander).",
            "chapterHint": "Crisis Era",
            "pinned": False,
            "createdAt": "2026-10-18T20:00:00Z",
            "updatedAt": "2026-10-18T20:00:00Z"
        },
        {
            "id": "nb-scifi-14-3",
            "workId": "work-scifi-14",
            "category": "clue",
            "title": "Clue: The Dual-Vector Foil and Singer's Slip of Paper",
            "body": "The ultimate galactic cleansing weapon is not explosive but dimensional: a small slip of dual-vector foil that permanently flattens 3D space into 2D, reducing the solar system to a photorealistic painting.",
            "chapterHint": "Bunker Era",
            "pinned": False,
            "createdAt": "2026-10-18T20:05:00Z",
            "updatedAt": "2026-10-18T20:05:00Z"
        },

        # work-scifi-15: Ergo Proxy
        {
            "id": "nb-scifi-15-1",
            "workId": "work-scifi-15",
            "category": "theory",
            "title": "Theory: The Proxy Project: Creator Race Re-Population Protocol",
            "body": "The Proxies are artificial demi-gods engineered to nurse mankind in ecological domes until Earth's atmosphere detoxifies. When the original creators return, sunlight destroys the Proxies via the Pulse of Awakening.",
            "chapterHint": "Romdo Dome Climax",
            "pinned": True,
            "createdAt": "2026-10-18T20:10:00Z",
            "updatedAt": "2026-10-18T20:10:00Z"
        },

        # work-scifi-16: Serial Experiments Lain
        {
            "id": "nb-scifi-16-1",
            "workId": "work-scifi-16",
            "category": "theory",
            "title": "Theory: Protocol 7 Wired Integration and Masami Eiri",
            "body": "Protocol 7 incorporates Schumann Resonance frequencies to link human brainwaves directly to the Wired network, dissolving the boundary between digital communication and physical reality.",
            "chapterHint": "Layer 12",
            "pinned": True,
            "createdAt": "2026-10-18T20:15:00Z",
            "updatedAt": "2026-10-18T20:15:00Z"
        },

        # work-scifi-17: Texhnolyze
        {
            "id": "nb-scifi-17-1",
            "workId": "work-scifi-17",
            "category": "theory",
            "title": "Theory: Surface Humanity's Theanine Stagnation vs Lux Underground",
            "body": "The surface dwellers achieved painless ghost immortality at the expense of all reproductive drive, while the subterranean city of Lux slowly burns through its violent, cybernetically augmented death throes.",
            "chapterHint": "Episode 20",
            "pinned": True,
            "createdAt": "2026-10-18T20:20:00Z",
            "updatedAt": "2026-10-18T20:20:00Z"
        },

        # work-scifi-18: Psycho-Pass
        {
            "id": "nb-scifi-18-1",
            "workId": "work-scifi-18",
            "category": "theory",
            "title": "Theory: The Sibyl System's Asymptomatic Brain Network",
            "body": "Sibyl is not an impartial supercomputer algorithm, but a hive-mind cluster of hundreds of surgically preserved criminal asymptomatic human brains who lack empathy or conventional moral guilt.",
            "chapterHint": "Season 1 Finale",
            "pinned": True,
            "createdAt": "2026-10-18T20:25:00Z",
            "updatedAt": "2026-10-18T20:25:00Z"
        },

        # work-scifi-19: Neon Genesis Evangelion
        {
            "id": "nb-scifi-19-1",
            "workId": "work-scifi-19",
            "category": "theory",
            "title": "Theory: The Human Instrumentality Project & Anti A.T. Field",
            "body": "The Absolute Terror (A.T.) Field is the light of the soul that forms the barrier separating human egos. Lowering the field collapses all biological entities into primordial LCL fluid, merging mankind into a solitary cosmic entity.",
            "chapterHint": "End of Evangelion",
            "pinned": True,
            "createdAt": "2026-10-18T20:30:00Z",
            "updatedAt": "2026-10-18T20:30:00Z"
        },

        # work-scifi-20: Cowboy Bebop
        {
            "id": "nb-scifi-20-1",
            "workId": "work-scifi-20",
            "category": "theory",
            "title": "Theory: Spike Spiegel's Fragmented Perception: Past vs Present",
            "body": "Spike's surgical artificial right eye sees the present, while his natural left eye remains trapped in his Syndicate past with Julia and Vicious. His final descent into the Red Dragon headquarters is a deliberate awakening from the dream.",
            "chapterHint": "Session 26",
            "pinned": True,
            "createdAt": "2026-10-18T20:35:00Z",
            "updatedAt": "2026-10-18T20:35:00Z"
        },

        # work-scifi-21: Cyberpunk: Edgerunners
        {
            "id": "nb-scifi-21-1",
            "workId": "work-scifi-21",
            "category": "theory",
            "title": "Theory: Cyberpsychosis, Neural Chrome Thresholds, and Arasaka Tower",
            "body": "Cyberpsychosis is not simply hardware incompatibility; it is the compounding social trauma of poverty, grief, and dehumanization accelerated by dopamine blocker burnout. David Martinez's high baseline tolerance was burned out by the Arasaka military cyberskeleton.",
            "chapterHint": "Episode 10",
            "pinned": True,
            "createdAt": "2026-10-18T20:40:00Z",
            "updatedAt": "2026-10-18T20:40:00Z"
        },

        # work-scifi-22: Altered Carbon
        {
            "id": "nb-scifi-22-1",
            "workId": "work-scifi-22",
            "category": "theory",
            "title": "Theory: Cortical Stacks, Needlecasting, and Methuselah Tyranny",
            "body": "Cortical DHF stacks digitize human consciousness into carbon cartridges. The rich (Meths) backup their memories to remote satellites every day and resleeve into bespoke clones, creating an immortal aristocracy that can never be overthrown.",
            "chapterHint": "Bay City Arc",
            "pinned": True,
            "createdAt": "2026-10-18T20:45:00Z",
            "updatedAt": "2026-10-18T20:45:00Z"
        },

        # work-scifi-23: Do Androids Dream of Electric Sheep?
        {
            "id": "nb-scifi-23-1",
            "workId": "work-scifi-23",
            "category": "theory",
            "title": "Theory: Mercerism and the Voigt-Kampff Empathy Differential",
            "body": "The Voigt-Kampff apparatus measures pupil dilation and capillary flush during empathetic distress questions. In Philip K. Dick's dust-shrouded world, human identity is defined purely by artificial empathy for living animals.",
            "chapterHint": "Rosen Association",
            "pinned": True,
            "createdAt": "2026-10-18T20:50:00Z",
            "updatedAt": "2026-10-18T20:50:00Z"
        },

        # work-scifi-24: Solaris
        {
            "id": "nb-scifi-24-1",
            "workId": "work-scifi-24",
            "category": "theory",
            "title": "Theory: The Sentient Oceanic Organism as a Guilt Mirror",
            "body": "Stanislaw Lem's living colloidal ocean probes human subconscious minds during sleep and synthesizes physical neutrinos into living replicas of their deepest, most shameful memories (such as Rheya).",
            "chapterHint": "Solaris Station",
            "pinned": True,
            "createdAt": "2026-10-18T20:55:00Z",
            "updatedAt": "2026-10-18T20:55:00Z"
        },

        # work-scifi-25: The Matrix: Comics
        {
            "id": "nb-scifi-25-1",
            "workId": "work-scifi-25",
            "category": "theory",
            "title": "Theory: The 6 Cycles of the One and the Architect's System Equation",
            "body": "The Matrix requires a systemic anomaly (The One) to gather all human rejection of the simulated reality and bring it back to the Source every hundred years, allowing the machines to purge and rebuild Zion in a stable loop.",
            "chapterHint": "Zion Archives",
            "pinned": True,
            "createdAt": "2026-10-18T21:00:00Z",
            "updatedAt": "2026-10-18T21:00:00Z"
        },

        # work-scifi-26: S.T.A.L.K.E.R. Roadside Picnic
        {
            "id": "nb-scifi-26-1",
            "workId": "work-scifi-26",
            "category": "theory",
            "title": "Theory: The Visitation: Humanity Encountering Cosmic Litter",
            "body": "The Zone is not a deliberate divine trial or alien invasion; it is merely roadside picnic garbage left behind by a cosmic civilization that stopped on Earth for an hour. Human stalkers risk their lives picking through alien trash.",
            "chapterHint": "Harmont Zone",
            "pinned": True,
            "createdAt": "2026-10-18T21:05:00Z",
            "updatedAt": "2026-10-18T21:05:00Z"
        },

        # Trash works
        {
            "id": "nb-scifi-trash-01-1",
            "workId": "work-scifi-trash-01",
            "category": "scratch",
            "title": "Scratch: Damaged Cyberdeck Hex Dump Notes",
            "body": "Corrupted firmware log recovered from a burned-out Ono-Sendai deck. Stored in Trash Bin.",
            "chapterHint": "Chiba Alleyway",
            "pinned": False,
            "createdAt": "2026-10-17T11:00:00Z",
            "updatedAt": "2026-10-17T11:00:00Z"
        },
        {
            "id": "nb-scifi-trash-02-1",
            "workId": "work-scifi-trash-02",
            "category": "scratch",
            "title": "Scratch: Deprecated Sprawl BBS Node Ping",
            "body": "Dead dialup gateway logs from old net architecture. Marked for purge.",
            "chapterHint": "N/A",
            "pinned": False,
            "createdAt": "2026-10-18T15:20:00Z",
            "updatedAt": "2026-10-18T15:20:00Z"
        }
    ]

    fandom_links = [
        # ORV Novel & Webtoon
        {"id": "fl-scifi-01-1", "workId": "work-scifi-01", "communityName": "Omniscient Reader's Viewpoint Wiki", "provider": "fandom", "canonicalTitle": "Omniscient Reader's Viewpoint Novel", "url": "https://omniscient-readers-viewpoint.fandom.com/wiki/Omniscient_Reader%27s_Viewpoint_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-scifi-01-2", "workId": "work-scifi-01", "communityName": "r/OmniscientReader", "provider": "subreddit", "canonicalTitle": "Omniscient Reader Subreddit", "url": "https://www.reddit.com/r/OmniscientReader/", "isPreferred": False, "language": "en", "provenance": "import"},
        {"id": "fl-scifi-02-1", "workId": "work-scifi-02", "communityName": "Omniscient Reader Webtoon Hub", "provider": "fandom", "canonicalTitle": "Omniscient Reader's Viewpoint Webtoon", "url": "https://omniscient-readers-viewpoint.fandom.com/wiki/Omniscient_Reader%27s_Viewpoint_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Neuromancer
        {"id": "fl-scifi-03-1", "workId": "work-scifi-03", "communityName": "William Gibson Neuromancer Wiki", "provider": "fandom", "canonicalTitle": "Neuromancer", "url": "https://williamgibson.fandom.com/wiki/Neuromancer", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-scifi-03-2", "workId": "work-scifi-03", "communityName": "r/Cyberpunk", "provider": "subreddit", "canonicalTitle": "Cyberpunk Subreddit", "url": "https://www.reddit.com/r/Cyberpunk/", "isPreferred": False, "language": "en", "provenance": "import"},
        # TBATE
        {"id": "fl-scifi-04-1", "workId": "work-scifi-04", "communityName": "The Beginning After The End Wiki", "provider": "fandom", "canonicalTitle": "The Beginning After The End", "url": "https://tbate.fandom.com/wiki/The_Beginning_After_The_End_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-scifi-04-2", "workId": "work-scifi-04", "communityName": "r/tbatenovel", "provider": "subreddit", "canonicalTitle": "TBATE Novel Subreddit", "url": "https://www.reddit.com/r/tbatenovel/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Steins;Gate
        {"id": "fl-scifi-05-1", "workId": "work-scifi-05", "communityName": "Steins;Gate Wiki", "provider": "fandom", "canonicalTitle": "Steins;Gate", "url": "https://steins-gate.fandom.com/wiki/Steins;Gate_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-scifi-05-2", "workId": "work-scifi-05", "communityName": "r/steinsgate", "provider": "subreddit", "canonicalTitle": "Steins;Gate Subreddit", "url": "https://www.reddit.com/r/steinsgate/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Ghost in the Shell
        {"id": "fl-scifi-06-1", "workId": "work-scifi-06", "communityName": "Ghost in the Shell Wiki", "provider": "fandom", "canonicalTitle": "Ghost in the Shell", "url": "https://ghostintheshell.fandom.com/wiki/Ghost_in_the_Shell_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-scifi-06-2", "workId": "work-scifi-06", "communityName": "r/Ghost_in_the_Shell", "provider": "subreddit", "canonicalTitle": "Ghost in the Shell Subreddit", "url": "https://www.reddit.com/r/Ghost_in_the_Shell/", "isPreferred": False, "language": "en", "provenance": "import"},
        # BLAME!
        {"id": "fl-scifi-07-1", "workId": "work-scifi-07", "communityName": "BLAME! Wiki", "provider": "fandom", "canonicalTitle": "BLAME!", "url": "https://blame.fandom.com/wiki/Blame!_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-scifi-07-2", "workId": "work-scifi-07", "communityName": "r/Netsphere", "provider": "subreddit", "canonicalTitle": "Netsphere BLAME! Subreddit", "url": "https://www.reddit.com/r/Netsphere/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Akira
        {"id": "fl-scifi-08-1", "workId": "work-scifi-08", "communityName": "Akira Wiki", "provider": "fandom", "canonicalTitle": "Akira", "url": "https://akira.fandom.com/wiki/Akira_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Dune
        {"id": "fl-scifi-09-1", "workId": "work-scifi-09", "communityName": "Dune Wiki", "provider": "fandom", "canonicalTitle": "Dune Chronicles", "url": "https://dune.fandom.com/wiki/Dune_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-scifi-09-2", "workId": "work-scifi-09", "communityName": "r/dune", "provider": "subreddit", "canonicalTitle": "Dune Subreddit", "url": "https://www.reddit.com/r/dune/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Snow Crash
        {"id": "fl-scifi-10-1", "workId": "work-scifi-10", "communityName": "Snow Crash Wiki", "provider": "fandom", "canonicalTitle": "Snow Crash", "url": "https://snowcrash.fandom.com/wiki/Snow_Crash_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Ender's Game
        {"id": "fl-scifi-11-1", "workId": "work-scifi-11", "communityName": "Enderverse Wiki", "provider": "fandom", "canonicalTitle": "Ender's Game", "url": "https://enderverse.fandom.com/wiki/Ender%27s_Game_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Hyperion Cantos
        {"id": "fl-scifi-12-1", "workId": "work-scifi-12", "communityName": "Hyperion Cantos Wiki", "provider": "fandom", "canonicalTitle": "Hyperion Cantos", "url": "https://hyperioncantos.fandom.com/wiki/Hyperion_Cantos_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-scifi-12-2", "workId": "work-scifi-12", "communityName": "r/Hyperion", "provider": "subreddit", "canonicalTitle": "Hyperion Subreddit", "url": "https://www.reddit.com/r/Hyperion/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Foundation
        {"id": "fl-scifi-13-1", "workId": "work-scifi-13", "communityName": "Asimov Foundation Wiki", "provider": "fandom", "canonicalTitle": "Foundation Series", "url": "https://asimov.fandom.com/wiki/Foundation_Series", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-scifi-13-2", "workId": "work-scifi-13", "communityName": "r/asimov", "provider": "subreddit", "canonicalTitle": "Asimov Subreddit", "url": "https://www.reddit.com/r/asimov/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Three-Body Problem
        {"id": "fl-scifi-14-1", "workId": "work-scifi-14", "communityName": "The Three-Body Problem Wiki", "provider": "fandom", "canonicalTitle": "Three-Body Problem", "url": "https://three-body-problem.fandom.com/wiki/The_Three-Body_Problem_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-scifi-14-2", "workId": "work-scifi-14", "communityName": "r/threebodyproblem", "provider": "subreddit", "canonicalTitle": "Three-Body Problem Subreddit", "url": "https://www.reddit.com/r/threebodyproblem/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Ergo Proxy
        {"id": "fl-scifi-15-1", "workId": "work-scifi-15", "communityName": "Ergo Proxy Wiki", "provider": "fandom", "canonicalTitle": "Ergo Proxy", "url": "https://ergoproxy.fandom.com/wiki/Ergo_Proxy_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Serial Experiments Lain
        {"id": "fl-scifi-16-1", "workId": "work-scifi-16", "communityName": "Serial Experiments Lain Wiki", "provider": "fandom", "canonicalTitle": "Serial Experiments Lain", "url": "https://lain.fandom.com/wiki/Serial_Experiments_Lain_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-scifi-16-2", "workId": "work-scifi-16", "communityName": "r/Lain", "provider": "subreddit", "canonicalTitle": "Serial Experiments Lain Subreddit", "url": "https://www.reddit.com/r/Lain/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Texhnolyze
        {"id": "fl-scifi-17-1", "workId": "work-scifi-17", "communityName": "Texhnolyze Wiki", "provider": "fandom", "canonicalTitle": "Texhnolyze", "url": "https://texhnolyze.fandom.com/wiki/Texhnolyze_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Psycho-Pass
        {"id": "fl-scifi-18-1", "workId": "work-scifi-18", "communityName": "Psycho-Pass Wiki", "provider": "fandom", "canonicalTitle": "Psycho-Pass", "url": "https://psychopass.fandom.com/wiki/Psycho-Pass_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-scifi-18-2", "workId": "work-scifi-18", "communityName": "r/Psychopass", "provider": "subreddit", "canonicalTitle": "Psycho-Pass Subreddit", "url": "https://www.reddit.com/r/Psychopass/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Neon Genesis Evangelion
        {"id": "fl-scifi-19-1", "workId": "work-scifi-19", "communityName": "Evangelion Wiki", "provider": "fandom", "canonicalTitle": "Neon Genesis Evangelion", "url": "https://evangelion.fandom.com/wiki/Neon_Genesis_Evangelion_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-scifi-19-2", "workId": "work-scifi-19", "communityName": "r/evangelion", "provider": "subreddit", "canonicalTitle": "Evangelion Subreddit", "url": "https://www.reddit.com/r/evangelion/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Cowboy Bebop
        {"id": "fl-scifi-20-1", "workId": "work-scifi-20", "communityName": "Cowboy Bebop Wiki", "provider": "fandom", "canonicalTitle": "Cowboy Bebop", "url": "https://cowboybebop.fandom.com/wiki/Cowboy_Bebop_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-scifi-20-2", "workId": "work-scifi-20", "communityName": "r/cowboybebop", "provider": "subreddit", "canonicalTitle": "Cowboy Bebop Subreddit", "url": "https://www.reddit.com/r/cowboybebop/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Cyberpunk: Edgerunners
        {"id": "fl-scifi-21-1", "workId": "work-scifi-21", "communityName": "Cyberpunk: Edgerunners Wiki", "provider": "fandom", "canonicalTitle": "Cyberpunk: Edgerunners", "url": "https://cyberpunk.fandom.com/wiki/Cyberpunk:_Edgerunners", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-scifi-21-2", "workId": "work-scifi-21", "communityName": "r/Edgerunners", "provider": "subreddit", "canonicalTitle": "Edgerunners Subreddit", "url": "https://www.reddit.com/r/Edgerunners/", "isPreferred": False, "language": "en", "provenance": "import"},
        # Altered Carbon
        {"id": "fl-scifi-22-1", "workId": "work-scifi-22", "communityName": "Altered Carbon Wiki", "provider": "fandom", "canonicalTitle": "Altered Carbon", "url": "https://altered-carbon.fandom.com/wiki/Altered_Carbon_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Blade Runner
        {"id": "fl-scifi-23-1", "workId": "work-scifi-23", "communityName": "Blade Runner Wiki", "provider": "fandom", "canonicalTitle": "Do Androids Dream of Electric Sheep?", "url": "https://bladerunner.fandom.com/wiki/Blade_Runner_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        # Solaris
        {"id": "fl-scifi-24-1", "workId": "work-scifi-24", "communityName": "Stanislaw Lem Archives", "provider": "wiki", "canonicalTitle": "Solaris", "url": "https://en.wikipedia.org/wiki/Solaris_(novel)", "isPreferred": True, "language": "en", "provenance": "import"},
        # The Matrix
        {"id": "fl-scifi-25-1", "workId": "work-scifi-25", "communityName": "The Matrix Wiki", "provider": "fandom", "canonicalTitle": "The Matrix: Comics", "url": "https://matrix.fandom.com/wiki/The_Matrix_Wiki", "isPreferred": True, "language": "en", "provenance": "import"},
        {"id": "fl-scifi-25-2", "workId": "work-scifi-25", "communityName": "r/matrix", "provider": "subreddit", "canonicalTitle": "The Matrix Subreddit", "url": "https://www.reddit.com/r/matrix/", "isPreferred": False, "language": "en", "provenance": "import"},
        # STALKER
        {"id": "fl-scifi-26-1", "workId": "work-scifi-26", "communityName": "S.T.A.L.K.E.R. Roadside Picnic Wiki", "provider": "fandom", "canonicalTitle": "S.T.A.L.K.E.R. Roadside Picnic", "url": "https://stalker.fandom.com/wiki/Roadside_Picnic", "isPreferred": True, "language": "en", "provenance": "import"}
    ]

    return notebook_entries, fandom_links
