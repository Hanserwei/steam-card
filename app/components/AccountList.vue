<script setup lang="ts">
import { storeToRefs } from 'pinia'

const { accounts, currentAccount, currentAccountIndex } = storeToRefs(useAccount())
const { imgLoading, steamCardUrl } = storeToRefs(useConfig())
const { parseConfig } = useConfig()
const isModalOpen = ref(false)
const router = useRouter()
const { t, locale } = useI18n()

const items = computed(() => {
  return [
    accounts.value.map((account, index) => {
      return {
        label: account.nickName,
        avatar: {
          src: account.avatarUrl,
        },
        disabled: account.steamId === currentAccount.value?.steamId,
        onSelect: () => {
          currentAccountIndex.value = index
          parseConfig(locale.value, account.steamId)
        },
      }
    }),
    [{
      label: t('system.add-account'),
      icon: 'i-heroicons-plus-circle',
      onSelect: () => {
        isModalOpen.value = true
      },
    }, {
      label: t('system.sign-out'),
      icon: 'i-heroicons-arrow-left-on-rectangle',
      onSelect: () => {
        accounts.value.splice(currentAccountIndex.value, 1)
        imgLoading.value = true
        if (accounts.value?.length > 0) {
          currentAccountIndex.value = 0
        }
        else {
          currentAccountIndex.value = -1
          steamCardUrl.value = ''
          router.replace('/login')
        }
      },
    }],
  ]
})
</script>

<template>
  <template v-if="accounts.length > 0">
    <UDropdownMenu class="px-2" :items="items" :content="{ align: 'end' }">
      <UAvatar :src="currentAccount?.avatarUrl" />
    </UDropdownMenu>

    <UModal v-model:open="isModalOpen" :title="$t('system.add-account')">
      <template #body>
        <div class="flex flex-col items-center">
          <AddAccount @callback="() => { isModalOpen = false }" />
        </div>
      </template>
    </UModal>
  </template>
</template>
