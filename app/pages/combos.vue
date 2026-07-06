<script setup lang="ts">
import { useCombos, useComboMutations, type Combo } from '~/composables/useCombos'

definePageMeta({ middleware: 'auth' })

const { combosQuery } = useCombos()
const { createCombo, updateCombo, deleteCombo } = useComboMutations()
const { productsQuery } = useProducts()

const combos = computed(() => combosQuery.data.value ?? [])
const productOptions = computed(() =>
  (productsQuery.data.value?.items ?? []).map(p => ({ label: `${p.name} (${p.brand})`, value: p.id }))
)

const isFormOpen = ref(false)
const isDeleteOpen = ref(false)
const selected = ref<Combo | null>(null)

const form = reactive({
  name: '', slug: '', description: '', image: '', comboPrice: 0, isActive: true,
  items: [] as { productId: string, quantity: number }[]
})

function addItem() { form.items.push({ productId: '', quantity: 1 }) }
function removeItem(i: number) { form.items.splice(i, 1) }

function openCreate() {
  selected.value = null
  Object.assign(form, { name: '', slug: '', description: '', image: '', comboPrice: 0, isActive: true, items: [] })
  isFormOpen.value = true
}
function openEdit(c: Combo) {
  selected.value = c
  Object.assign(form, {
    name: c.name, slug: c.slug, description: c.description ?? '', image: c.image ?? '',
    comboPrice: c.comboPrice, isActive: c.isActive,
    items: c.items.map(it => ({ productId: it.product.id, quantity: it.quantity }))
  })
  isFormOpen.value = true
}

// Auto slug từ name khi tạo mới
watch(() => form.name, (name) => {
  if (!selected.value && name) {
    form.slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
  }
})

async function save() {
  const body = { ...form, items: form.items.filter(it => it.productId) }
  if (selected.value) await updateCombo.mutateAsync({ id: selected.value.id, body })
  else await createCombo.mutateAsync(body)
  isFormOpen.value = false
}

function openDelete(c: Combo) { selected.value = c; isDeleteOpen.value = true }
async function confirmDelete() {
  if (!selected.value) return
  await deleteCombo.mutateAsync(selected.value.id)
  isDeleteOpen.value = false
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

const columns = [
  { id: 'name', header: 'Combo' },
  { id: 'items', header: 'Số SP' },
  { id: 'price', header: 'Giá combo' },
  { id: 'savings', header: 'Tiết kiệm' },
  { id: 'status', header: 'Trạng thái' },
  { id: 'actions', header: '' }
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Combo">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-plus" label="Thêm combo" color="primary" @click="openCreate" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UTable :data="combos" :columns="columns" :loading="combosQuery.isPending.value" class="w-full">
        <template #name-cell="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar :src="row.original.image || row.original.items[0]?.product.images?.[0]" :alt="row.original.name" size="sm" :ui="{ rounded: 'rounded-md' }" />
            <div>
              <p class="font-medium text-sm">{{ row.original.name }}</p>
              <p class="text-xs text-muted">{{ row.original.slug }}</p>
            </div>
          </div>
        </template>
        <template #items-cell="{ row }">{{ row.original.items.length }}</template>
        <template #price-cell="{ row }">
          <div>
            <p class="font-medium text-sm">{{ formatPrice(row.original.comboPrice) }}</p>
            <p class="text-xs text-muted line-through">{{ formatPrice(row.original.originalPrice) }}</p>
          </div>
        </template>
        <template #savings-cell="{ row }">
          <span class="text-sm text-green-500">{{ formatPrice(row.original.savings) }}</span>
        </template>
        <template #status-cell="{ row }">
          <UBadge :color="row.original.isActive ? 'success' : 'neutral'" variant="subtle">
            {{ row.original.isActive ? 'Đang bán' : 'Tắt' }}
          </UBadge>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UButton icon="i-lucide-pencil" size="xs" color="neutral" variant="ghost" @click="openEdit(row.original)" />
            <UButton icon="i-lucide-trash" size="xs" color="error" variant="ghost" @click="openDelete(row.original)" />
          </div>
        </template>
      </UTable>
    </template>
  </UDashboardPanel>

  <UModal v-model:open="isFormOpen" :title="selected ? 'Sửa combo' : 'Thêm combo'" :ui="{ content: 'max-w-2xl' }">
    <template #body>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Tên combo">
            <UInput v-model="form.name" class="w-full" placeholder="Combo Quý Ông" />
          </UFormField>
          <UFormField label="Slug">
            <UInput v-model="form.slug" class="w-full" placeholder="combo-quy-ong" />
          </UFormField>
        </div>
        <UFormField label="Mô tả">
          <UTextarea v-model="form.description" class="w-full" :rows="2" />
        </UFormField>
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Ảnh (URL)">
            <UInput v-model="form.image" class="w-full" placeholder="https://..." />
          </UFormField>
          <UFormField label="Giá combo (VND)">
            <UInput v-model.number="form.comboPrice" type="number" class="w-full" min="0" />
          </UFormField>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium">Sản phẩm trong combo</p>
            <UButton type="button" icon="i-lucide-plus" label="Thêm SP" size="xs" color="neutral" variant="outline" @click="addItem" />
          </div>
          <div v-for="(it, i) in form.items" :key="i" class="flex items-center gap-2">
            <USelect v-model="it.productId" :items="productOptions" class="flex-1" placeholder="Chọn sản phẩm" />
            <UInput v-model.number="it.quantity" type="number" min="1" class="w-20" />
            <UButton type="button" icon="i-lucide-trash" size="xs" color="error" variant="ghost" @click="removeItem(i)" />
          </div>
          <p v-if="!form.items.length" class="text-xs text-muted">Chưa có sản phẩm nào.</p>
        </div>

        <UCheckbox v-model="form.isActive" label="Đang bán" />
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Huỷ" color="neutral" variant="ghost" @click="isFormOpen = false" />
        <UButton :label="selected ? 'Lưu' : 'Tạo'" :loading="createCombo.isPending.value || updateCombo.isPending.value" @click="save" />
      </div>
    </template>
  </UModal>

  <UModal v-model:open="isDeleteOpen" title="Xoá combo">
    <template #body>
      <p class="text-sm text-muted">Xoá combo <span class="font-medium text-default">{{ selected?.name }}</span>? Không thể hoàn tác.</p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Huỷ" color="neutral" variant="ghost" @click="isDeleteOpen = false" />
        <UButton label="Xoá" color="error" :loading="deleteCombo.isPending.value" @click="confirmDelete" />
      </div>
    </template>
  </UModal>
</template>
