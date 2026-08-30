import type { ConfigMeta } from '#shared/types'
import { defineStore } from 'pinia'

interface Preset {
  id: string
  name: string
  config: ConfigMeta
}

export const usePreset = defineStore('preset', () => {
  const presets = ref<Preset[]>([])

  return {
    presets,
  }
}, {
  persist: true,
})
