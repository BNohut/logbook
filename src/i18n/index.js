import { createI18n } from 'vue-i18n'
import tr from './tr'
import en from './en'

export const LOCALE_STORAGE_KEY = 'logbook-locale'
export const DEFAULT_LOCALE = 'tr'
export const FALLBACK_LOCALE = 'en'

const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCALE_STORAGE_KEY) : null
const initialLocale =
  saved === 'tr' || saved === 'en' ? saved : DEFAULT_LOCALE

export const i18n = createI18n({
  locale: initialLocale,
  fallbackLocale: FALLBACK_LOCALE,
  legacy: false,
  messages: { tr, en },
})

export function getCurrentLocale() {
  return i18n.global.locale.value
}
