<script setup lang="ts">
const router = useRouter()
</script>

<template>
  <main class="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 py-10 text-center">
    <UIcon name="i-heroicons-exclamation-triangle" class="size-12 text-warning" />
    <h1 class="text-2xl font-semibold text-highlighted">
      Not found
    </h1>
    <UButton color="neutral" variant="outline" @click="router.back()">
      Back
    </UButton>
  </main>
</template>
