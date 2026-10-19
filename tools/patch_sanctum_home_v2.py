# -*- coding: utf-8 -*-
"""
Patch SanctumHome.tsx with all latest user directives:
1. Two-columned portals list in large windows (lg:grid-cols-2) and single-columned in narrow windows (grid-cols-1).
2. Restore authentic Grimoire astral logo (/logo.png with /logo.svg fallback) in header and footer.
3. Remove user ranking / grading ("Grand Archivist", "Tier: S") from rotating card and replace with real reading metrics (Collection, Active Flow, Memories).
4. Robust .gca import handler that:
   - Sets user profile session
   - Normalizes and imports custom categories with valid colors & workIds, refreshing useCategoriesStore
   - Normalizes credentials (siteName, siteUrl, username, password) into grimoire:vault:credentials
   - Restores archive records and trash bin items
   - Opens /library immediately
"""

import re

file_path = r'c:\Users\67rah\Desktop\Chronciles Vault\chronicles-vault\apps\client\src\routes\SanctumHome.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Restore official Grimoire logo in top header
old_header_logo = '''          <div className="flex items-center gap-3">
            <div className="h-9 w-9 border-2 border-[var(--gm-border-strong)] bg-[var(--gm-accent)] text-[var(--gm-accent-fg)] flex items-center justify-center shadow-[2px_2px_0px_var(--gm-border-strong)]" title="Grimoire Codex Sanctum">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4zm12 16H6v-2h12v2zm0-4H6v-2h12v2zm0-4h-5V4h5v8z" />
                <circle cx="12" cy="10" r="1.5" fill="#fef08a" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gm-sm uppercase tracking-wider text-[var(--gm-text)]">
                  Grimoire
                </span>
              </div>
            </div>
          </div>'''

new_header_logo = '''          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith(".svg")) {
                  target.src = "/logo.svg";
                }
              }}
              alt="Grimoire"
              className="h-9 w-9 rounded-full object-cover shadow-[2px_2px_0px_var(--gm-border-strong)] ring-1 ring-[var(--gm-border-strong)] shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gm-sm uppercase tracking-wider text-[var(--gm-text)]">
                  Grimoire
                </span>
              </div>
            </div>
          </div>'''

content = content.replace(old_header_logo, new_header_logo)

# 2. Restore official Grimoire logo in footer
old_footer_brand = '''              <div>
                <div className="font-extrabold text-gm-base font-mono uppercase tracking-wider text-[var(--gm-text)]">
                  GRIMOIRE
                </div>
                <p className="text-gm-xs text-[var(--gm-text-muted)] mt-1">
                  4 Distinct Themes (Midnight Arcana · Parchment · Blossom Ascendant · Ink) ·
                  Local-First Privacy · Zero-Knowledge Vault
                </p>
              </div>'''

new_footer_brand = '''              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith(".svg")) {
                      target.src = "/logo.svg";
                    }
                  }}
                  alt="Grimoire"
                  className="h-9 w-9 rounded-full object-cover shadow-[2px_2px_0px_var(--gm-border-strong)] ring-1 ring-[var(--gm-border-strong)] shrink-0"
                />
                <div>
                  <div className="font-extrabold text-gm-base font-mono uppercase tracking-wider text-[var(--gm-text)]">
                    GRIMOIRE
                  </div>
                  <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5">
                    4 Distinct Themes (Midnight Arcana · Parchment · Blossom Ascendant · Ink) ·
                    Local-First Privacy · Zero-Knowledge Vault
                  </p>
                </div>
              </div>'''

content = content.replace(old_footer_brand, new_footer_brand)

# 3. Revamp rotating homepage card: Remove user ranks ("Grand Archivist", "Tier: S") and replace with real reading metrics
old_card_grid = '''              {/* Profile Details Grid: Rank, Title, Tier & Updates */}
              <div className="grid grid-cols-3 gap-2 mb-4 border border-[var(--gm-border)] bg-[var(--gm-surface)] p-3 shadow-[2px_2px_0px_var(--gm-border)]">
                <div>
                  <div className="text-[9px] font-mono font-bold uppercase text-[var(--gm-text-subtle)]">
                    Rank &amp; Title
                  </div>
                  <div className="text-gm-xs font-mono font-bold text-[var(--gm-text)] mt-0.5 truncate">
                    Grand Archivist
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-mono font-bold uppercase text-[var(--gm-text-subtle)]">
                    Rank Tier
                  </div>
                  <div className="text-gm-xs font-mono font-bold text-[var(--gm-accent-strong)] mt-0.5">
                    Tier: S
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-mono font-bold uppercase text-[var(--gm-text-subtle)]">
                    Active Works
                  </div>
                  <div className="text-gm-xs font-mono font-bold text-amber-500 mt-0.5">
                    {roomStats.activeCount > 0 ? `${roomStats.activeCount} Active` : "All Caught Up"}
                  </div>
                </div>
              </div>'''

new_card_grid = '''              {/* Profile Details Grid: Real Reading Metrics (No User Ranks or Grades) */}
              <div className="grid grid-cols-3 gap-2 mb-4 border border-[var(--gm-border)] bg-[var(--gm-surface)] p-3 shadow-[2px_2px_0px_var(--gm-border)]">
                <div>
                  <div className="text-[9px] font-mono font-bold uppercase text-[var(--gm-text-subtle)]">
                    Collection
                  </div>
                  <div className="text-gm-xs font-mono font-bold text-[var(--gm-text)] mt-0.5 truncate">
                    {roomStats.worksCount > 0 ? `${roomStats.worksCount} Works` : "Sanctum Ready"}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-mono font-bold uppercase text-[var(--gm-text-subtle)]">
                    Active Flow
                  </div>
                  <div className="text-gm-xs font-mono font-bold text-[var(--gm-accent-strong)] mt-0.5 truncate">
                    {roomStats.activeCount > 0 ? `${roomStats.activeCount} In Progress` : "All Caught Up"}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-mono font-bold uppercase text-[var(--gm-text-subtle)]">
                    Memories
                  </div>
                  <div className="text-gm-xs font-mono font-bold text-amber-500 mt-0.5 truncate">
                    {roomStats.memoriesCount > 0 ? `${roomStats.memoriesCount} Saved` : "Memory Vault"}
                  </div>
                </div>
              </div>'''

content = content.replace(old_card_grid, new_card_grid)

# 4. Two-columned portals in large windows (lg:grid-cols-2) and single-columned in narrow windows (grid-cols-1)
old_portals_section = '''              {/* Redesigned Multiple-Column Dense List Format */}
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

new_portals_section = '''              {/* Responsive Portal Layout: Two-Columned in Large Windows (lg:grid-cols-2), Single-Columned in Narrow */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {filteredSites.map((site) => (
                  <div
                    key={site.id}
                    className="border-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] p-4 sm:p-4.5 flex flex-col justify-between gap-3 shadow-[3px_3px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-gm-sm text-[var(--gm-text)] truncate">
                            {site.name}
                          </h3>
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
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="border border-[var(--gm-border-strong)] bg-[var(--gm-accent-muted)] px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-[var(--gm-accent-strong)] rounded-cv">
                            {site.categoryLabel}
                          </span>
                          <span className="border border-[var(--gm-border)] bg-[var(--gm-surface)] px-2 py-0.5 text-[10px] font-mono uppercase text-[var(--gm-text-muted)] rounded-cv hidden sm:inline-block">
                            {site.badge}
                          </span>
                        </div>
                      </div>

                      <p className="text-gm-xs text-[var(--gm-text-muted)] line-clamp-2 leading-relaxed">
                        {site.description}
                      </p>
                      <p className="font-mono text-[10px] text-[var(--gm-text-subtle)]">
                        {site.languages}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[var(--gm-border)] flex items-center justify-between gap-2">
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-[var(--gm-surface)] hover:bg-[var(--gm-surface-hover)] border border-[var(--gm-border-strong)] px-3 py-1 text-gm-xs font-mono font-bold uppercase text-[var(--gm-text)] transition-colors cursor-pointer"
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
                  </div>
                ))}
              </div>'''

content = content.replace(old_portals_section, new_portals_section)

# 5. Overhaul handleUniversalArchiveImport to properly handle categories, credentials, updates, archive, and trash
old_import_func = '''      // Restore categories
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
      }'''

new_import_func = '''      // Restore categories with normalized schema & workIds
      if (Array.isArray(rawData.categories) && rawData.categories.length > 0) {
        try {
          const normalizedCats = rawData.categories.map((c: any) => {
            const validColors = ["indigo", "amber", "rose", "emerald", "sky", "purple", "orange", "cyan"];
            const assignedColor = validColors.includes(c.color) ? c.color : "indigo";
            return {
              id: c.id,
              name: c.name,
              description: c.description || "",
              color: assignedColor,
              workIds: Array.isArray(c.workIds) ? c.workIds : [],
              createdAt: c.createdAt || new Date().toISOString(),
              updatedAt: c.updatedAt || new Date().toISOString(),
            };
          });
          window.localStorage.setItem("cv:custom_categories:v1", JSON.stringify(normalizedCats));
          stateMod.useCategoriesStore.getState().refresh();
        } catch {}
      }

      // Restore credentials with normalized schema
      if (Array.isArray(rawData.credentials) && rawData.credentials.length > 0) {
        try {
          const rawCreds = window.localStorage.getItem("grimoire:vault:credentials");
          const existingCreds: any[] = rawCreds ? JSON.parse(rawCreds) : [];
          const existingIds = new Set(existingCreds.map((c: any) => c.id));
          const normalizedCreds = rawData.credentials.map((c: any) => ({
            id: c.id || `cred-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            siteName: c.siteName || c.name || "Portal",
            siteUrl: c.siteUrl || c.url || (c.domain ? `https://${c.domain}` : ""),
            searchUrl: c.searchUrl || c.searchUrlPattern || "",
            username: c.username || "",
            password: c.password || "",
            notes: c.notes || "",
            createdAt: c.createdAt || new Date().toISOString(),
          })).filter((c: any) => !existingIds.has(c.id));

          if (normalizedCreds.length > 0) {
            window.localStorage.setItem("grimoire:vault:credentials", JSON.stringify([...existingCreds, ...normalizedCreds]));
          }
        } catch {}
      }

      // Restore Archive Records
      if (Array.isArray(rawData.archiveRecords) && rawData.archiveRecords.length > 0) {
        try {
          window.localStorage.setItem("cv:archive_records:v1", JSON.stringify(rawData.archiveRecords));
        } catch {}
      }

      // Refresh Trash and Categories
      try {
        stateMod.useTrashStore.getState().refreshTrash();
      } catch {}'''

content = content.replace(old_import_func, new_import_func)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SanctumHome.tsx v2 patched successfully!")
