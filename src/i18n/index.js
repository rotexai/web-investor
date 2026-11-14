import { createContext, useContext } from 'react'
import en from './en.js'
import vi from './vi.js'

export const COPY = { en, vi }
export const LANGS = ['en', 'vi']
const KEY = 'rx-lang'

// First visit: Vietnamese when the browser prefers it, otherwise English. Later visits: the visitor's last choice.
export function initialLang() {
  try {
    const saved = localStorage.getItem(KEY)
    if (LANGS.includes(saved)) return saved
  } catch { /* storage blocked */ }
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language]
  return prefs.some((l) => l?.toLowerCase().startsWith('vi')) ? 'vi' : 'en'
}

export function saveLang(lang) {
  try {
    localStorage.setItem(KEY, lang)
  } catch { /* storage blocked: the choice lasts for this page view */ }
}

export const LangContext = createContext({ lang: 'en', t: en, setLang: () => {} })
export const useLang = () => useContext(LangContext)
