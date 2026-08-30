<script setup lang="ts">
const { locale, setLocale } = useI18n()

onMounted(() => {
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale === 'en' || savedLocale === 'zhCN')
    void setLocale(savedLocale)
})

watch(locale, value => localStorage.setItem('locale', value))

useHead({
  title: 'Steam Card',
  meta: [
    {
      name: 'description',
      content: '⚡ Generate Your Steam Profile Card Quickly/快速生成你的Steam资料卡片 ⚡',
    },
  ],
  link: [
    {
      rel: 'icon',
      type: 'image/svg',
      href: '/icon.svg',
    },
  ],
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
      <ClientOnly>
        <Toaster rich-colors position="top-center" />
      </ClientOnly>
    </NuxtLayout>
  </UApp>
</template>
