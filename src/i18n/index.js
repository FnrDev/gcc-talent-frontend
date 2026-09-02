import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import ar from './ar.json'
import en from './en.json'

export const STORAGE_KEY = 'gcc-talents:language'

export const LANGUAGES = {
  en: { code: 'en', dir: 'ltr', label: 'English' },
  ar: { code: 'ar', dir: 'rtl', label: 'العربية' },
}

export const DEFAULT_LANGUAGE = 'en'

function storedLanguage() {
  // Private-mode browsers throw on access rather than returning null.
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored && stored in LANGUAGES ? stored : null
  } catch {
    return null
  }
}

function preferredLanguage() {
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const candidate of candidates) {
    const code = String(candidate || '').slice(0, 2).toLowerCase()
    if (code in LANGUAGES) return code
  }
  return DEFAULT_LANGUAGE
}

/** Mirrors the active language onto <html>, which is what drives RTL. */
export function applyDocumentLanguage(language) {
  const { code, dir } = LANGUAGES[language] ?? LANGUAGES[DEFAULT_LANGUAGE]
  document.documentElement.lang = code
  document.documentElement.dir = dir
}

/** Changes language and remembers the choice for the next visit. */
export function setLanguage(language) {
  if (!(language in LANGUAGES)) return
  try {
    localStorage.setItem(STORAGE_KEY, language)
  } catch {
    // A rejected write only costs persistence, so the switch still proceeds.
  }
  i18n.changeLanguage(language)
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: storedLanguage() ?? preferredLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  // React escapes interpolated values already.
  interpolation: { escapeValue: false },
  // Resources are bundled, so nothing ever loads async; skipping Suspense
  // removes a whole class of blank-render failure.
  react: { useSuspense: false },
})

// Kept outside React so direction is correct on first paint and stays in sync
// with any changeLanguage call, wherever it comes from.
i18n.on('languageChanged', applyDocumentLanguage)
applyDocumentLanguage(i18n.language)

export default i18n
