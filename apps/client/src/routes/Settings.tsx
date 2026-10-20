import * as React from 'react';
import {
  Bell,
  Check,
  Database,
  Eye,
  Globe,
  Key,
  Lock,
  Moon,
  Paintbrush,
  Palette,
  RefreshCw,
  Shield,
  Sliders,
  Trash2,
  User,
} from 'lucide-react';
import {
  Button,
  Input,
  PageContainer,
  Separator,
  toast,
  usePerformanceProfile,
  useTheme,
  PERFORMANCE_PROFILES,
  THEMES,
} from '@grimoire/ui';
import { clientRepository, useLibraryStore } from '@grimoire/state';
import { DataTransferPanel } from '../components/features/Settings/DataTransferPanel';
import { CredentialKeyringPanel } from '../components/features/Vault/CredentialKeyringPanel';

export function Settings() {
  const [activeSection, setActiveSection] = React.useState('appearance');
  const { themeId, setTheme } = useTheme();
  const perfProfile = usePerformanceProfile();

  const navItems = [
    { id: 'appearance', label: 'Appearance', icon: Paintbrush },
    { id: 'portals', label: 'Reading Portals & Credentials', icon: Key },
    { id: 'vault', label: 'Vault & Privacy', icon: Shield },
    { id: 'sources', label: 'Sources & Sync', icon: Globe },
    { id: 'data', label: 'Data & Backup', icon: Database },
    { id: 'advanced', label: 'Advanced', icon: Sliders },
  ];

  return (
    <PageContainer maxWidth="wide">
      <div className="mb-6">
        <h1 className="text-gm-2xl sm:text-gm-3xl font-extrabold tracking-tight text-[var(--gm-text)]">
          Settings
        </h1>
        <p className="mt-1 text-gm-sm text-[var(--gm-text-muted)]">
          Manage appearance, vault encryption, tracking sources, and data backups.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Settings Navigation Sidebar */}
        <aside className="w-full md:w-56 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2.5 rounded-cv px-3 py-2 text-gm-sm font-medium transition-colors text-left whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[var(--gm-surface)] text-[var(--gm-text)] font-semibold shadow-xs'
                    : 'text-[var(--gm-text-muted)] hover:bg-[var(--gm-surface)]/60 hover:text-[var(--gm-text)]'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    active ? 'text-[var(--gm-accent-strong)]' : 'text-[var(--gm-text-subtle)]'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Settings Content Area */}
        <div className="flex-1 w-full rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-6 shadow-sm">
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-gm-lg font-bold text-[var(--gm-text)]">Appearance</h3>
                <p className="text-gm-xs text-[var(--gm-text-muted)] mt-1">
                  Customize the visual personality of Grimoire.
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h4 className="text-gm-sm font-semibold text-[var(--gm-text)]">Visual Themes (5 Atmospheres)</h4>
                  <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5">
                    Select one of 5 distinct, finely calibrated atmospheres (with bespoke background artwork) for your reading sanctuary.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                  {THEMES.map((item) => {
                    const isSelected = themeId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setTheme(item.id);
                          toast({ title: "Theme switched", description: `Active theme: ${item.name}` });
                        }}
                        className={`group relative flex flex-col justify-between p-4 rounded-gm-xl border-2 transition-all cursor-pointer select-none ${
                          isSelected
                            ? "border-[var(--gm-accent)] bg-[var(--gm-surface)] shadow-md"
                            : "border-[var(--gm-border)] bg-[var(--gm-surface)]/50 hover:border-[var(--gm-border-strong)] hover:bg-[var(--gm-surface)]"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-bold text-gm-sm text-[var(--gm-text)]">
                              {item.name}
                            </span>
                            <div
                              className="h-4 w-4 rounded-full ring-2 ring-white/20 shrink-0"
                              style={{ backgroundColor: item.previewAccent }}
                            />
                          </div>

                          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--gm-text-subtle)] block">
                            {item.tagline}
                          </span>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[var(--gm-border)]/60 flex items-center justify-between text-gm-xs">
                          <span className="text-[10px] text-[var(--gm-text-subtle)]">
                            {item.isDark ? "Dark Atmosphere" : "Light Atmosphere"}
                          </span>
                          {isSelected && (
                            <span className="flex items-center gap-1 font-semibold text-[var(--gm-accent-strong)]">
                              <Check className="h-3.5 w-3.5" />
                              <span>Active</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h4 className="text-gm-sm font-semibold text-[var(--gm-text)]">
                      Performance Profile
                    </h4>
                    <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5">
                      Control glass blur, virtualization buffer, and background sync intensity.
                    </p>
                  </div>
                  <span className="rounded-gm-full border border-[var(--gm-border)] bg-[var(--gm-surface)] px-2.5 py-1 font-mono text-[11px] text-[var(--gm-accent-strong)]">
                    Active: {perfProfile.label} ({perfProfile.virtualBufferItems}-item buffer)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {PERFORMANCE_PROFILES.map((profile) => {
                    const isSelected = perfProfile.mode === profile.id;
                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => {
                          perfProfile.setProfileMode(profile.id);
                          toast({
                            title: 'Performance profile updated',
                            description: `Mode: ${profile.name}`,
                          });
                        }}
                        className={`flex flex-col justify-between p-4 rounded-gm-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--gm-accent)] bg-[var(--gm-surface)] shadow-sm'
                            : 'border-[var(--gm-border)] bg-[var(--gm-surface)]/40 hover:border-[var(--gm-border-strong)] hover:bg-[var(--gm-surface)]/70'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-gm-sm text-[var(--gm-text)]">
                              {profile.name}
                            </span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-[var(--gm-accent-strong)] shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--gm-text-subtle)] block mb-1.5">
                            {profile.tagline}
                          </span>
                          <p className="text-gm-xs text-[var(--gm-text-muted)] leading-relaxed">
                            {profile.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'portals' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-gm-lg font-bold text-[var(--gm-text)]">
                  Reading Portals &amp; Website Credential Manager
                </h3>
                <p className="text-gm-xs text-[var(--gm-text-muted)] mt-1">
                  Secure login storage, custom search URLs, and auto-detected frequent reading portals.
                </p>
              </div>
              <Separator />
              <CredentialKeyringPanel />
            </div>
          )}

          {activeSection === 'vault' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-gm-lg font-bold text-[var(--gm-text)]">Vault & Privacy</h3>
                <p className="text-gm-xs text-[var(--gm-text-muted)] mt-1">
                  Configure zero-knowledge encryption for sensitive titles and private reading lists.
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="rounded-gm-lg bg-[var(--gm-surface)]/60 p-4 border border-[var(--gm-border)]">
                  <div className="flex items-center gap-2 text-gm-sm font-semibold text-[var(--gm-text)]">
                    <Lock className="h-4 w-4 text-[var(--gm-warning)]" />
                    <span>Master Passphrase</span>
                  </div>
                  <p className="mt-1 text-gm-xs text-[var(--gm-text-muted)]">
                    Your vault is encrypted locally on your device. Your passphrase is never transmitted or stored on any server.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => toast({ title: 'Prompting passphrase setup' })}
                  >
                    Set Passphrase
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'sources' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-gm-lg font-bold text-[var(--gm-text)]">Sources &amp; Synchronization</h3>
                <p className="text-gm-xs text-[var(--gm-text-muted)] mt-1">
                  Manage sync scope, granular memory opt-outs, and background polling intervals.
                </p>
              </div>
              <Separator />
              <div className="p-4 rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div>
                  <h4 className="font-bold text-gm-sm text-[var(--gm-text)]">
                    Cross-Platform Synchronization Sanctum
                  </h4>
                  <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5 max-w-xl">
                    Configure granular sync options: select all works, select few works, exclude few works, filter by custom categories, opt out individual memories, and enforce zero-knowledge vault boundaries (vault is synced only when open).
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    window.location.hash = "#/sync";
                  }}
                  className="gap-2 shrink-0 self-end sm:self-center"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Configure Sync Scope</span>
                </Button>
              </div>
              <p className="text-gm-sm text-[var(--gm-text-muted)]">
                12 sources currently active.{' '}
                {perfProfile.pollingIntervalMinutes === null
                  ? 'Background polling is paused in Lite mode (manual check only).'
                  : `Background polling occurs every ${perfProfile.pollingIntervalMinutes} minutes (${perfProfile.label} profile).`}
              </p>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-gm-lg font-bold text-[var(--gm-text)]">Data & Backup</h3>
                <p className="text-gm-xs text-[var(--gm-text-muted)] mt-1">
                  Export your library as JSON, CSV, Markdown, or a ZIP bundle, and import from a backup, a CSV, or browser bookmarks.
                </p>
              </div>
              <Separator />
              <DataTransferPanel />
            </div>
          )}

          {activeSection === 'advanced' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-gm-lg font-bold text-[var(--gm-text)]">Advanced Options</h3>
                <p className="text-gm-xs text-[var(--gm-text-muted)] mt-1">
                  Diagnostics, runtime performance telemetry, cache purge, and developer tools.
                </p>
              </div>
              <Separator />
              <div className="rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-surface)]/50 p-4 space-y-2 text-gm-xs">
                <div className="font-semibold text-[var(--gm-text)]">
                  Runtime Performance Telemetry
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 font-mono text-[11px]">
                  <div>
                    <span className="text-[var(--gm-text-subtle)] block">Resolved Profile</span>
                    <span className="text-[var(--gm-text)] font-semibold">{perfProfile.label}</span>
                  </div>
                  <div>
                    <span className="text-[var(--gm-text-subtle)] block">Virtual Buffer</span>
                    <span className="text-[var(--gm-text)] font-semibold">
                      {perfProfile.virtualBufferItems} items
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--gm-text-subtle)] block">Glass Blur</span>
                    <span className="text-[var(--gm-text)] font-semibold">
                      {perfProfile.backdropBlur ? 'Enabled' : 'Disabled (Flat)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--gm-text-subtle)] block">Canvas Lookahead</span>
                    <span className="text-[var(--gm-text)] font-semibold">
                      {perfProfile.webtoonCanvasBuffer} pages
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast({ title: 'Cache purged successfully' })}
              >
                Purge Image Cache
              </Button>

              {/* Danger Zone */}
              <div className="rounded-gm-lg border border-[var(--gm-danger)]/40 bg-[var(--gm-danger-muted)]/10 p-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trash2 className="h-4 w-4 text-[var(--gm-danger)]" />
                    <span className="font-semibold text-gm-sm text-[var(--gm-danger)]">Danger Zone</span>
                  </div>
                  <p className="text-gm-xs text-[var(--gm-text-muted)]">
                    These actions are irreversible. Proceed with caution.
                  </p>
                </div>
                <Separator className="border-[var(--gm-danger)]/20" />
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 space-y-1">
                    <p className="text-gm-xs font-semibold text-[var(--gm-text)]">Clean Up Soft-Deleted Works</p>
                    <p className="text-[11px] text-[var(--gm-text-muted)]">
                      Permanently removes all works you have soft-deleted. This frees database space and cannot be undone.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 gap-1.5 text-gm-xs text-[var(--gm-danger)] hover:bg-[var(--gm-danger-muted)] border-[var(--gm-danger)]/40"
                      onClick={() => {
                        if (typeof window !== 'undefined' && !window.confirm('Permanently purge all soft-deleted works? This cannot be undone.')) return;
                        try {
                          const count = clientRepository.purgeAllDeletedWorks();
                          useLibraryStore.getState().refresh();
                          toast({ title: `Purged ${count} deleted work(s)`, description: 'Your database has been cleaned up.' });
                        } catch (err) {
                          toast({ title: 'Purge failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Purge Deleted Works</span>
                    </Button>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-gm-xs font-semibold text-[var(--gm-text)]">Factory Reset Library</p>
                    <p className="text-[11px] text-[var(--gm-text-muted)]">
                      Wipes your entire local library and all custom works and memories permanently. This cannot be undone.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 gap-1.5 text-gm-xs text-[var(--gm-danger)] hover:bg-[var(--gm-danger-muted)] border-[var(--gm-danger)]/40"
                      onClick={() => {
                        if (typeof window !== 'undefined' && !window.confirm('Factory Reset: Wipe entire local library? This cannot be undone.')) return;
                        try {
                          clientRepository.resetToDefaultSeed();
                          useLibraryStore.getState().refresh();
                          toast({ title: 'Library wiped & reset', description: 'All local data has been cleared.' });
                        } catch (err) {
                          toast({ title: 'Reset failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Factory Reset</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
