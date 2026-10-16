import React from 'react'
import { useVaultStatus } from '../hooks/use-vault.js'

export interface VaultStatusIndicatorProps {
  /** Optional custom CSS classes */
  className?: string
  /** Whether to show text label next to dot (default true) */
  showLabel?: boolean
  /** Optional click handler (e.g. to open unlock dialog or lock) */
  onClick?: () => void
}

/**
 * VaultStatusIndicator displays a reactive status dot and label for sidebars or headers.
 *
 * Status states:
 * - unlocked: Emerald dot with subtle glow + 'Vault Unlocked'
 * - locked: Amber/muted dot + 'Vault Locked'
 * - unlocking: Yellow pulsing dot + 'Unlocking...'
 * - locking: Amber pulsing dot + 'Locking...'
 */
export const VaultStatusIndicator: React.FC<VaultStatusIndicatorProps> = ({
  className = '',
  showLabel = true,
  onClick,
}) => {
  const status = useVaultStatus()

  const config = {
    unlocked: {
      dotColor: 'bg-emerald-400',
      pingColor: 'bg-emerald-400/40',
      textColor: 'text-emerald-400',
      label: 'Vault Unlocked',
    },
    locked: {
      dotColor: 'bg-zinc-500',
      pingColor: 'bg-zinc-500/20',
      textColor: 'text-zinc-400',
      label: 'Vault Locked',
    },
    unlocking: {
      dotColor: 'bg-amber-400 animate-pulse',
      pingColor: 'bg-amber-400/50',
      textColor: 'text-amber-300',
      label: 'Unlocking...',
    },
    locking: {
      dotColor: 'bg-amber-500 animate-pulse',
      pingColor: 'bg-amber-500/50',
      textColor: 'text-amber-400',
      label: 'Locking...',
    },
  }[status]

  const content = (
    <span className={`inline-flex items-center gap-2 text-xs font-medium ${className}`}>
      {/* Dot with optional ping */}
      <span className="relative flex h-2 w-2">
        {status === 'unlocked' && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pingColor}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`} />
      </span>

      {showLabel && <span className={config.textColor}>{config.label}</span>}
    </span>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center hover:opacity-80 transition-opacity focus:outline-none focus:ring-1 focus:ring-zinc-700 rounded px-1 py-0.5"
        title={config.label}
        aria-label={config.label}
      >
        {content}
      </button>
    )
  }

  return content
}
