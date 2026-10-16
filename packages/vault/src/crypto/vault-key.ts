import { randomBytes } from '@noble/hashes/utils'
import { generateKdfParams, deriveKey, type KdfParams } from './kdf.js'
import { encrypt, decrypt, type EncryptedPayload } from './encryption.js'
import { bytesToBase64, base64ToBytes } from './kdf.js'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VaultKeyRecord {
  version: 1
  kdfParams: KdfParams
  /** The 256-bit master key, encrypted with the passphrase-derived wrapping key. */
  encryptedMasterKeyBase64: string
  createdAt: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new vault key from a user passphrase.
 *
 * Steps:
 *  1. Generate random KDF salt + parameters
 *  2. Derive a 256-bit wrapping key from the passphrase via Argon2id
 *  3. Generate a fresh 256-bit master key (raw random bytes)
 *  4. Encrypt the master key bytes with the wrapping key (AES-GCM)
 *  5. Import the master key as a non-extractable CryptoKey
 *  6. Return both the persisted VaultKeyRecord and the live CryptoKey
 *
 * The passphrase is never stored. The master key raw bytes are zeroed after import.
 */
export async function createVaultKey(passphrase: string): Promise<{
  keyRecord: VaultKeyRecord
  masterKey: CryptoKey
}> {
  // 1 & 2 — KDF
  const kdfParams = generateKdfParams()
  const wrappingKey = await deriveKey(passphrase, kdfParams)

  // 3 — Generate raw master key material
  const masterKeyBytes = randomBytes(32) // 256-bit AES-GCM key

  let encryptedMasterKey: EncryptedPayload
  let masterKey: CryptoKey
  try {
    encryptedMasterKey = await encrypt(bytesToBase64(masterKeyBytes), wrappingKey)
    masterKey = await crypto.subtle.importKey(
      'raw',
      masterKeyBytes as unknown as BufferSource,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    )
  } finally {
    masterKeyBytes.fill(0)
  }

  const keyRecord: VaultKeyRecord = {
    version: 1,
    kdfParams,
    encryptedMasterKeyBase64: JSON.stringify(encryptedMasterKey),
    createdAt: new Date().toISOString(),
  }

  return { keyRecord, masterKey }
}

/**
 * Unlock the vault by re-deriving the wrapping key from the passphrase and
 * decrypting the stored master key.
 *
 * Throws if the passphrase is wrong (GCM auth tag mismatch → DOMException).
 */
export async function unlockVaultKey(
  passphrase: string,
  keyRecord: VaultKeyRecord,
): Promise<CryptoKey> {
  if (keyRecord.version !== 1 || keyRecord.kdfParams.version !== 1) {
    throw new Error('Unsupported vault key record version.')
  }
  // Re-derive the wrapping key using the stored KDF params
  const wrappingKey = await deriveKey(passphrase, keyRecord.kdfParams)

  // Decrypt the wrapped master key
  const encryptedPayload: EncryptedPayload = JSON.parse(keyRecord.encryptedMasterKeyBase64)
  const masterKeyBase64 = await decrypt(encryptedPayload, wrappingKey)

  const masterKeyBytes = base64ToBytes(masterKeyBase64)
  try {
    if (masterKeyBytes.length !== 32) throw new Error('Vault master key has an invalid length.')
    return await crypto.subtle.importKey(
      'raw',
      masterKeyBytes as unknown as BufferSource,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    )
  } finally {
    masterKeyBytes.fill(0)
  }
}
