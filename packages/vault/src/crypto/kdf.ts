import { argon2id } from '@noble/hashes/argon2'
import { randomBytes } from '@noble/hashes/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface KdfParams {
  version: 1
  algorithm: 'argon2id'
  saltBase64: string  // 32 random bytes, base64url
  memoryCost: number  // default 65536 (64 MB)
  timeCost: number    // default 3 iterations
  parallelism: number // default 1
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate fresh KDF parameters with a secure random 32-byte salt.
 * These parameters MUST be persisted alongside the encrypted master key so the
 * same key can be re-derived on every unlock.
 */
export function generateKdfParams(): KdfParams {
  const salt = randomBytes(32)
  const params: KdfParams = {
    version: 1,
    algorithm: 'argon2id',
    saltBase64: bytesToBase64(salt),
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 1,
  }
  salt.fill(0)
  return params
}

/**
 * Derive a 256-bit AES-GCM CryptoKey from a user passphrase using Argon2id.
 *
 * NOTE: Uses @noble/hashes for Argon2id (Web Crypto API does NOT support it).
 *       The resulting raw bytes are then imported into the Web Crypto API as a
 *       non-extractable CryptoKey so they cannot be accidentally serialised.
 */
export async function deriveKey(
  passphrase: string,
  params: KdfParams,
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordBytes = encoder.encode(passphrase)
  const saltBytes = base64ToBytes(params.saltBase64)
  if (
    params.version !== 1 ||
    params.algorithm !== 'argon2id' ||
    saltBytes.length !== 32 ||
    !Number.isInteger(params.memoryCost) ||
    params.memoryCost < 8 ||
    params.memoryCost > 65536 ||
    !Number.isInteger(params.timeCost) ||
    params.timeCost < 1 ||
    params.timeCost > 3 ||
    !Number.isInteger(params.parallelism) ||
    params.parallelism < 1 ||
    params.parallelism > 1
  ) {
    passwordBytes.fill(0)
    saltBytes.fill(0)
    throw new Error('Vault key derivation parameters are invalid or exceed safe resource limits.')
  }

  let derivedBytes: Uint8Array | undefined
  try {
    derivedBytes = argon2id(passwordBytes, saltBytes, {
      m: params.memoryCost,
      t: params.timeCost,
      p: params.parallelism,
      dkLen: 32,
    })
    return await crypto.subtle.importKey(
      'raw',
      derivedBytes as unknown as BufferSource,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    )
  } finally {
    derivedBytes?.fill(0)
    passwordBytes.fill(0)
    saltBytes.fill(0)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
