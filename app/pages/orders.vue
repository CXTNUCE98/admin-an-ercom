<script setup lang="ts">
import type { Order, OrderStatus } from '~/types'
import {
  useOrders,
  useOrderMutations,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR
} from '~/composables/useOrders'

definePageMeta({ middleware: 'auth' })

// ─── Filters ────────────────────────────────────────────────────────────────
const selectedStatus = ref<OrderStatus | 'all'>('all')
const page = ref(1)
const pageSize = 20

const queryParams = computed(() => ({
  status: selectedStatus.value,
  page: page.value,
  pageSize
}))

const { ordersQuery } = useOrders(queryParams)
const { updateStatus } = useOrderMutations()

const orders = computed(() => ordersQuery.data.value?.items ?? [])
const total = computed(() => ordersQuery.data.value?.total ?? 0)

watch(selectedStatus, () => { page.value = 1 })

// ─── Detail slideover ─────────────────────────────────────────────────────────
const isDetailOpen = ref(false)
const selectedOrder = ref<Order | null>(null)

function openDetail(order: Order) {
  selectedOrder.value = order
  isDetailOpen.value = true
}

async function changeStatus(status: OrderStatus) {
  if (!selectedOrder.value) return
  await updateStatus.mutateAsync({ id: selectedOrder.value.id, status })
  selectedOrder.value = { ...selectedOrder.value, status }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase()
}

const statusOptions = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chờ xác nhận', value: 'PENDING' },
  { label: 'Đã xác nhận', value: 'CONFIRMED' },
  { label: 'Đang giao', value: 'SHIPPING' },
  { label: 'Đã giao', value: 'DELIVERED' },
  { label: 'Đã huỷ', value: 'CANCELLED' }
]

// State-machine trạng thái — KHỚP với BE (order.service ALLOWED_TRANSITIONS).
// Chỉ cho phép các bước hợp lệ để tránh lỗi 400 từ BE.
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: []
}

// Các bước chuyển trạng thái hợp lệ từ trạng thái hiện tại của đơn đang xem.
const statusFlow = computed<{ value: OrderStatus, label: string }[]>(() => {
  const current = selectedOrder.value?.status
  if (!current) return []
  return ALLOWED_TRANSITIONS[current].map((value) => ({
    value,
    label: ORDER_STATUS_LABEL[value]
  }))
})

const columns = [
  { id: 'id', header: 'Mã đơn' },
  { id: 'customer', header: 'Khách hàng' },
  { id: 'items', header: 'Sản phẩm' },
  { id: 'total', header: 'Tổng tiền' },
  { id: 'status', header: 'Trạng thái' },
  { id: 'date', header: 'Ngày đặt' },
  { id: 'actions', header: '' }
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Đơn hàng">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <USelect v-model="selectedStatus" :items="statusOptions" class="w-44" />
        <span class="ml-auto text-sm text-muted">{{ total }} đơn hàng</span>
      </div>

      <UTable
        :data="orders"
        :columns="columns"
        :loading="ordersQuery.isPending.value"
        class="w-full"
      >
        <template #id-cell="{ row }">
          <span class="font-mono text-sm font-medium">#{{ shortId(row.original.id) }}</span>
        </template>

        <template #customer-cell="{ row }">
          <div>
            <p class="font-medium text-sm">{{ row.original.user?.fullName ?? '—' }}</p>
            <p class="text-xs text-muted">{{ row.original.phone }}</p>
          </div>
        </template>

        <template #items-cell="{ row }">
          <span class="text-sm">{{ row.original.items.length }} loại</span>
        </template>

        <template #total-cell="{ row }">
          <span class="font-medium text-sm">{{ formatPrice(row.original.totalPrice) }}</span>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="ORDER_STATUS_COLOR[row.original.status]" variant="subtle">
            {{ ORDER_STATUS_LABEL[row.original.status] }}
          </UBadge>
        </template>

        <template #date-cell="{ row }">
          <span class="text-sm text-muted">{{ formatDate(row.original.createdAt) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex justify-end">
            <UButton
              icon="i-lucide-eye"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="openDetail(row.original)"
            />
          </div>
        </template>
      </UTable>

      <div class="flex justify-end pt-4 mt-auto border-t border-default">
        <UPagination
          v-model:page="page"
          :items-per-page="pageSize"
          :total="total"
        />
      </div>
    </template>
  </UDashboardPanel>

  <!-- Detail slideover -->
  <USlideover v-model:open="isDetailOpen" :title="selectedOrder ? `Đơn #${shortId(selectedOrder.id)}` : 'Chi tiết đơn'">
    <template #body>
      <div v-if="selectedOrder" class="space-y-5">
        <!-- Status + change -->
        <div>
          <p class="text-xs font-medium text-muted uppercase mb-2">Trạng thái</p>
          <div class="flex items-center gap-2 mb-3">
            <UBadge :color="ORDER_STATUS_COLOR[selectedOrder.status]" variant="subtle" size="lg">
              {{ ORDER_STATUS_LABEL[selectedOrder.status] }}
            </UBadge>
          </div>
          <div v-if="statusFlow.length" class="flex flex-wrap gap-2">
            <UButton
              v-for="s in statusFlow"
              :key="s.value"
              :label="s.label"
              size="xs"
              :color="s.value === 'CANCELLED' ? 'error' : 'primary'"
              variant="outline"
              :loading="updateStatus.isPending.value"
              @click="changeStatus(s.value)"
            />
          </div>
          <p v-else class="text-xs text-muted">Đơn đã kết thúc, không thể đổi trạng thái.</p>
        </div>

        <USeparator />

        <!-- Customer -->
        <div>
          <p class="text-xs font-medium text-muted uppercase mb-2">Khách hàng</p>
          <p class="text-sm font-medium">{{ selectedOrder.user?.fullName ?? '—' }}</p>
          <p class="text-sm text-muted">{{ selectedOrder.user?.email }}</p>
          <p class="text-sm text-muted">{{ selectedOrder.phone }}</p>
          <p class="text-sm mt-1">{{ selectedOrder.shippingAddress }}</p>
          <p v-if="selectedOrder.note" class="text-sm text-muted mt-1 italic">
            Ghi chú: {{ selectedOrder.note }}
          </p>
        </div>

        <USeparator />

        <!-- Items -->
        <div>
          <p class="text-xs font-medium text-muted uppercase mb-2">Sản phẩm</p>
          <div class="space-y-2">
            <div
              v-for="item in selectedOrder.items"
              :key="item.id"
              class="flex items-center gap-3"
            >
              <UAvatar
                :src="item.product?.images?.[0] ?? item.combo?.image ?? undefined"
                :alt="item.product?.name ?? item.combo?.name"
                size="sm"
                :ui="{ rounded: 'rounded-md' }"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">
                  {{ item.product?.name ?? item.combo?.name ?? 'Sản phẩm đã xoá' }}
                  <span v-if="item.combo" class="text-xs text-primary">(Combo)</span>
                </p>
                <p class="text-xs text-muted">{{ formatPrice(item.price) }} × {{ item.quantity }}</p>
              </div>
              <span class="text-sm font-medium">{{ formatPrice(item.price * item.quantity) }}</span>
            </div>
          </div>
        </div>

        <USeparator />

        <!-- Total -->
        <div class="flex justify-between items-center">
          <span class="text-sm font-medium">Tổng cộng</span>
          <span class="text-lg font-bold text-primary">{{ formatPrice(selectedOrder.totalPrice) }}</span>
        </div>
      </div>
    </template>
  </USlideover>
</template>
