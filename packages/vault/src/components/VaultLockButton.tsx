import React from 'react'
import { useVaultStatus, useVaultLock } from '../hooks/use-vault.js'

export interface VaultLockButtonProps {
  /** Optional additional CSS classes */
  className?: string
  /** Whether to show text label next to the icon (default false for compact sidebar icon) */
  showLabel?: boolean
  /** Custom label text (default 'Lock Vault') */
  label?: string
  /** Optional callback fired after locking */
  onLocked?: () => void
}

/**
 * Compact lock button designed for sidebars, top bars, or navigation rails.
 * Clicking immediately discards the master key and transitions to locked state
 * reactively without page reload.
 */
export const VaultLockButton: React.FC<VaultLockButtonProps> = ({
  className = '',
  showLabel = false,
  label = 'Lock Vault',
  onLocked,
}) => {
  const status = useVaultStatus()
  const lock = useVaultLock()

  const isUnlocked = status === 'unlocked'

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!isUnlocked) return
    lock()
    onLocked?.()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isUnlocked}
      aria-label="Lock Private Vault"
      title={isUnlocked ? 'Lock Vault' : 'Vault is locked'}
      className={`inline-flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors select-none ${
        isUnlocked
          ? 'text-amber-300 hover:text-amber-100 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 cursor-pointer active:scale-95'
          : 'text-zinc-500 bg-zinc-900/30 border border-zinc-800/40 cursor-not-allowed opacity-60'
      } ${className}`}
    >
      {/* Lock Icon SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5 shrink-0"
        aria-hidden="true"
      >
        {isUnlocked ? (
          // Unlocked icon indicating action to lock
          <>
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          </>
        ) : (
          // Locked icon
          <>
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </>
        )}
      </svg>
      {showLabel && <span>{label}</span>}
    </button>
  )
}
