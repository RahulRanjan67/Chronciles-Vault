import { describe, it, expect } from 'vitest'
import {
  generateKdfParams,
  deriveKey,
  encrypt,
  decrypt,
  createVaultKey,
  unlockVaultKey,
} from '../index.js'

describe('Vault Cryptography', () => {
  it('generates secure KDF parameters with 32-byte salt', () => {
    const params = generateKdfParams()
    expect(params.version).toBe(1)
    expect(params.algorithm).toBe('argon2id')
    expect(params.memoryCost).toBe(65536)
    expect(params.timeCost).toBe(3)
    expect(params.parallelism).toBe(1)

    // Salt is base64 of 32 bytes -> 44 chars
    expect(params.saltBase64.length).toBeGreaterThanOrEqual(40)
  })

  it('generates unique salts across multiple calls', () => {
    const p1 = generateKdfParams()
    const p2 = generateKdfParams()
    expect(p1.saltBase64).not.toBe(p2.saltBase64)
  })

  it('encrypts and decrypts UTF-8 plaintext with AES-256-GCM', async () => {
    const params = generateKdfParams()
    // For fast unit testing, use lower memoryCost/timeCost in raw deriveKey if needed,
    // or test with standard params
    const key = await deriveKey('test-passphrase-123', {
      ...params,
      memoryCost: 1024, // low cost for quick test run
      timeCost: 1,
    })

    const secretText = 'Chronicles Vault Confidential Memory Note 42'
    const payload = await encrypt(secretText, key)

    expect(payload.version).toBe(1)
    expect(payload.algorithm).toBe('aes-gcm-256')
    expect(payload.ivBase64).toBeDefined()
    expect(payload.ciphertextBase64).toBeDefined()
    expect(payload.ciphertextBase64).not.toBe(secretText)

    const decrypted = await decrypt(payload, key)
    expect(decrypted).toBe(secretText)
  })

  it('Invariant 6: Each encrypted item uses a unique random IV', async () => {
    const params = generateKdfParams()
    const key = await deriveKey('test-passphrase-iv', {
      ...params,
      memoryCost: 1024,
      timeCost: 1,
    })

    const text = 'Same plaintext content'
    const payload1 = await encrypt(text, key)
    const payload2 = await encrypt(text, key)

    expect(payload1.ivBase64).not.toBe(payload2.ivBase64)
    expect(payload1.ciphertextBase64).not.toBe(payload2.ciphertextBase64)
  })

  it('fails decryption with wrong key', async () => {
    const params = generateKdfParams()
    const key1 = await deriveKey('passphrase-one', {
      ...params,
      memoryCost: 1024,
      timeCost: 1,
    })
    const key2 = await deriveKey('passphrase-two', {
      ...params,
      memoryCost: 1024,
      timeCost: 1,
    })

    const payload = await encrypt('super secret', key1)
    await expect(decrypt(payload, key2)).rejects.toThrow()
  })

  it('Invariant 5: Argon2id params are stored alongside encrypted key (re-derivable)', async () => {
    const { keyRecord, masterKey } = await createVaultKey('my-vault-passphrase')

    expect(keyRecord.version).toBe(1)
    expect(keyRecord.kdfParams).toBeDefined()
    expect(keyRecord.kdfParams.algorithm).toBe('argon2id')
    expect(keyRecord.encryptedMasterKeyBase64).toBeDefined()
    expect(masterKey).toBeInstanceOf(CryptoKey)

    // Unlock with correct passphrase using the stored keyRecord
    const unlockedMasterKey = await unlockVaultKey('my-vault-passphrase', keyRecord)
    expect(unlockedMasterKey).toBeInstanceOf(CryptoKey)

    // Encrypt with original masterKey, decrypt with unlockedMasterKey
    const testData = JSON.stringify({ hello: 'chronicles' })
    const payload = await encrypt(testData, masterKey)
    const decrypted = await decrypt(payload, unlockedMasterKey)
    expect(decrypted).toBe(testData)
  }, 15000)

  it('Invariant 7: Rejects unlock with incorrect passphrase', async () => {
    const { keyRecord } = await createVaultKey('correct-passphrase')

    await expect(unlockVaultKey('wrong-passphrase', keyRecord)).rejects.toThrow()
  }, 15000)
})
