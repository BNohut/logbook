import { defineBoot } from '#q-app/wrappers'
import { Quasar } from 'quasar'
import quasarLangTr from 'quasar/lang/tr'
import quasarLangEn from 'quasar/lang/en-US'
import { i18n, getCurrentLocale } from 'src/i18n'

const quasarLangMap = {
  tr: quasarLangTr,
  en: quasarLangEn,
}

function applyQuasarLang(locale) {
  Quasar.lang.set(quasarLangMap[locale] || quasarLangTr)
}

export default defineBoot(({ app }) => {
  app.use(i18n)
  applyQuasarLang(getCurrentLocale())
})

export { applyQuasarLang }
