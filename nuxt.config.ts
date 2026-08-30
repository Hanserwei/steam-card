import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2026-08-30',
  devtools: {
    enabled: true,
  },
  modules: [
    '@vueuse/nuxt',
    '@nuxt/ui',
    '@nuxt/devtools',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    'vue-sonner/nuxt',
    'unplugin-turbo-console/nuxt',
  ],
  i18n: {
    langDir: 'locales',
    strategy: 'no_prefix',
    locales: [
      {
        code: 'en',
        language: 'en',
        file: 'en.json',
        name: 'English',
      },
      {
        code: 'zhCN',
        language: 'zh-CN',
        file: 'zh-CN.json',
        name: '简体中文',
      },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
  },
  piniaPluginPersistedstate: {
    storage: 'localStorage',
  },
  turboConsole: {
    inspector: false,
  },
  ssr: false,
  css: [
    '~/assets/css/main.css',
    'atropos/css',
  ],
  vue: {
    compilerOptions: {
      isCustomElement: tag => tag === 'atropos-component',
    },
  },
  runtimeConfig: {
    blockApps: '',
    blockUsers: '',
    steamKey: '',
    cacheTime: '',
    public: {
      origin: '',
    },
  },
})
