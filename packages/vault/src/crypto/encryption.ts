import { randomBytes } from '@noble/hashes/utils'
import { bytesToBase64, base64ToBytes } from './kdf.js'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface EncryptedPayload {
  version: 1
  algorithm: 'aes-gcm-256'
  ivBase64: string         // 12 random bytes
  ciphertextBase64: string // ciphertext + 16-byte GCM auth tag appended by SubtleCrypto
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encrypt a UTF-8 string with AES-256-GCM.
 *
 * Uses Web Crypto SubtleCrypto for the symmetric cipher (widely supported,
 * hardware-accelerated). A fresh random 12-byte IV is generated per call.
 * The GCM authentication tag is appended to the ciphertext by SubtleCrypto.
 *
 * NEVER call this with a locked (null) key — callers must guard before calling.
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey,
): Promise<EncryptedPayload> {
  const iv = randomBytes(12) // 96-bit IV — recommended for AES-GCM
  const encoder = new TextEncoder()
  const plaintextBytes = encoder.encode(plaintext)

  let ciphertextBuffer: ArrayBuffer
  try {
    ciphertextBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      plaintextBytes as unknown as BufferSource,
    )
  } finally {
    plaintextBytes.fill(0)
  }

  return {
    version: 1,
    algorithm: 'aes-gcm-256',
    ivBase64: bytesToBase64(iv),
    ciphertextBase64: bytesToBase64(new Uint8Array(ciphertextBuffer)),
  }
}

/**
 * Decrypt an EncryptedPayload back to a UTF-8 string.
 *
 * Throws `DOMException` (OperationError) if the auth tag does not match —
 * this is the signal for a wrong passphrase.
 */
export async function decrypt(
  payload: EncryptedPayload,
  key: CryptoKey,
): Promise<string> {
  if (payload.version !== 1 || payload.algorithm !== 'aes-gcm-256') {
    throw new Error(`Unsupported payload format: v${payload.version} ${payload.algorithm}`)
  }

  const iv = base64ToBytes(payload.ivBase64)
  const ciphertext = base64ToBytes(payload.ciphertextBase64)

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    ciphertext as unknown as BufferSource,
  )

  const decoder = new TextDecoder()
  const plaintextBytes = new Uint8Array(plaintextBuffer)
  try {
    return decoder.decode(plaintextBytes)
  } finally {
    plaintextBytes.fill(0)
  }
}
