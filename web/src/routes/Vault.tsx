import * as React from "react";
import { KeyRound, Lock, Plus, Trash2, Unlock } from "lucide-react";
import {
  IndexedDbVaultRepository,
  createVaultKey,
  useVault,
  useVaultStore,
  vaultSession,
} from "@chronicles-vault/vault";
import { Button, EmptyState, Input, PageContainer, toast } from "@chronicles-vault/ui";

const vaultRepository = new IndexedDbVaultRepository(vaultSession);

interface VaultNote {
  id: string;
  entityId: string;
  decrypted: { title?: unknown; body?: unknown };
}

export function Vault() {
  const { status, isUnlocked, unlock, lock, keyRecord, setKeyRecord } = useVault();
  const [keyRecordLoaded, setKeyRecordLoaded] = React.useState(false);
  const [passphrase, setPassphrase] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [notes, setNotes] = React.useState<VaultNote[]>([]);
  const [search, setSearch] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [summaryCount, setSummaryCount] = React.useState<number | null>(null);

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
      setPassphrase("");
      setConfirmation("");
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
      .then((records) => {
        if (!active || !vaultSession.isUnlocked()) return;
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

  const handleAccess = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (keyRecord) {
        const result = await unlock(passphrase, keyRecord);
        if (!result.success) {
          setError("Unable to unlock the vault. Check your passphrase and try again.");
          return;
        }
        setPassphrase("");
        toast({
          title: "Vault unlocked",
          description: "Private notes are decrypted only for this session.",
          variant: "success",
        });
        return;
      }

      if (passphrase.length < 12) {
        setError("Choose a passphrase with at least 12 characters.");
        return;
      }
      if (passphrase !== confirmation) {
        setError("The passphrases do not match.");
        return;
      }
      const created = await createVaultKey(passphrase);
      await vaultRepository.saveKeyRecord(created.keyRecord);
      useVaultStore.getState().activateMasterKey(created.masterKey, created.keyRecord);
      setPassphrase("");
      setConfirmation("");
      toast({
        title: "Vault created",
        description: "Your private vault is encrypted on this device.",
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

  // DEVELOPMENT ONLY: fills the demo passphrase. Guarded by import.meta.env.DEV
  // so the demo module is tree-shaken from production builds.
  const handleDevFillDemo = async () => {
    if (!import.meta.env.DEV) return;
    const { DEMO_VAULT_PASSPHRASE } = await import("../utils/demo-vault-seed");
    setPassphrase(DEMO_VAULT_PASSPHRASE);
    setConfirmation(DEMO_VAULT_PASSPHRASE);
  };

  // DEVELOPMENT ONLY: stores fictional demo notes through the unlocked session.
  const handleDevLoadDemo = async () => {
    if (!import.meta.env.DEV) return;
    const masterKey = vaultSession.getMasterKey();
    if (!masterKey) {
      setError("Unlock the vault before loading demo entries.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { DEMO_VAULT_NOTES } = await import("../utils/demo-vault-seed");
      for (const note of DEMO_VAULT_NOTES) {
        await vaultRepository.store("note", crypto.randomUUID(), { title: note.title, body: note.body }, masterKey);
      }
      const records = await vaultRepository.list("note", masterKey);
      setNotes(records as VaultNote[]);
      setSummaryCount(records.length);
      toast({ title: "Demo entries loaded", description: "Development data only.", variant: "success" });
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load demo entries.");
    } finally {
      setBusy(false);
    }
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

  if (!keyRecordLoaded) {
    return (
      <PageContainer maxWidth="narrow" className="py-16">
        <p className="text-center text-[var(--cv-text-muted)]">Loading private vault…</p>
      </PageContainer>
    );
  }

  if (!isUnlocked) {
    return (
      <PageContainer maxWidth="narrow" className="py-16">
        <div className="mx-auto max-w-md rounded-cv-2xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-cv-full border border-[var(--cv-border)] bg-[var(--cv-surface)]">
            <Lock className="h-6 w-6 text-[var(--cv-warning)]" />
          </div>
          <h1 className="text-cv-xl font-bold text-[var(--cv-text)]">
            {keyRecord ? "Vault is Locked" : "Create Your Vault"}
          </h1>
          <p className="mt-2 text-cv-xs leading-relaxed text-[var(--cv-text-muted)]">
            {keyRecord
              ? "Enter your passphrase to decrypt private notes on this device."
              : "Choose a strong passphrase. It cannot be recovered if lost."}
          </p>
          <form onSubmit={handleAccess} className="mt-6 space-y-4">
            <Input
              type="password"
              placeholder="Master passphrase"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              autoComplete={keyRecord ? "current-password" : "new-password"}
              autoFocus
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
              <p role="alert" className="text-left text-sm text-[var(--cv-danger)]">
                {error}
              </p>
            )}
            {import.meta.env.DEV && (
              <div className="flex flex-col gap-1.5 pt-1 text-left">
                <button
                  type="button"
                  onClick={() => void handleDevFillDemo()}
                  className="inline-flex items-center gap-1.5 text-cv-xs text-[var(--cv-accent-strong)] hover:underline cursor-pointer"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Auto-fill test password: <code className="font-mono bg-[var(--cv-surface)] px-1.5 py-0.5 rounded border border-[var(--cv-border)]">blossom-demo-2026</code></span>
                </button>
                <p className="text-[11px] text-[var(--cv-text-subtle)]">
                  Use this demo password for testing encrypted private notes & zero-knowledge security.
                </p>
              </div>
            )}
            <Button
              type="submit"
              variant="default"
              className="w-full gap-2"
              disabled={busy || status === "unlocking"}
            >
              <KeyRound className="h-4 w-4" />
              <span>{busy ? "Working…" : keyRecord ? "Unlock Vault" : "Create Vault"}</span>
            </Button>
          </form>
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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Unlock className="h-6 w-6 text-[var(--cv-warning)]" />
          <div>
            <h1 className="text-cv-2xl font-extrabold text-[var(--cv-text)]">Private Vault</h1>
            <p className="text-cv-xs text-[var(--cv-text-muted)]">
              {summaryCount ?? notes.length} encrypted item
              {(summaryCount ?? notes.length) === 1 ? "" : "s"} stored on this device.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            lock();
            toast({ title: "Vault locked" });
          }}
          className="gap-1.5"
        >
          <Lock className="h-3.5 w-3.5" />
          <span>Lock Vault</span>
        </Button>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm text-[var(--cv-danger)]">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <form
          onSubmit={handleSaveNote}
          className="space-y-3 rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-5"
        >
          <h2 className="font-semibold text-[var(--cv-text)]">Private note</h2>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            maxLength={200}
          />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a private note…"
            maxLength={20000}
            rows={7}
            className="w-full resize-y rounded-cv border border-[var(--cv-border)] bg-[var(--cv-bg)] px-3 py-2 text-cv-sm text-[var(--cv-text)] outline-none focus:border-[var(--cv-accent)]"
          />
          <Button type="submit" disabled={busy} className="gap-2">
            <Plus className="h-4 w-4" />
            Save encrypted note
          </Button>
        </form>

        <section className="space-y-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search private notes"
          />
          {import.meta.env.DEV && (
            <div className="flex items-center justify-between p-3 rounded-cv-lg border border-[var(--cv-accent)]/30 bg-[var(--cv-accent)]/10 text-cv-xs">
              <div>
                <span className="font-semibold text-[var(--cv-text)]">Sample Private Notes</span>
                <p className="text-[11px] text-[var(--cv-text-muted)]">Includes R18 drafts, forbidden romance, taboo cultivation & secret diaries.</p>
              </div>
              <Button variant="default" size="sm" disabled={busy} onClick={() => void handleDevLoadDemo()} className="shrink-0">
                {busy ? "Loading…" : "Load Sample Notes"}
              </Button>
            </div>
          )}
          {visibleNotes.length === 0 ? (
            <EmptyState
              variant="custom"
              icon={Lock}
              title={notes.length === 0 ? "No private notes yet" : "No matching notes"}
              description={
                notes.length === 0
                  ? "Private notes are encrypted with AES-GCM-256 before being stored. Use the button above to load sample entries."
                  : "Try another search."
              }
            />
          ) : (
            <ul className="space-y-3">
              {visibleNotes.map((note) => (
                <li
                  key={note.id}
                  className="rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-semibold text-[var(--cv-text)]">
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
