import type { CardI18n, Locales } from '#shared/types'
import en from './en.json'
import zhCN from './zhCN.json'

export default (_default: Locales): CardI18n => {
  const Locales = {
    en: en as Record<string, string>,
    zhCN: zhCN as Record<string, string>,
  }

  let defaultLocale: Locales = _default

  function setLocale(locale: Locales) {
    defaultLocale = locale
  }

  function get(key: string) {
    return Locales[defaultLocale][key] || key
  }

  return {
    setLocale,
    get,
  }
}
