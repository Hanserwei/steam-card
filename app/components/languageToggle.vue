<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const items = computed(() => {
  return locales.value.map(i => ({
    label: i.name,
    disabled: i.code === locale.value,
    onSelect: () => {
      void setLocale(i.code)
      localStorage.setItem('locale', i.code)
    },
  }))
})
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'end' }">
    <UButton icon="i-heroicons-language" color="neutral" variant="ghost" aria-label="Language" />
  </UDropdownMenu>
</template>
