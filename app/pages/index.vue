<script setup lang="ts">
import { useDashboardData } from '~/composables/useDashboardData'
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '~/composables/useOrders'
import type { OrderStatus } from '~/types'

definePageMeta({ middleware: 'auth' })

const { overviewQuery, monthlyQuery, topProductsQuery, recentOrdersQuery } = useDashboardData()

const overview = computed(() => overviewQuery.data.value)
const monthly = computed(() => monthlyQuery.data.value ?? [])
const topProducts = computed(() => topProductsQuery.data.value ?? [])
const recentOrders = computed(() => recentOrdersQuery.data.value ?? [])

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)
}
function formatNumber(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n)
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}
function shortId(id: string) {
  return id.slice(0, 8).toUpperCase()
}

const stats = computed(() => [
  { label: 'Doanh thu', value: formatPrice(overview.value?.totalRevenue ?? 0), icon: 'i-lucide-dollar-sign', color: 'text-green-500' },
  { label: 'Đơn hàng', value: formatNumber(overview.value?.totalOrders ?? 0), icon: 'i-lucide-shopping-cart', color: 'text-blue-500' },
  { label: 'Sản phẩm', value: formatNumber(overview.value?.totalProducts ?? 0), icon: 'i-lucide-package', color: 'text-orange-500' },
  { label: 'Khách hàng', value: formatNumber(overview.value?.totalUsers ?? 0), icon: 'i-lucide-users', color: 'text-purple-500' }
])

// Bar chart doanh thu — chuẩn hoá chiều cao theo max.
// Tháng không có doanh thu (0) vẫn hiển thị cột tối thiểu để hover xem giá trị.
const maxRevenue = computed(() => Math.max(1, ...monthly.value.map(m => m.revenue)))
function barHeight(revenue: number) {
  return `${(revenue / maxRevenue.value) * 100}%`
}
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Tổng quan">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Stat cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <UCard v-for="s in stats" :key="s.label">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-elevated">
              <UIcon :name="s.icon" class="size-5" :class="s.color" />
            </div>
            <div>
              <p class="text-xs text-muted">{{ s.label }}</p>
              <p class="text-lg font-bold">{{ s.value }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Monthly revenue chart -->
      <UCard class="mt-4">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">Doanh thu 12 tháng gần nhất</h3>
            <span class="text-xs text-muted">Chỉ tính đơn đã giao</span>
          </div>
        </template>
        <div v-if="monthlyQuery.isPending.value" class="h-48 flex items-center justify-center text-muted">
          Đang tải...
        </div>
        <div v-else class="flex items-end gap-2 h-48">
          <div v-for="m in monthly" :key="m.month" class="flex-1 flex flex-col items-center gap-1 group">
            <div class="w-full flex-1 flex items-end">
              <div
                class="relative w-full min-h-[6px] bg-primary/70 group-hover:bg-primary rounded-t transition-all"
                :style="{ height: barHeight(m.revenue) }"
              >
                <span class="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-xs text-muted opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  {{ formatPrice(m.revenue) }}
                </span>
              </div>
            </div>
            <span class="text-xs text-muted text-center">{{ m.month }}</span>
          </div>
        </div>
      </UCard>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <!-- Top products -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">Sản phẩm bán chạy</h3>
          </template>
          <div v-if="!topProducts.length" class="text-sm text-muted py-4 text-center">Chưa có dữ liệu</div>
          <div v-else class="space-y-3">
            <div v-for="(tp, i) in topProducts" :key="tp.product?.id ?? i" class="flex items-center gap-3">
              <span class="text-sm font-bold text-muted w-4">{{ i + 1 }}</span>
              <UAvatar :src="tp.product?.images?.[0]" :alt="tp.product?.name" size="sm" :ui="{ rounded: 'rounded-md' }" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ tp.product?.name ?? '—' }}</p>
                <p class="text-xs text-muted">{{ tp.product?.brand }}</p>
              </div>
              <span class="text-sm font-medium">{{ tp.totalSold }} đã bán</span>
            </div>
          </div>
        </UCard>

        <!-- Recent orders -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">Đơn hàng gần đây</h3>
              <UButton to="/orders" label="Xem tất cả" variant="link" size="xs" trailing-icon="i-lucide-arrow-right" />
            </div>
          </template>
          <div v-if="!recentOrders.length" class="text-sm text-muted py-4 text-center">Chưa có đơn hàng</div>
          <div v-else class="space-y-3">
            <div v-for="o in recentOrders" :key="o.id" class="flex items-center gap-3">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium">#{{ shortId(o.id) }} · {{ o.user?.fullName ?? '—' }}</p>
                <p class="text-xs text-muted">{{ formatDate(o.createdAt) }} · {{ o.items.length }} sản phẩm</p>
              </div>
              <UBadge :color="ORDER_STATUS_COLOR[o.status as OrderStatus]" variant="subtle" size="sm">
                {{ ORDER_STATUS_LABEL[o.status as OrderStatus] }}
              </UBadge>
              <span class="text-sm font-medium">{{ formatPrice(o.totalPrice) }}</span>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
