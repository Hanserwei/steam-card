import type { Count, Locales, Theme } from '.'

export interface CardI18n {
  setLocale: (locale: Locales) => void
  get: (key: string) => string
}

export interface TemplateMeta {
  name: string
  avatarUrlBase64: string
  playerLevel: string
  isOnline: number
  gameImgs: string[]
  theme: Theme
  badge: boolean
  group: boolean
  bg: string
  textColor: string
  playTime: number
  groupIconList: string[]
  badgeIcon: string
  i18n: CardI18n
  counts: Count[]
}
