<script setup lang="ts">
import type { Product, ProductStatus } from '~/types'

definePageMeta({ middleware: 'auth' })

// ─── Filters ──────────────────────────────────────────────────────────────────
const search = ref('')
const selectedStatus = ref<ProductStatus | 'all'>('all')
const selectedCategory = ref<string | 'all'>('all')
const page = ref(1)
const pageSize = 20

const queryParams = computed(() => ({
  search: search.value || undefined,
  status: selectedStatus.value,
  categoryId: selectedCategory.value !== 'all' ? selectedCategory.value : undefined,
  page: page.value,
  pageSize
}))

// ─── API ──────────────────────────────────────────────────────────────────────
const { productsQuery } = useProducts(queryParams)
const { deleteProduct } = useProductMutations()
const { filterOptions: categoryFilterOptions } = useCategories()

const products = computed(() => productsQuery.data.value?.items ?? [])
const total = computed(() => productsQuery.data.value?.total ?? 0)
const totalPages = computed(() => productsQuery.data.value?.totalPages ?? 1)

// Reset page khi filter thay đổi
watch([search, selectedStatus, selectedCategory], () => { page.value = 1 })

// ─── Modal state ──────────────────────────────────────────────────────────────
const isFormOpen = ref(false)
const isDeleteOpen = ref(false)
const selectedProduct = ref<Product | null>(null)

function openCreate() {
  selectedProduct.value = null
  isFormOpen.value = true
}

function openEdit(product: Product) {
  selectedProduct.value = product
  isFormOpen.value = true
}

function openDelete(product: Product) {
  selectedProduct.value = product
  isDeleteOpen.value = true
}

async function confirmDelete() {
  if (!selectedProduct.value) return
  await deleteProduct.mutateAsync(selectedProduct.value.id)
  isDeleteOpen.value = false
  selectedProduct.value = null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

const statusColor: Record<ProductStatus, 'success' | 'warning' | 'error'> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  OUT_OF_STOCK: 'error'
}

const statusLabel: Record<ProductStatus, string> = {
  ACTIVE: 'Đang bán',
  INACTIVE: 'Tạm ẩn',
  OUT_OF_STOCK: 'Hết hàng'
}

const statusOptions = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đang bán', value: 'ACTIVE' },
  { label: 'Tạm ẩn', value: 'INACTIVE' },
  { label: 'Hết hàng', value: 'OUT_OF_STOCK' }
]

const columns = [
  { id: 'name', accessorKey: 'name', header: 'Sản phẩm' },
  { id: 'category', header: 'Danh mục' },
  { id: 'brand', accessorKey: 'brand', header: 'Thương hiệu' },
  { id: 'price', accessorKey: 'price', header: 'Giá bán' },
  { id: 'stock', accessorKey: 'stock', header: 'Tồn kho' },
  { id: 'rating', accessorKey: 'rating', header: 'Rating' },
  { id: 'status', accessorKey: 'status', header: 'Trạng thái' },
  { id: 'actions', header: '' }
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Sản phẩm">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-plus" label="Thêm sản phẩm" color="primary" @click="openCreate" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Tìm theo tên, thương hiệu..."
          class="w-64"
        />
        <USelect
          v-model="selectedCategory"
          :items="categoryFilterOptions"
          class="w-44"
        />
        <USelect
          v-model="selectedStatus"
          :items="statusOptions"
          class="w-36"
        />
        <span class="ml-auto text-sm text-muted">{{ total }} sản phẩm</span>
      </div>

      <!-- Table -->
      <UTable
        :data="products"
        :columns="columns"
        :loading="productsQuery.isPending.value"
        class="w-full"
      >
        <template #name-cell="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar
              :src="row.original.images?.[0]"
              :alt="row.original.name"
              size="sm"
              :ui="{ rounded: 'rounded-md' }"
            />
            <div>
              <p class="font-medium text-sm">{{ row.original.name }}</p>
              <p class="text-xs text-muted">{{ row.original.slug }}</p>
            </div>
          </div>
        </template>

        <template #category-cell="{ row }">
          <span class="text-sm">{{ row.original.category?.name ?? '—' }}</span>
        </template>

        <template #price-cell="{ row }">
          <div>
            <p class="font-medium text-sm">{{ formatPrice(row.original.price) }}</p>
            <p v-if="row.original.salePrice" class="text-xs text-muted line-through">
              {{ formatPrice(row.original.salePrice) }}
            </p>
          </div>
        </template>

        <template #stock-cell="{ row }">
          <UBadge
            :color="row.original.stock === 0 ? 'error' : row.original.stock < 10 ? 'warning' : 'neutral'"
            variant="subtle"
          >
            {{ row.original.stock }}
          </UBadge>
        </template>

        <template #rating-cell="{ row }">
          <div class="flex items-center gap-1 text-sm">
            <UIcon name="i-lucide-star" class="text-yellow-400 size-3.5" />
            <span>{{ row.original.rating }}</span>
            <span class="text-muted">({{ row.original.reviewCount }})</span>
          </div>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="statusColor[row.original.status]" variant="subtle">
            {{ statusLabel[row.original.status] }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-1 justify-end">
            <UButton
              icon="i-lucide-pencil"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="openEdit(row.original)"
            />
            <UButton
              icon="i-lucide-trash"
              size="xs"
              color="error"
              variant="ghost"
              @click="openDelete(row.original)"
            />
          </div>
        </template>
      </UTable>

      <!-- Pagination -->
      <div class="flex justify-end pt-4 mt-auto border-t border-default">
        <UPagination
          v-model:page="page"
          :items-per-page="pageSize"
          :total="total"
        />
      </div>
    </template>
  </UDashboardPanel>

  <!-- Form Modal (Create / Edit) -->
  <ProductsFormModal v-model:open="isFormOpen" :product="selectedProduct" />

  <!-- Delete Modal -->
  <UModal v-model:open="isDeleteOpen" title="Xoá sản phẩm">
    <template #body>
      <p class="text-sm text-muted">
        Bạn có chắc muốn xoá
        <span class="font-medium text-default">{{ selectedProduct?.name }}</span>?
        Hành động này không thể hoàn tác.
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Huỷ" color="neutral" variant="ghost" @click="isDeleteOpen = false" />
        <UButton
          label="Xoá"
          color="error"
          :loading="deleteProduct.isPending.value"
          @click="confirmDelete"
        />
      </div>
    </template>
  </UModal>
</template>
