import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { applyQuasarLang } from 'src/boot/i18n'
import { LOCALE_STORAGE_KEY } from 'src/i18n'

export function useAppLocale() {
  const { locale, t } = useI18n()

  const localeOptions = [
    { label: 'Türkçe', value: 'tr' },
    { label: 'English', value: 'en' },
  ]

  const currentLocaleLabel = computed(() => {
    return localeOptions.find((o) => o.value === locale.value)?.label ?? 'Türkçe'
  })

  function setLocale(lang) {
    if (lang !== 'tr' && lang !== 'en') return
    locale.value = lang
    localStorage.setItem(LOCALE_STORAGE_KEY, lang)
    applyQuasarLang(lang)
  }

  return { locale, setLocale, localeOptions, currentLocaleLabel, t }
}
