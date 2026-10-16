import { IndexedDbVaultRepository, vaultSession } from "@chronicles-vault/vault";

/**
 * Shared access to unlocked Private Vault notes for client features that need
 * to read them (command palette search, publication leak checks). Notes are
 * decrypted only while the vault is unlocked and are never persisted here.
 */

export const vaultRepository = new IndexedDbVaultRepository(vaultSession);

export interface UnlockedVaultNote {
  readonly id: string;
  readonly title: string;
  readonly body: string;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function loadUnlockedVaultNotes(): Promise<UnlockedVaultNote[]> {
  const masterKey = vaultSession.getMasterKey();
  if (!masterKey || !vaultSession.isUnlocked()) return [];
  const records = await vaultRepository.list("note", masterKey);
  if (!vaultSession.isUnlocked()) return [];
  return records.map((record) => ({
    id: record.id,
    title: asText(record.decrypted.title),
    body: asText(record.decrypted.body),
  }));
}

/** True when a vault has been set up on this device, whether or not it is unlocked. */
export async function vaultHasKeyRecord(): Promise<boolean> {
  return (await vaultRepository.getKeyRecord()) !== null;
}
