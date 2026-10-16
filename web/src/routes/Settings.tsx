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
  Shield,
  Sliders,
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
} from '@chronicles-vault/ui';
import { DataTransferPanel } from '../components/features/Settings/DataTransferPanel';

export function Settings() {
  const [activeSection, setActiveSection] = React.useState('appearance');
  const { themeId, setTheme } = useTheme();
  const perfProfile = usePerformanceProfile();

  const navItems = [
    { id: 'appearance', label: 'Appearance', icon: Paintbrush },
    { id: 'vault', label: 'Vault & Privacy', icon: Shield },
    { id: 'sources', label: 'Sources & Sync', icon: Globe },
    { id: 'data', label: 'Data & Backup', icon: Database },
    { id: 'advanced', label: 'Advanced', icon: Sliders },
  ];

  return (
    <PageContainer maxWidth="wide">
      <div className="mb-6">
        <h1 className="text-cv-2xl sm:text-cv-3xl font-extrabold tracking-tight text-[var(--cv-text)]">
          Settings
        </h1>
        <p className="mt-1 text-cv-sm text-[var(--cv-text-muted)]">
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
                className={`flex items-center gap-2.5 rounded-cv px-3 py-2 text-cv-sm font-medium transition-colors text-left whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[var(--cv-surface)] text-[var(--cv-text)] font-semibold shadow-xs'
                    : 'text-[var(--cv-text-muted)] hover:bg-[var(--cv-surface)]/60 hover:text-[var(--cv-text)]'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    active ? 'text-[var(--cv-accent-strong)]' : 'text-[var(--cv-text-subtle)]'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Settings Content Area */}
        <div className="flex-1 w-full rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-6 shadow-sm">
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-cv-lg font-bold text-[var(--cv-text)]">Appearance</h3>
                <p className="text-cv-xs text-[var(--cv-text-muted)] mt-1">
                  Customize the visual personality of Chronicles Vault.
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h4 className="text-cv-sm font-semibold text-[var(--cv-text)]">Visual Themes</h4>
                  <p className="text-cv-xs text-[var(--cv-text-muted)] mt-0.5">
                    Select one of 3 distinct, finely calibrated atmospheres for your reading sanctuary.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {THEMES.map((item) => {
                    const isSelected = themeId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setTheme(item.id);
                          toast({ title: "Theme switched", description: `Active theme: ${item.name}` });
                        }}
                        className={`group relative flex flex-col justify-between p-4 rounded-cv-xl border-2 transition-all cursor-pointer select-none ${
                          isSelected
                            ? "border-[var(--cv-accent)] bg-[var(--cv-surface)] shadow-md"
                            : "border-[var(--cv-border)] bg-[var(--cv-surface)]/50 hover:border-[var(--cv-border-strong)] hover:bg-[var(--cv-surface)]"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-bold text-cv-sm text-[var(--cv-text)]">
                              {item.name}
                            </span>
                            <div
                              className="h-4 w-4 rounded-full ring-2 ring-white/20 shrink-0"
                              style={{ backgroundColor: item.previewAccent }}
                            />
                          </div>

                          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--cv-text-subtle)] block mb-1.5">
                            {item.tagline}
                          </span>

                          <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[var(--cv-border)]/60 flex items-center justify-between text-cv-xs">
                          <span className="text-[10px] text-[var(--cv-text-subtle)]">
                            {item.isDark ? "Dark Atmosphere" : "Light Atmosphere"}
                          </span>
                          {isSelected && (
                            <span className="flex items-center gap-1 font-semibold text-[var(--cv-accent-strong)]">
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
                    <h4 className="text-cv-sm font-semibold text-[var(--cv-text)]">
                      Performance Profile
                    </h4>
                    <p className="text-cv-xs text-[var(--cv-text-muted)] mt-0.5">
                      Control glass blur, virtualization buffer, and background sync intensity.
                    </p>
                  </div>
                  <span className="rounded-cv-full border border-[var(--cv-border)] bg-[var(--cv-surface)] px-2.5 py-1 font-mono text-[11px] text-[var(--cv-accent-strong)]">
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
                        className={`flex flex-col justify-between p-4 rounded-cv-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--cv-accent)] bg-[var(--cv-surface)] shadow-sm'
                            : 'border-[var(--cv-border)] bg-[var(--cv-surface)]/40 hover:border-[var(--cv-border-strong)] hover:bg-[var(--cv-surface)]/70'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-cv-sm text-[var(--cv-text)]">
                              {profile.name}
                            </span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-[var(--cv-accent-strong)] shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--cv-text-subtle)] block mb-1.5">
                            {profile.tagline}
                          </span>
                          <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
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

          {activeSection === 'vault' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-cv-lg font-bold text-[var(--cv-text)]">Vault & Privacy</h3>
                <p className="text-cv-xs text-[var(--cv-text-muted)] mt-1">
                  Configure zero-knowledge encryption for sensitive titles and private reading lists.
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="rounded-cv-lg bg-[var(--cv-surface)]/60 p-4 border border-[var(--cv-border)]">
                  <div className="flex items-center gap-2 text-cv-sm font-semibold text-[var(--cv-text)]">
                    <Lock className="h-4 w-4 text-[var(--cv-warning)]" />
                    <span>Master Passphrase</span>
                  </div>
                  <p className="mt-1 text-cv-xs text-[var(--cv-text-muted)]">
                    AES-256-GCM encryption is applied locally in your browser/app. We never store or transmit your passphrase.
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
                <h3 className="text-cv-lg font-bold text-[var(--cv-text)]">Sources & Tracking</h3>
                <p className="text-cv-xs text-[var(--cv-text-muted)] mt-1">
                  Manage sync intervals and connected scrapers/extensions.
                </p>
              </div>
              <Separator />
              <p className="text-cv-sm text-[var(--cv-text-muted)]">
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
                <h3 className="text-cv-lg font-bold text-[var(--cv-text)]">Data & Backup</h3>
                <p className="text-cv-xs text-[var(--cv-text-muted)] mt-1">
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
                <h3 className="text-cv-lg font-bold text-[var(--cv-text)]">Advanced Options</h3>
                <p className="text-cv-xs text-[var(--cv-text-muted)] mt-1">
                  Diagnostics, runtime performance telemetry, cache purge, and developer tools.
                </p>
              </div>
              <Separator />
              <div className="rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-surface)]/50 p-4 space-y-2 text-cv-xs">
                <div className="font-semibold text-[var(--cv-text)]">
                  Runtime Performance Telemetry
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 font-mono text-[11px]">
                  <div>
                    <span className="text-[var(--cv-text-subtle)] block">Resolved Profile</span>
                    <span className="text-[var(--cv-text)] font-semibold">{perfProfile.label}</span>
                  </div>
                  <div>
                    <span className="text-[var(--cv-text-subtle)] block">Virtual Buffer</span>
                    <span className="text-[var(--cv-text)] font-semibold">
                      {perfProfile.virtualBufferItems} items
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--cv-text-subtle)] block">Glass Blur</span>
                    <span className="text-[var(--cv-text)] font-semibold">
                      {perfProfile.backdropBlur ? 'Enabled' : 'Disabled (Flat)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--cv-text-subtle)] block">Canvas Lookahead</span>
                    <span className="text-[var(--cv-text)] font-semibold">
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
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
