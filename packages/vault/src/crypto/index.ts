export { generateKdfParams, deriveKey, bytesToBase64, base64ToBytes } from './kdf.js'
export type { KdfParams } from './kdf.js'

export { encrypt, decrypt } from './encryption.js'
export type { EncryptedPayload } from './encryption.js'

export { createVaultKey, unlockVaultKey } from './vault-key.js'
export type { VaultKeyRecord } from './vault-key.js'
