import React from 'react'
import { useVaultStore, selectItemCount } from '../store/vault-store.js'

export interface VaultLockedBannerProps {
  /** Optional custom CSS classes */
  className?: string
  /** Explicit item count to show (falls back to store itemCount or default text) */
  itemCount?: number | null
  /** Callback invoked when the Unlock button is clicked */
  onUnlockClick?: () => void
}

/**
 * VaultLockedBanner is displayed inside private vault views or sections when locked.
 *
 * UI layout:
 *   Private Vault
 *   12 protected items
 *   [Unlock]
 */
export const VaultLockedBanner: React.FC<VaultLockedBannerProps> = ({
  className = '',
  itemCount: explicitCount,
  onUnlockClick,
}) => {
  const storeItemCount = useVaultStore(selectItemCount)
  const count = explicitCount !== undefined ? explicitCount : storeItemCount

  const countDisplay =
    count !== null && count !== undefined
      ? `${count} protected item${count === 1 ? '' : 's'}`
      : 'Protected items encrypted at rest'

  return (
    <div
      role="region"
      aria-label="Private Vault Locked"
      className={`relative overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-6 md:p-8 text-center text-zinc-100 shadow-xl ${className}`}
    >
      {/* Decorative subtle amber radial glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-72 rounded-full bg-amber-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex max-w-sm flex-col items-center">
        {/* Lock Shield Icon */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold tracking-tight text-zinc-100">
          Private Vault
        </h3>

        {/* Protected items count */}
        <p className="mt-1 text-sm font-medium text-amber-400/90">
          {countDisplay}
        </p>

        {/* Informative description */}
        <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
          Content is end-to-end encrypted with AES-256-GCM. Unlock with your master
          passphrase to view and search private records.
        </p>

        {/* Unlock Action Button */}
        {onUnlockClick && (
          <div className="mt-6">
            <button
              type="button"
              onClick={onUnlockClick}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/50 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5"
                aria-hidden="true"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
              <span>Unlock Vault</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
