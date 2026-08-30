<script setup lang="ts">
import { cloneDeep } from 'lodash'
import { storeToRefs } from 'pinia'
import { v4 as uuid } from 'uuid'

const { presets } = storeToRefs(usePreset())
const { configMeta, imgLoading } = storeToRefs(useConfig())

const isOpen = ref(false)
const { $toast } = useNuxtApp()
const { t } = useI18n()
const name = ref('')

function savePreset() {
  try {
    const preset = cloneDeep({
      id: uuid() as string,
      name: name.value,
      config: configMeta.value,
    })

    presets.value.push(preset)
    isOpen.value = false
    name.value = ''
    $toast.success(t('preset.preset-saved'))
  }
  catch {
    $toast.error(t('preset.preset-saved-fail'))
  }
}

function handleOpen() {
  name.value = t('preset.name') + (presets.value.length + 1)
  isOpen.value = true
}
</script>

<template>
  <UButton :disabled="imgLoading" size="lg" class="justify-center flex-1" @click="handleOpen">
    {{ $t('preset.save-preset') }}
  </UButton>
  <UModal v-model:open="isOpen" :title="$t('preset.save-preset')" :ui="{ footer: 'justify-end' }">
    <template #body>
      <div class="flex gap-2 items-center">
        <span class="text-sm text-muted">{{ $t('preset.preset-name') }}</span>
        <UInput v-model="name" placeholder="Please enter preset name" class="flex-1" />
      </div>
    </template>
    <template #footer>
      <UButton color="neutral" variant="outline" class="w-[7rem] justify-center" @click="isOpen = false">
        {{ $t('preset.cancel') }}
      </UButton>
      <UButton class="w-[7rem] justify-center" @click="savePreset">
        {{ $t('preset.confirm') }}
      </UButton>
    </template>
  </UModal>
</template>
