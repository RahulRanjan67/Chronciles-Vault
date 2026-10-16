// ── Crypto ───────────────────────────────────────────────────────────────────
export {
  generateKdfParams,
  deriveKey,
  bytesToBase64,
  base64ToBytes,
  encrypt,
  decrypt,
  createVaultKey,
  unlockVaultKey,
} from './crypto/index.js'
export type {
  KdfParams,
  EncryptedPayload,
  VaultKeyRecord,
} from './crypto/index.js'

// ── Session ──────────────────────────────────────────────────────────────────
export {
  createVaultSession,
  vaultSession,
} from './session/index.js'
export type {
  VaultSession,
  VaultSessionState,
  VaultStatus,
} from './session/index.js'

// ── Store ────────────────────────────────────────────────────────────────────
export {
  useVaultStore,
  selectVaultStatus,
  selectIsUnlocked,
  selectItemCount,
  selectLastLockedAt,
} from './store/index.js'
export type {
  VaultStore,
} from './store/index.js'

// ── Repository ───────────────────────────────────────────────────────────────
export {
  createVaultRepository,
  InMemoryVaultRepository,
  IndexedDbVaultRepository,
  SqliteVaultRepository,
} from './repository/index.js'
export type {
  VaultItem,
  VaultSummary,
  VaultRepository,
  VaultRepositoryOptions,
} from './repository/index.js'

// ── Search ───────────────────────────────────────────────────────────────────
export {
  createVaultSearchIndex,
  InMemoryVaultSearchIndex,
  vaultSearchIndex,
} from './search/index.js'
export type {
  VaultIndexableItem,
  VaultSearchResult,
  VaultSearchIndex,
} from './search/index.js'

// ── Hooks ────────────────────────────────────────────────────────────────────
export {
  useVaultStatus,
  useIsVaultUnlocked,
  useVaultUnlock,
  useVaultLock,
  useVaultSummary,
  useVault,
  useVaultAutoLock,
} from './hooks/index.js'
export type {
  UseVaultAutoLockOptions,
} from './hooks/index.js'

// ── Scrubber ─────────────────────────────────────────────────────────────────
export {
  scrubWork,
  scrubWorkList,
  scrubMemory,
  scrubMemoryList,
  scrubTags,
  isPrivateTag,
  isPrivateState,
  maskSensitiveText,
} from './scrubber/privacy-scrubber.js'
export type {
  PrivacyLevel,
  PrivacyScrubberOptions,
  ScrubSafetyFlags,
  ScrubbedWork,
  ScrubbedMemory,
} from './scrubber/privacy-scrubber.js'

// ── Components ───────────────────────────────────────────────────────────────
export {
  VaultLockButton,
  VaultUnlockModal,
  VaultLockedBanner,
  VaultStatusIndicator,
} from './components/index.js'
export type {
  VaultLockButtonProps,
  VaultUnlockModalProps,
  VaultLockedBannerProps,
  VaultStatusIndicatorProps,
} from './components/index.js'
