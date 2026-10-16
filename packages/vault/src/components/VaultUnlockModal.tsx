import React, { useState, useRef, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useVaultUnlock, useVaultStatus } from '../hooks/use-vault.js'
import type { VaultKeyRecord } from '../crypto/vault-key.js'

export interface VaultUnlockModalProps {
  /** Controls open state of the dialog */
  open: boolean
  /** Callback when open state changes (dismissed, cancelled, or closed) */
  onOpenChange: (open: boolean) => void
  /** Optional keyRecord (uses record in store if omitted) */
  keyRecord?: VaultKeyRecord
  /** Optional callback fired when vault successfully unlocks */
  onSuccess?: () => void
  /** Optional callback fired on unlock failure */
  onError?: (error: string) => void
}

/**
 * VaultUnlockModal provides a secure passphrase entry dialog.
 *
 * Guarantees:
 * - Uses Radix Dialog for accessible focus management & keyboard interaction
 * - Secure passphrase input: wiped from React state on success/close
 * - Real-time progress state during Argon2id derivation (~1s memory-hard compute)
 * - Clear error display for incorrect passphrase or missing key record
 * - Explicit Cancel / Dismiss buttons (never traps user)
 * - Zero page reload upon unlock
 */
export const VaultUnlockModal: React.FC<VaultUnlockModalProps> = ({
  open,
  onOpenChange,
  keyRecord,
  onSuccess,
  onError,
}) => {
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDeriving, setIsDeriving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const unlock = useVaultUnlock()
  const status = useVaultStatus()

  // Reset internal state when modal opens or closes
  useEffect(() => {
    if (open) {
      setError(null)
      setPassphrase('')
      setIsDeriving(false)
      // Focus the input
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      // Zero out passphrase string when dismissed
      setPassphrase('')
      setError(null)
      setIsDeriving(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passphrase || isDeriving) return

    setError(null)
    setIsDeriving(true)

    try {
      const result = await unlock(passphrase, keyRecord)

      if (result.success) {
        setPassphrase('')
        setIsDeriving(false)
        onOpenChange(false)
        onSuccess?.()
      } else {
        const errorMsg = result.error || 'Incorrect passphrase'
        setError(errorMsg)
        setIsDeriving(false)
        onError?.(errorMsg)
        inputRef.current?.select()
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to unlock vault'
      setError(errorMsg)
      setIsDeriving(false)
      onError?.(errorMsg)
      inputRef.current?.select()
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Backdrop Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity" />

        {/* Modal Content */}
        <Dialog.Content
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl transition-all focus:outline-none text-zinc-100"
          onEscapeKeyDown={() => onOpenChange(false)}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold tracking-tight text-zinc-100">
                  Unlock Private Vault
                </Dialog.Title>
                <Dialog.Description className="text-xs text-zinc-400 mt-0.5">
                  Enter your vault passphrase to decrypt your protected records.
                </Dialog.Description>
              </div>
            </div>

            {/* Top Close Button */}
            <Dialog.Close asChild>
              <button
                type="button"
                className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-900 transition-colors"
                aria-label="Close dialog"
                disabled={isDeriving}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="vault-passphrase-input"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Passphrase
              </label>
              <input
                ref={inputRef}
                id="vault-passphrase-input"
                type="password"
                value={passphrase}
                onChange={(e) => {
                  setPassphrase(e.target.value)
                  if (error) setError(null)
                }}
                disabled={isDeriving}
                placeholder="Enter your master passphrase..."
                autoComplete="current-password"
                className="w-full px-3 py-2 text-sm bg-zinc-900/90 border border-zinc-700/80 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 disabled:opacity-50 transition-colors"
              />
            </div>

            {/* Error Message Banner */}
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 animate-in fade-in duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 shrink-0 text-red-400"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Derivation Progress Indicator */}
            {isDeriving && (
              <div className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300 animate-pulse">
                <svg
                  className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Deriving key with Argon2id (64MB memory-hard compute)...</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={isDeriving}
                  className="px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </Dialog.Close>

              <button
                type="submit"
                disabled={!passphrase.trim() || isDeriving}
                className="inline-flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isDeriving ? (
                  <>
                    <svg
                      className="w-3.5 h-3.5 animate-spin text-zinc-950"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Unlocking...</span>
                  </>
                ) : (
                  'Unlock Vault'
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
