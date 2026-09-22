import AsyncStorage from "@react-native-async-storage/async-storage"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useColorScheme } from "react-native"

export type ThemePreference = "light" | "dark" | "system"

const STORAGE_KEY = "vadrouille.theme-preference"

type ThemePreferenceContextValue = {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
  /** Always 'light' or 'dark' — 'system' resolved against the OS setting, ready to hand
   * straight to TamaguiProvider's `defaultTheme`. */
  resolvedTheme: "light" | "dark"
}

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | undefined>(undefined)

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme()
  const [preference, setPreferenceState] = useState<ThemePreference>("system")

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") setPreferenceState(stored)
    })
  }, [])

  function setPreference(next: ThemePreference) {
    setPreferenceState(next)
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {})
  }

  const resolvedTheme = preference === "system" ? (systemScheme === "dark" ? "dark" : "light") : preference

  return (
    <ThemePreferenceContext.Provider value={{ preference, setPreference, resolvedTheme }}>
      {children}
    </ThemePreferenceContext.Provider>
  )
}

export function useThemePreference(): ThemePreferenceContextValue {
  const context = useContext(ThemePreferenceContext)
  if (!context) {
    throw new Error("useThemePreference must be used within a ThemePreferenceProvider")
  }
  return context
}
