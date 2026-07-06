<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const links = [[{
  label: 'Tổng quan',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Đơn hàng',
  icon: 'i-lucide-shopping-cart',
  to: '/orders',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Khách hàng',
  icon: 'i-lucide-users',
  to: '/customers',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Sản phẩm',
  icon: 'i-lucide-package',
  to: '/products',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Danh mục',
  icon: 'i-lucide-tag',
  to: '/categories',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Đánh giá',
  icon: 'i-lucide-star',
  to: '/reviews',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Combo',
  icon: 'i-lucide-package-2',
  to: '/combos',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Mã giảm giá',
  icon: 'i-lucide-ticket-percent',
  to: '/coupons',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Cài đặt',
  to: '/settings',
  icon: 'i-lucide-settings',
  onSelect: () => {
    open.value = false
  }
}]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Điều hướng',
  items: links.flat()
}])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2 px-1 py-2" :class="{ 'justify-center': collapsed }">
          <UIcon name="i-lucide-shield-check" class="size-6 text-primary shrink-0" />
          <span v-if="!collapsed" class="font-bold tracking-wide">AN ERCOM</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
