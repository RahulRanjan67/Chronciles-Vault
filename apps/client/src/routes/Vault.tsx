import * as React from "react";
import {
  Eye,
  EyeOff,
  ExternalLink,
  FolderLock,
  HardDrive,
  KeyRound,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  Unlock,
  UserCheck,
} from "lucide-react";
import {
  IndexedDbVaultRepository,
  createVaultKey,
  useVault,
  useVaultStore,
  vaultSession,
} from "@chronicles-vault/vault";
import {
  DEMO_USER_ACCOUNT,
  useLibraryStore,
} from "@chronicles-vault/state";
import { PrivacyState, formatProgressAnchor } from "@chronicles-vault/domain";
import type { WorkId } from "@chronicles-vault/shared";
import { Badge, Button, EmptyState, Input, PageContainer, toast } from "@chronicles-vault/ui";
import { DEMO_VAULT_NOTES, DEMO_VAULT_PASSPHRASE } from "../utils/demo-vault-seed";

const vaultRepository = new IndexedDbVaultRepository(vaultSession);

interface VaultNote {
  id: string;
  entityId: string;
  decrypted: { title?: unknown; body?: unknown };
}

export interface VaultProps {
  onNavigateWork?: (id: string) => void;
}

export function Vault({ onNavigateWork }: VaultProps) {
  const { status, isUnlocked, unlock, lock, keyRecord, setKeyRecord } = useVault();
  const libraryStore = useLibraryStore();

  const [keyRecordLoaded, setKeyRecordLoaded] = React.useState(false);
  const [passphrase, setPassphrase] = React.useState(DEMO_VAULT_PASSPHRASE);
  const [confirmation, setConfirmation] = React.useState(DEMO_VAULT_PASSPHRASE);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [notes, setNotes] = React.useState<VaultNote[]>([]);
  const [search, setSearch] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [summaryCount, setSummaryCount] = React.useState<number | null>(null);
  const [workToHideId, setWorkToHideId] = React.useState<string>("");

  const hiddenWorks = React.useMemo(
    () =>
      libraryStore.items.filter(
        (item) => !item.work.deletedAt && item.work.privacyState === PrivacyState.Vault,
      ),
    [libraryStore.items],
  );

  const publicWorks = React.useMemo(
    () =>
      libraryStore.items.filter(
        (item) => !item.work.deletedAt && item.work.privacyState !== PrivacyState.Vault,
      ),
    [libraryStore.items],
  );

  React.useEffect(() => {
    let active = true;
    void Promise.all([vaultRepository.getKeyRecord(), vaultRepository.getSummary()])
      .then(([record, summary]) => {
        if (!active) return;
        setKeyRecord(record);
        setSummaryCount(summary.itemCount);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(
          loadError instanceof Error ? loadError.message : "Unable to load private vault storage.",
        );
      })
      .finally(() => {
        if (active) setKeyRecordLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [setKeyRecord]);

  React.useEffect(() => {
    if (!isUnlocked) {
      setNotes([]);
      setTitle("");
      setBody("");
      setSearch("");
      return;
    }

    let active = true;
    const masterKey = vaultSession.getMasterKey();
    if (!masterKey) return;
    setError("");
    void vaultRepository
      .list("note", masterKey)
      .then(async (records) => {
        if (!active || !vaultSession.isUnlocked()) return;
        if (records.length === 0) {
          for (const note of DEMO_VAULT_NOTES) {
            await vaultRepository.store(
              "note",
              crypto.randomUUID(),
              { title: note.title, body: note.body },
              masterKey,
            );
          }
          const seededRecords = await vaultRepository.list("note", masterKey);
          if (active) {
            setNotes(seededRecords as VaultNote[]);
            setSummaryCount(seededRecords.length);
          }
          return;
        }
        setNotes(records as VaultNote[]);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to read encrypted vault notes.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [isUnlocked]);

  const handleInstantDemoUnlock = async () => {
    setError("");
    setBusy(true);
    try {
      const existingRecord = keyRecord ?? (await vaultRepository.getKeyRecord());
      if (existingRecord) {
        const result = await unlock(DEMO_VAULT_PASSPHRASE, existingRecord);
        if (result.success) {
          toast({
            title: "DemoUser1 Vault Unlocked",
            description: `Revealed ${hiddenWorks.length} hidden works and encrypted notes. Vault auto-locks when browser closes.`,
            variant: "success",
          });
          return;
        }
      }
      const created = await createVaultKey(DEMO_VAULT_PASSPHRASE);
      await vaultRepository.saveKeyRecord(created.keyRecord);
      useVaultStore.getState().activateMasterKey(created.masterKey, created.keyRecord);
      toast({
        title: "DemoUser1 Vault Initialized & Unlocked",
        description: `Revealed ${hiddenWorks.length} hidden works for ${DEMO_USER_ACCOUNT.username}.`,
        variant: "success",
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to unlock DemoUser1 vault.");
    } finally {
      setBusy(false);
    }
  };

  const handleAccess = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const effectivePass = passphrase.trim() || DEMO_VAULT_PASSPHRASE;
      if (keyRecord) {
        const result = await unlock(effectivePass, keyRecord);
        if (!result.success) {
          // If the user clicked unlock with demo passphrase on a mismatched key, re-key for DemoUser1
          if (effectivePass === DEMO_VAULT_PASSPHRASE) {
            const created = await createVaultKey(DEMO_VAULT_PASSPHRASE);
            await vaultRepository.saveKeyRecord(created.keyRecord);
            useVaultStore.getState().activateMasterKey(created.masterKey, created.keyRecord);
            toast({
              title: "Vault Unlocked",
              description: `Revealed ${hiddenWorks.length} hidden works for ${DEMO_USER_ACCOUNT.username}.`,
              variant: "success",
            });
            return;
          }
          setError("Unable to unlock the vault. Check your passphrase or click 'Instant Unlock DemoUser1 Vault'.");
          return;
        }
        toast({
          title: "Vault unlocked",
          description: `Hidden works (${hiddenWorks.length}) and private notes are now visible for this session.`,
          variant: "success",
        });
        return;
      }

      if (effectivePass.length < 8) {
        setError("Choose a passphrase with at least 8 characters.");
        return;
      }
      const created = await createVaultKey(effectivePass);
      await vaultRepository.saveKeyRecord(created.keyRecord);
      useVaultStore.getState().activateMasterKey(created.masterKey, created.keyRecord);
      toast({
        title: "Vault created & unlocked",
        description: `Revealed ${hiddenWorks.length} hidden works on this device.`,
        variant: "success",
      });
    } catch (accessError: unknown) {
      setError(
        accessError instanceof Error
          ? accessError.message
          : "Unable to access private vault storage.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleToggleWorkPrivacy = (workId: WorkId, targetPrivacy: PrivacyState, workTitle: string) => {
    libraryStore.updateWork(workId, { privacyState: targetPrivacy });
    toast({
      title: targetPrivacy === PrivacyState.Vault ? "Work Sealed in Hidden Vault" : "Work Restored to Public Library",
      description:
        targetPrivacy === PrivacyState.Vault
          ? `"${workTitle}" will be concealed whenever the Vault is locked.`
          : `"${workTitle}" is now permanently visible in your public Library.`,
      variant: "success",
    });
  };

  const handleHideSelectedWork = () => {
    if (!workToHideId) return;
    const found = publicWorks.find((w) => w.work.id === workToHideId);
    if (!found) return;
    handleToggleWorkPrivacy(found.work.id, PrivacyState.Vault, found.work.title);
    setWorkToHideId("");
  };

  const handleSaveNote = async (event: React.FormEvent) => {
    event.preventDefault();
    const masterKey = vaultSession.getMasterKey();
    if (!masterKey) {
      setError("Vault is locked. Unlock it before saving a note.");
      return;
    }
    if (!title.trim() || !body.trim()) {
      setError("Enter both a title and note body.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await vaultRepository.store(
        "note",
        crypto.randomUUID(),
        {
          title: title.trim(),
          body: body.trim(),
        },
        masterKey,
      );
      const records = await vaultRepository.list("note", masterKey);
      setNotes(records as VaultNote[]);
      setSummaryCount((count) => (count === null ? null : count + 1));
      setTitle("");
      setBody("");
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save encrypted note.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteNote = async (note: VaultNote) => {
    try {
      await vaultRepository.delete(note.id);
      setNotes((current) => current.filter((item) => item.id !== note.id));
      setSummaryCount((count) => (count === null ? null : Math.max(0, count - 1)));
    } catch (deleteError: unknown) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Unable to delete encrypted note.",
      );
    }
  };

  const navigateToWork = (id: string) => {
    if (onNavigateWork) {
      onNavigateWork(id);
    } else {
      window.history.pushState({}, "", `/work/${encodeURIComponent(id)}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  if (!keyRecordLoaded) {
    return (
      <PageContainer maxWidth="narrow" className="py-16">
        <p className="text-center font-mono text-[var(--cv-text-muted)]">
          [ INITIALIZING AES-256 VAULT CHAMBER… ]
        </p>
      </PageContainer>
    );
  }

  if (!isUnlocked) {
    return (
      <PageContainer maxWidth="narrow" className="py-12">
        <div className="mx-auto max-w-lg border-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] p-8 shadow-[6px_6px_0px_var(--cv-border-strong)]">
          <div className="flex items-center justify-between border-b border-[var(--cv-border-strong)] pb-4 mb-6">
            <span className="font-mono text-cv-xs font-extrabold uppercase tracking-wider text-[var(--cv-accent-strong)]">
              [ 01 · ZERO-KNOWLEDGE VAULT GATE ]
            </span>
            <span className="inline-flex items-center gap-1.5 border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[var(--cv-text)]">
              <UserCheck className="h-3.5 w-3.5 text-[var(--cv-accent-strong)]" />
              {DEMO_USER_ACCOUNT.username}
            </span>
          </div>

          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center border-2 border-[var(--cv-border-strong)] bg-[var(--cv-surface)]">
              <Lock className="h-6 w-6 text-[var(--cv-warning)]" />
            </div>
            <div className="text-left">
              <h1 className="text-cv-xl font-extrabold text-[var(--cv-text)]">
                Vault Is Locked ({hiddenWorks.length} Hidden Works Sealed)
              </h1>
              <p className="mt-1 text-cv-xs leading-relaxed text-[var(--cv-text-muted)]">
                Unlock to reveal <strong>{hiddenWorks.length} hidden works</strong> (Anime, Movies &amp; Uncensored Novels) both here and in your main Library.
              </p>
            </div>
          </div>

          {/* 1-Click Instant Unlock Button for DemoUser1 */}
          <div className="mb-6 border-2 border-[var(--cv-accent)] bg-[var(--cv-surface)] p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-mono text-cv-xs font-extrabold uppercase text-[var(--cv-accent-strong)]">
                ✦ QUICK ACCESS FOR {DEMO_USER_ACCOUNT.username}
              </span>
              <code className="font-mono text-[11px] border border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] px-2 py-0.5 font-bold">
                {DEMO_VAULT_PASSPHRASE}
              </code>
            </div>
            <p className="text-cv-xs text-[var(--cv-text-muted)] mb-3">
              Click below to unlock the Vault immediately and reveal all {hiddenWorks.length} hidden works. When you close the web browser, the Vault automatically locks again.
            </p>
            <Button
              type="button"
              variant="default"
              onClick={() => void handleInstantDemoUnlock()}
              disabled={busy || status === "unlocking"}
              className="w-full gap-2 py-2.5 font-extrabold"
            >
              <Unlock className="h-4 w-4" />
              <span>
                {busy
                  ? "Unsealing Vault…"
                  : `1-Click Unlock ${DEMO_USER_ACCOUNT.username} Vault & Reveal ${hiddenWorks.length} Hidden Works`}
              </span>
            </Button>
          </div>

          <form onSubmit={handleAccess} className="space-y-3 border-t border-[var(--cv-border)] pt-4">
            <label className="block text-left font-mono text-[11px] font-bold uppercase text-[var(--cv-text-subtle)]">
              Or Unlock / Re-Key With Custom Passphrase:
            </label>
            <Input
              type="password"
              placeholder="Master passphrase (default: blossom-demo-2026)"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              autoComplete={keyRecord ? "current-password" : "new-password"}
            />
            {!keyRecord && (
              <Input
                type="password"
                placeholder="Confirm passphrase"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="new-password"
              />
            )}
            {error && (
              <p role="alert" className="text-left text-sm font-semibold text-[var(--cv-danger)]">
                {error}
              </p>
            )}
            <Button
              type="submit"
              variant="outline"
              className="w-full gap-2"
              disabled={busy || status === "unlocking"}
            >
              <KeyRound className="h-4 w-4" />
              <span>{busy ? "Working…" : "Unlock with Passphrase"}</span>
            </Button>
          </form>

          <div className="mt-5 border-t border-[var(--cv-border)] pt-3 flex items-center justify-between text-[11px] font-mono text-[var(--cv-text-subtle)]">
            <span>AUTO-LOCK: ON BROWSER CLOSE</span>
            <span>ENCRYPTION: AES-256-GCM</span>
          </div>
        </div>
      </PageContainer>
    );
  }

  const visibleNotes = notes.filter((note) => {
    const noteTitle = typeof note.decrypted.title === "string" ? note.decrypted.title : "";
    const noteBody = typeof note.decrypted.body === "string" ? note.decrypted.body : "";
    const query = search.trim().toLocaleLowerCase();
    return !query || `${noteTitle}\n${noteBody}`.toLocaleLowerCase().includes(query);
  });

  return (
    <PageContainer maxWidth="wide">
      {/* Top Vault Unlocked Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] p-5 shadow-[4px_4px_0px_var(--cv-border-strong)]">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[var(--cv-border-strong)] bg-[var(--cv-surface)]">
            <Unlock className="h-5 w-5 text-[var(--cv-success)]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-cv-2xl font-extrabold text-[var(--cv-text)]">
                Private Vault — Unlocked
              </h1>
              <span className="border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-2 py-0.5 font-mono text-cv-xs font-bold text-[var(--cv-accent-strong)]">
                ACCOUNT: {DEMO_USER_ACCOUNT.username}
              </span>
              <span className="border border-[var(--cv-success)] bg-[var(--cv-success-muted)] px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--cv-success)]">
                AUTO-LOCKS ON BROWSER CLOSE
              </span>
            </div>
            <p className="mt-1 text-cv-xs text-[var(--cv-text-muted)]">
              <strong>{hiddenWorks.length} hidden works</strong> are currently unsealed (also visible in your main Library while unlocked) +{" "}
              <strong>{summaryCount ?? notes.length} encrypted notes</strong>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              lock();
              toast({
                title: "Vault Locked",
                description: `${hiddenWorks.length} hidden works have been concealed again.`,
              });
            }}
            className="gap-1.5"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Lock Vault Now</span>
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm font-semibold text-[var(--cv-danger)]">
          {error}
        </p>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: HIDDEN / VAULTED WORKS (REVEALED WHEN UNLOCKED)
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mb-8 border-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] p-6 shadow-[4px_4px_0px_var(--cv-border-strong)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--cv-border-strong)] pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <FolderLock className="h-5 w-5 text-[var(--cv-accent-strong)]" />
              <h2 className="text-cv-lg font-extrabold text-[var(--cv-text)]">
                Hidden Vault Works ({hiddenWorks.length} Revealed)
              </h2>
            </div>
            <p className="text-cv-xs text-[var(--cv-text-muted)] mt-0.5">
              These works are completely hidden when the Vault is locked or after closing the browser. While unlocked, they appear both here and in your main Library.
            </p>
          </div>

          {/* Hide any public work into the Vault */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={workToHideId}
              onChange={(e) => setWorkToHideId(e.target.value)}
              className="h-9 border border-[var(--cv-border-strong)] bg-[var(--cv-bg)] px-3 text-cv-xs font-semibold text-[var(--cv-text)]"
            >
              <option value="">Select a public work to hide in Vault…</option>
              {publicWorks.map((item) => (
                <option key={item.work.id} value={item.work.id}>
                  {item.work.title} ({item.work.contentType.toUpperCase()})
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!workToHideId}
              onClick={handleHideSelectedWork}
              className="gap-1.5"
            >
              <EyeOff className="h-3.5 w-3.5" />
              <span>Hide in Vault</span>
            </Button>
          </div>
        </div>

        {hiddenWorks.length === 0 ? (
          <EmptyState
            variant="custom"
            icon={ShieldCheck}
            title="No hidden works currently in Vault"
            description="Use the selector above to hide any Anime, Movie, Web Series, or Novel inside your private Vault."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hiddenWorks.map((item) => {
              const anchor = item.relationship?.currentAnchor;
              const progressLabel = anchor ? formatProgressAnchor(anchor) : "Not started";
              const localPath = item.accessPaths.find((p) => p.kind === "local_file") as
                | { filePath?: string; label?: string }
                | undefined;

              return (
                <div
                  key={item.work.id}
                  className="flex gap-4 border-2 border-[var(--cv-border-strong)] bg-[var(--cv-surface)]/50 p-4 shadow-[3px_3px_0px_var(--cv-border-strong)]"
                >
                  {item.work.coverRef ? (
                    <img
                      src={item.work.coverRef}
                      alt={item.work.title}
                      className="h-32 w-22 object-cover border border-[var(--cv-border-strong)] shrink-0 bg-[var(--cv-bg)]"
                    />
                  ) : (
                    <div className="h-32 w-22 border border-[var(--cv-border-strong)] bg-[var(--cv-bg)] flex items-center justify-center font-mono text-cv-xs shrink-0">
                      VAULT
                    </div>
                  )}

                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <Badge variant="default" className="font-mono text-[10px] uppercase">
                          {item.work.contentType}
                        </Badge>
                        <span className="border border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--cv-accent-strong)]">
                          🔓 HIDDEN WORK REVEALED
                        </span>
                      </div>

                      <h3 className="font-extrabold text-cv-sm text-[var(--cv-text)] leading-snug">
                        {item.work.title}
                      </h3>

                      <p className="mt-1 text-cv-xs font-mono font-bold text-[var(--cv-accent-strong)]">
                        Progress: {progressLabel}
                      </p>

                      {localPath?.filePath && (
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-mono text-[var(--cv-text-muted)] truncate">
                          <HardDrive className="h-3 w-3 shrink-0 text-[var(--cv-success)]" />
                          <span className="truncate" title={localPath.filePath}>
                            {localPath.filePath}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2 flex-wrap pt-2 border-t border-[var(--cv-border)]">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => navigateToWork(item.work.id)}
                        className="gap-1.5 text-cv-xs"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Open Work</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleToggleWorkPrivacy(
                            item.work.id,
                            PrivacyState.Public,
                            item.work.title,
                          )
                        }
                        className="gap-1.5 text-cv-xs"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Unhide (Make Public)</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: ENCRYPTED PRIVATE NOTES (AES-GCM-256)
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <form
          onSubmit={handleSaveNote}
          className="space-y-3 border-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] p-5 shadow-[4px_4px_0px_var(--cv-border-strong)]"
        >
          <h2 className="font-extrabold text-[var(--cv-text)]">
            [ 02 · NEW ENCRYPTED PRIVATE NOTE ]
          </h2>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Note Title"
            maxLength={200}
          />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write an encrypted private note or spoiler log…"
            maxLength={20000}
            rows={7}
            className="w-full resize-y border border-[var(--cv-border-strong)] bg-[var(--cv-bg)] px-3 py-2 text-cv-sm text-[var(--cv-text)] outline-none focus:border-[var(--cv-accent)]"
          />
          <Button type="submit" disabled={busy} className="gap-2">
            <Plus className="h-4 w-4" />
            Save Encrypted Note
          </Button>
        </form>

        <section className="space-y-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search encrypted private notes…"
          />
          {visibleNotes.length === 0 ? (
            <EmptyState
              variant="custom"
              icon={Lock}
              title={notes.length === 0 ? "No private notes yet" : "No matching notes"}
              description={
                notes.length === 0
                  ? "Private notes are encrypted with AES-GCM-256 before being stored."
                  : "Try another search."
              }
            />
          ) : (
            <ul className="space-y-3">
              {visibleNotes.map((note) => (
                <li
                  key={note.id}
                  className="border-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] p-4 shadow-[3px_3px_0px_var(--cv-border-strong)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-bold text-[var(--cv-text)]">
                        {typeof note.decrypted.title === "string"
                          ? note.decrypted.title
                          : "Untitled note"}
                      </h2>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-[var(--cv-text-muted)]">
                        {typeof note.decrypted.body === "string" ? note.decrypted.body : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Delete private note"
                      onClick={() => void handleDeleteNote(note)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
