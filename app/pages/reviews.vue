<script setup lang="ts">
import { useReviews, useReviewMutations, type AdminReview } from '~/composables/useReviews'

definePageMeta({ middleware: 'auth' })

const filter = ref<'all' | boolean>('all')
const page = ref(1)
const pageSize = 20

const queryParams = computed(() => ({ approved: filter.value, page: page.value, pageSize }))
const { reviewsQuery } = useReviews(queryParams)
const { approve, reject, remove } = useReviewMutations()

const reviews = computed(() => reviewsQuery.data.value?.items ?? [])
const total = computed(() => reviewsQuery.data.value?.total ?? 0)

watch(filter, () => { page.value = 1 })

const isDeleteOpen = ref(false)
const selected = ref<AdminReview | null>(null)
function openDelete(r: AdminReview) { selected.value = r; isDeleteOpen.value = true }
async function confirmDelete() {
  if (!selected.value) return
  await remove.mutateAsync(selected.value.id)
  isDeleteOpen.value = false
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const filterOptions = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đã duyệt', value: true },
  { label: 'Chờ duyệt', value: false }
]

const columns = [
  { id: 'product', header: 'Sản phẩm' },
  { id: 'customer', header: 'Khách' },
  { id: 'rating', header: 'Sao' },
  { id: 'comment', header: 'Nội dung' },
  { id: 'status', header: 'Trạng thái' },
  { id: 'date', header: 'Ngày' },
  { id: 'actions', header: '' }
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Đánh giá">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <USelect v-model="filter" :items="filterOptions" class="w-40" />
        <span class="ml-auto text-sm text-muted">{{ total }} đánh giá</span>
      </div>

      <UTable :data="reviews" :columns="columns" :loading="reviewsQuery.isPending.value" class="w-full">
        <template #product-cell="{ row }">
          <div class="flex items-center gap-2">
            <UAvatar :src="row.original.product?.images?.[0]" :alt="row.original.product?.name" size="sm" :ui="{ rounded: 'rounded-md' }" />
            <span class="text-sm font-medium truncate max-w-40">{{ row.original.product?.name ?? '—' }}</span>
          </div>
        </template>
        <template #customer-cell="{ row }">
          <span class="text-sm">{{ row.original.user?.fullName ?? '—' }}</span>
        </template>
        <template #rating-cell="{ row }">
          <div class="flex items-center gap-0.5 text-yellow-400">
            <UIcon v-for="n in row.original.rating" :key="n" name="i-lucide-star" class="size-3.5" />
          </div>
        </template>
        <template #comment-cell="{ row }">
          <span class="text-sm text-muted line-clamp-2 max-w-xs">{{ row.original.comment || '—' }}</span>
        </template>
        <template #status-cell="{ row }">
          <UBadge :color="row.original.isApproved ? 'success' : 'warning'" variant="subtle">
            {{ row.original.isApproved ? 'Đã duyệt' : 'Chờ duyệt' }}
          </UBadge>
        </template>
        <template #date-cell="{ row }">
          <span class="text-sm text-muted">{{ formatDate(row.original.createdAt) }}</span>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UButton
              v-if="!row.original.isApproved"
              icon="i-lucide-check"
              size="xs"
              color="success"
              variant="ghost"
              :loading="approve.isPending.value"
              @click="approve.mutateAsync(row.original.id)"
            />
            <UButton
              v-else
              icon="i-lucide-eye-off"
              size="xs"
              color="warning"
              variant="ghost"
              :loading="reject.isPending.value"
              @click="reject.mutateAsync(row.original.id)"
            />
            <UButton icon="i-lucide-trash" size="xs" color="error" variant="ghost" @click="openDelete(row.original)" />
          </div>
        </template>
      </UTable>

      <div class="flex justify-end pt-4 mt-auto border-t border-default">
        <UPagination v-model:page="page" :items-per-page="pageSize" :total="total" />
      </div>
    </template>
  </UDashboardPanel>

  <UModal v-model:open="isDeleteOpen" title="Xoá đánh giá">
    <template #body>
      <p class="text-sm text-muted">Xoá đánh giá này? Không thể hoàn tác.</p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Huỷ" color="neutral" variant="ghost" @click="isDeleteOpen = false" />
        <UButton label="Xoá" color="error" :loading="remove.isPending.value" @click="confirmDelete" />
      </div>
    </template>
  </UModal>
</template>
