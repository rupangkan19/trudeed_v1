import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type ThemeTokens = {
  SIDEBAR_BG: string
  SIDEBAR_HOVER: string
  SIDEBAR_ACTIVE_BG: string
  SIDEBAR_ACTIVE_BAR: string
  CONTENT_BG: string
  CARD_BG: string
  CARD_HOVER: string
  TEXT_PRIMARY: string
  TEXT_SECONDARY: string
  BORDER: string
  INPUT_BG: string
  BLUE: string
  RED: string
  GREEN: string
  AMBER: string
  PURPLE: string
  FONT: string
  // Verdict / status banner tokens
  VERDICT_RED_BG: string
  VERDICT_RED_BORDER: string
  VERDICT_RED_TEXT: string
  VERDICT_GREEN_BG: string
  VERDICT_GREEN_BORDER: string
  VERDICT_GREEN_TEXT: string
  VERDICT_AMBER_BG: string
  VERDICT_AMBER_BORDER: string
  VERDICT_AMBER_TEXT: string
  VERDICT_BLUE_BG: string
  VERDICT_BLUE_BORDER: string
  VERDICT_BLUE_TEXT: string
  VERDICT_ORANGE_BG: string
  VERDICT_ORANGE_BORDER: string
  VERDICT_ORANGE_TEXT: string
  VERDICT_PURPLE_BG: string
  VERDICT_PURPLE_BORDER: string
  VERDICT_PURPLE_TEXT: string
  // Flag severity chip tokens
  CHIP_RED_BG: string
  CHIP_RED_BORDER: string
  CHIP_RED_TEXT: string
  CHIP_AMBER_BG: string
  CHIP_AMBER_BORDER: string
  CHIP_AMBER_TEXT: string
  CHIP_GREEN_BG: string
  CHIP_GREEN_BORDER: string
  CHIP_GREEN_TEXT: string
  // Misc
  SCORE_TRACK: string
  TABLE_HEADER_BG: string
  TABLE_ROW_HOVER: string
  SHADOW: string
}

export const darkTheme: ThemeTokens = {
  SIDEBAR_BG: '#0c1120',
  SIDEBAR_HOVER: '#1a2540',
  SIDEBAR_ACTIVE_BG: '#1d3a6e',
  SIDEBAR_ACTIVE_BAR: '#3b82f6',
  CONTENT_BG: '#0f172a',
  CARD_BG: '#1e293b',
  CARD_HOVER: '#263347',
  TEXT_PRIMARY: '#f1f5f9',
  TEXT_SECONDARY: '#94a3b8',
  BORDER: '#334155',
  INPUT_BG: '#0f172a',
  BLUE: '#3b82f6',
  RED: '#ef4444',
  GREEN: '#22c55e',
  AMBER: '#f59e0b',
  PURPLE: '#8b5cf6',
  FONT: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  VERDICT_RED_BG: 'rgba(239,68,68,0.10)',
  VERDICT_RED_BORDER: 'rgba(239,68,68,0.28)',
  VERDICT_RED_TEXT: '#fca5a5',
  VERDICT_GREEN_BG: 'rgba(34,197,94,0.10)',
  VERDICT_GREEN_BORDER: 'rgba(34,197,94,0.28)',
  VERDICT_GREEN_TEXT: '#86efac',
  VERDICT_AMBER_BG: 'rgba(245,158,11,0.10)',
  VERDICT_AMBER_BORDER: 'rgba(245,158,11,0.28)',
  VERDICT_AMBER_TEXT: '#fcd34d',
  VERDICT_BLUE_BG: 'rgba(59,130,246,0.10)',
  VERDICT_BLUE_BORDER: 'rgba(59,130,246,0.28)',
  VERDICT_BLUE_TEXT: '#93c5fd',
  VERDICT_ORANGE_BG: 'rgba(249,115,22,0.10)',
  VERDICT_ORANGE_BORDER: 'rgba(249,115,22,0.28)',
  VERDICT_ORANGE_TEXT: '#fdba74',
  VERDICT_PURPLE_BG: 'rgba(139,92,246,0.10)',
  VERDICT_PURPLE_BORDER: 'rgba(139,92,246,0.28)',
  VERDICT_PURPLE_TEXT: '#c4b5fd',
  CHIP_RED_BG: 'rgba(239,68,68,0.15)',
  CHIP_RED_BORDER: 'rgba(239,68,68,0.30)',
  CHIP_RED_TEXT: '#fca5a5',
  CHIP_AMBER_BG: 'rgba(245,158,11,0.15)',
  CHIP_AMBER_BORDER: 'rgba(245,158,11,0.30)',
  CHIP_AMBER_TEXT: '#fcd34d',
  CHIP_GREEN_BG: 'rgba(34,197,94,0.15)',
  CHIP_GREEN_BORDER: 'rgba(34,197,94,0.30)',
  CHIP_GREEN_TEXT: '#86efac',
  SCORE_TRACK: 'rgba(255,255,255,0.08)',
  TABLE_HEADER_BG: 'rgba(255,255,255,0.04)',
  TABLE_ROW_HOVER: 'rgba(255,255,255,0.04)',
  SHADOW: '0 1px 3px rgba(0,0,0,0.4)',
}

export const lightTheme: ThemeTokens = {
  SIDEBAR_BG: '#1c2333',
  SIDEBAR_HOVER: '#243044',
  SIDEBAR_ACTIVE_BG: '#1d3a6e',
  SIDEBAR_ACTIVE_BAR: '#3b82f6',
  CONTENT_BG: '#f0f2f5',
  CARD_BG: '#ffffff',
  CARD_HOVER: '#f8fafc',
  TEXT_PRIMARY: '#111827',
  TEXT_SECONDARY: '#6b7280',
  BORDER: '#e5e7eb',
  INPUT_BG: '#ffffff',
  BLUE: '#2563eb',
  RED: '#dc2626',
  GREEN: '#16a34a',
  AMBER: '#d97706',
  PURPLE: '#7c3aed',
  FONT: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  VERDICT_RED_BG: '#fef2f2',
  VERDICT_RED_BORDER: '#fca5a5',
  VERDICT_RED_TEXT: '#dc2626',
  VERDICT_GREEN_BG: '#f0fdf4',
  VERDICT_GREEN_BORDER: '#86efac',
  VERDICT_GREEN_TEXT: '#16a34a',
  VERDICT_AMBER_BG: '#fffbeb',
  VERDICT_AMBER_BORDER: '#fcd34d',
  VERDICT_AMBER_TEXT: '#d97706',
  VERDICT_BLUE_BG: '#eff6ff',
  VERDICT_BLUE_BORDER: '#bfdbfe',
  VERDICT_BLUE_TEXT: '#1d4ed8',
  VERDICT_ORANGE_BG: '#fff7ed',
  VERDICT_ORANGE_BORDER: '#fdba74',
  VERDICT_ORANGE_TEXT: '#ea580c',
  VERDICT_PURPLE_BG: '#faf5ff',
  VERDICT_PURPLE_BORDER: '#d8b4fe',
  VERDICT_PURPLE_TEXT: '#7c3aed',
  CHIP_RED_BG: '#fee2e2',
  CHIP_RED_BORDER: '#fca5a5',
  CHIP_RED_TEXT: '#dc2626',
  CHIP_AMBER_BG: '#fef3c7',
  CHIP_AMBER_BORDER: '#fcd34d',
  CHIP_AMBER_TEXT: '#d97706',
  CHIP_GREEN_BG: '#dcfce7',
  CHIP_GREEN_BORDER: '#86efac',
  CHIP_GREEN_TEXT: '#16a34a',
  SCORE_TRACK: '#e5e7eb',
  TABLE_HEADER_BG: '#f9fafb',
  TABLE_ROW_HOVER: '#f8fafc',
  SHADOW: '0 1px 3px rgba(0,0,0,0.06)',
}

type ThemeCtx = {
  theme: ThemeTokens
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeCtx>({
  theme: darkTheme,
  isDark: true,
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('trudeed-theme')
      if (stored) return stored === 'dark'
    } catch {}
    return true
  })

  const toggleTheme = () => setIsDark(d => !d)

  useEffect(() => {
    try { localStorage.setItem('trudeed-theme', isDark ? 'dark' : 'light') } catch {}
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <ThemeContext.Provider value={{ theme: isDark ? darkTheme : lightTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
