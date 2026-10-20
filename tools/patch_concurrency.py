path = r'c:\Users\67rah\Desktop\Chronciles Vault\chronicles-vault\apps\client\src\routes\Help.tsx'
content = open(path, 'r', encoding='utf-8').read()

target = '''    id: "faq-multi-catalogs",
    question: "Which metadata catalogs can I search in Discover?",
    answer:
      "In the Discover tab, you can search across multiple world-class fiction databases: AniList (Anime, Manga, Manhwa, Light Novels), MangaUpdates / Baka-Updates Manga (the premier community database for Manga, Manhwa, Manhua, and Asian Web Novels), MangaDex (community scanlation catalog with multi-language titles), and Open Library (Western novels, literature, and classics), plus deep search into NovelUpdates.",
    category: "general",'''

replacement = '''    id: "faq-multi-catalogs",
    question: "Which metadata catalogs can I search in Discover?",
    answer:
      "In the Discover tab, you can search across multiple world-class fiction databases: AniList (Anime, Manga, Manhwa, Light Novels), MangaUpdates / Baka-Updates (the premier database for Manga, Manhwa, Manhua, and Web Novels), Goodreads (global book reviews, member ratings, author quotes, and user bookshelves), Google Books (publication editions), MangaDex (scanlation releases), and Open Library (Western novels and literature), plus deep search gateways for NovelUpdates, Webnovel, IMDb, and Rotten Tomatoes.",
    category: "general",'''

if target in content:
    content = content.replace(target, replacement, 1)
    open(path, 'w', encoding='utf-8').write(content)
    print('Updated faq-multi-catalogs in Help.tsx (LF)')
else:
    target_crlf = target.replace('\n', '\r\n')
    replacement_crlf = replacement.replace('\n', '\r\n')
    if target_crlf in content:
        content = content.replace(target_crlf, replacement_crlf, 1)
        open(path, 'w', encoding='utf-8').write(content)
        print('Updated faq-multi-catalogs in Help.tsx (CRLF)')
    else:
        print('Target not found in Help.tsx')
