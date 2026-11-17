'use client'

import { useLayoutEffect, useState } from 'react'
import { THEME_STORAGE } from '../theme'
import { MoonIcon, SunIcon } from './Icons'

type Theme = 'light' | 'dark'

function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

/** Light / dark switch. Light is the default; the choice is remembered in this browser. */
export function ThemeToggle() {
  // Starts as light to match the server render, then syncs with the saved choice before paint.
  const [theme, setTheme] = useState<Theme>('light')

  // Also re-applies the attribute after React's dev-mode remount clears it.
  useLayoutEffect(() => {
    const saved = readTheme()
    applyTheme(saved)
    setTheme(saved)
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
    try {
      localStorage.setItem(THEME_STORAGE, next)
    } catch {
      // The choice just won't survive a reload.
    }
  }

  const dark = theme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="theme-switch"
      onClick={toggle}
    >
      <SunIcon className="theme-switch-icon theme-switch-sun" />
      <span className="switch-track" aria-hidden="true">
        <span className="switch-thumb" />
      </span>
      <MoonIcon className="theme-switch-icon theme-switch-moon" />
    </button>
  )
}
