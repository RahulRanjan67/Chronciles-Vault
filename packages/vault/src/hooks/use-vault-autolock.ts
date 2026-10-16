import { useEffect, useRef } from 'react'
import { useVaultStore, selectIsUnlocked } from '../store/vault-store.js'

export interface UseVaultAutoLockOptions {
  /**
   * Timeout in minutes before auto-locking due to inactivity.
   * Defaults to 15 minutes. Set to 0 or negative to disable idle timer.
   */
  timeoutMinutes?: number
  /**
   * Automatically lock when page visibility changes to hidden (e.g. user tabs away).
   * Defaults to false.
   */
  lockOnVisibilityChange?: boolean
  /**
   * Automatically lock when window loses focus.
   * Defaults to false.
   */
  lockOnWindowBlur?: boolean
}

const DEFAULT_TIMEOUT_MINUTES = 15

/**
 * Hook to automatically lock the vault after a period of inactivity,
 * on window blur, or when document visibility changes to hidden.
 */
export function useVaultAutoLock(options: UseVaultAutoLockOptions = {}): void {
  const {
    timeoutMinutes = DEFAULT_TIMEOUT_MINUTES,
    lockOnVisibilityChange = false,
    lockOnWindowBlur = false,
  } = options

  const isUnlocked = useVaultStore(selectIsUnlocked)
  const lock = useVaultStore((s) => s.lock)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Only register listeners when the vault is currently unlocked
    if (!isUnlocked) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      if (timeoutMinutes > 0) {
        timerRef.current = setTimeout(() => {
          lock()
        }, timeoutMinutes * 60 * 1000)
      }
    }

    // Initialize inactivity timer
    resetTimer()

    // Activity events to reset inactivity timer
    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
    ]

    const handleActivity = () => {
      resetTimer()
    }

    activityEvents.forEach((ev) => {
      window.addEventListener(ev, handleActivity, { passive: true })
    })

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (lockOnVisibilityChange) {
          lock()
        }
      } else {
        resetTimer()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Handle window blur
    const handleBlur = () => {
      if (lockOnWindowBlur) {
        lock()
      }
    }
    if (lockOnWindowBlur) {
      window.addEventListener('blur', handleBlur)
    }

    // Automatically lock Vault when closing the web browser or closing the tab
    const handleBrowserClose = () => {
      lock()
    }
    window.addEventListener('beforeunload', handleBrowserClose)
    window.addEventListener('pagehide', handleBrowserClose)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      activityEvents.forEach((ev) => {
        window.removeEventListener(ev, handleActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (lockOnWindowBlur) {
        window.removeEventListener('blur', handleBlur)
      }
      window.removeEventListener('beforeunload', handleBrowserClose)
      window.removeEventListener('pagehide', handleBrowserClose)
    }
  }, [isUnlocked, lock, timeoutMinutes, lockOnVisibilityChange, lockOnWindowBlur])
}

