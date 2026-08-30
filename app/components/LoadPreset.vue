<script setup lang="ts">
import { cloneDeep } from 'lodash'
import { storeToRefs } from 'pinia'

const { presets } = storeToRefs(usePreset())
const { configMeta, imgLoading } = storeToRefs(useConfig())
const { currentAccount } = storeToRefs(useAccount())
const { parseConfig } = useConfig()
const selected = ref(presets.value[0]?.id ?? '')

const { $toast } = useNuxtApp()

const isOpen = ref(false)
const current = computed(() => presets.value.find(preset => preset.id === selected.value))

const { t, locale } = useI18n()
function loadPreset() {
  try {
    configMeta.value = cloneDeep(current.value!.config)
    isOpen.value = false
    $toast.success(t('preset.preset-loaded'))
    parseConfig(locale.value, currentAccount.value!.steamId)
  }
  catch {
    $toast.error(t('preset.preset-loaded-fail'))
  }
}

function deletePreset(index: number) {
  presets.value.splice(index, 1)
  if (presets.value.length === 0)
    isOpen.value = false
  else
    selected.value = presets.value[0]?.id ?? ''
}
</script>

<template>
  <UButton :disabled="imgLoading" color="neutral" variant="outline" @click="isOpen = true">
    {{ $t('preset.load-preset') }}
  </UButton>

  <UModal v-model:open="isOpen" :title="$t('preset.load-preset')" :ui="{ footer: 'justify-end' }">
    <template #body>
      <div class="flex flex-wrap gap-2 items-center">
        <UButtonGroup v-for="(preset, index) in presets" :key="preset.id" size="sm" orientation="horizontal">
          <UButton :label="preset.name" :color="selected === preset.id ? 'primary' : 'neutral'" :variant="selected === preset.id ? 'solid' : 'outline'" @click="selected = preset.id" />
          <UButton icon="i-heroicons-x-mark" color="neutral" variant="outline" @click="deletePreset(index)" />
        </UButtonGroup>
      </div>
    </template>
    <template #footer>
      <UButton color="neutral" class="w-[7rem] justify-center" variant="outline" @click="isOpen = false">
        {{ $t('preset.cancel') }}
      </UButton>
      <UButton class="w-[7rem] justify-center" @click="loadPreset">
        {{ $t('preset.confirm') }}
      </UButton>
    </template>
  </UModal>
</template>
