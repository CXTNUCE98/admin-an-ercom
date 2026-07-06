<script setup lang="ts">
import { useCoupons, useCouponMutations, type Coupon } from '~/composables/useCoupons'

definePageMeta({ middleware: 'auth' })

const { couponsQuery } = useCoupons()
const { createCoupon, updateCoupon, deleteCoupon } = useCouponMutations()

const coupons = computed(() => couponsQuery.data.value ?? [])

const isFormOpen = ref(false)
const isDeleteOpen = ref(false)
const selected = ref<Coupon | null>(null)

const form = reactive({
  code: '', type: 'PERCENT' as 'PERCENT' | 'FIXED', value: 0,
  minOrder: 0, maxDiscount: null as number | null,
  usageLimit: null as number | null, isActive: true
})

function openCreate() {
  selected.value = null
  Object.assign(form, { code: '', type: 'PERCENT', value: 0, minOrder: 0, maxDiscount: null, usageLimit: null, isActive: true })
  isFormOpen.value = true
}

function openEdit(c: Coupon) {
  selected.value = c
  Object.assign(form, {
    code: c.code, type: c.type, value: c.value, minOrder: c.minOrder,
    maxDiscount: c.maxDiscount, usageLimit: c.usageLimit, isActive: c.isActive
  })
  isFormOpen.value = true
}

async function save() {
  const body = { ...form }
  if (selected.value) {
    await updateCoupon.mutateAsync({ id: selected.value.id, body })
  } else {
    await createCoupon.mutateAsync(body)
  }
  isFormOpen.value = false
}

function openDelete(c: Coupon) {
  selected.value = c
  isDeleteOpen.value = true
}
async function confirmDelete() {
  if (!selected.value) return
  await deleteCoupon.mutateAsync(selected.value.id)
  isDeleteOpen.value = false
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
function describeValue(c: Coupon) {
  return c.type === 'PERCENT' ? `${c.value}%` : formatPrice(c.value)
}

const typeOptions = [
  { label: 'Phần trăm (%)', value: 'PERCENT' },
  { label: 'Số tiền cố định', value: 'FIXED' }
]

const columns = [
  { id: 'code', header: 'Mã' },
  { id: 'value', header: 'Giảm' },
  { id: 'minOrder', header: 'Đơn tối thiểu' },
  { id: 'usage', header: 'Đã dùng' },
  { id: 'status', header: 'Trạng thái' },
  { id: 'actions', header: '' }
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Mã giảm giá">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-plus" label="Thêm mã" color="primary" @click="openCreate" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UTable :data="coupons" :columns="columns" :loading="couponsQuery.isPending.value" class="w-full">
        <template #code-cell="{ row }">
          <span class="font-mono font-medium">{{ row.original.code }}</span>
        </template>
        <template #value-cell="{ row }">
          {{ describeValue(row.original) }}
          <span v-if="row.original.maxDiscount" class="text-xs text-muted">(tối đa {{ formatPrice(row.original.maxDiscount) }})</span>
        </template>
        <template #minOrder-cell="{ row }">{{ formatPrice(row.original.minOrder) }}</template>
        <template #usage-cell="{ row }">
          {{ row.original.usedCount }}<span v-if="row.original.usageLimit"> / {{ row.original.usageLimit }}</span>
        </template>
        <template #status-cell="{ row }">
          <UBadge :color="row.original.isActive ? 'success' : 'neutral'" variant="subtle">
            {{ row.original.isActive ? 'Đang bật' : 'Tắt' }}
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

  <UModal v-model:open="isFormOpen" :title="selected ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá'">
    <template #body>
      <div class="space-y-4">
        <UFormField label="Mã (code)">
          <UInput v-model="form.code" class="w-full" placeholder="IRONMAN10" />
        </UFormField>
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Loại">
            <USelect v-model="form.type" :items="typeOptions" class="w-full" />
          </UFormField>
          <UFormField :label="form.type === 'PERCENT' ? 'Giá trị (%)' : 'Giá trị (VND)'">
            <UInput v-model.number="form.value" type="number" class="w-full" min="0" />
          </UFormField>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Đơn tối thiểu (VND)">
            <UInput v-model.number="form.minOrder" type="number" class="w-full" min="0" />
          </UFormField>
          <UFormField v-if="form.type === 'PERCENT'" label="Giảm tối đa (VND)">
            <UInput v-model.number="form.maxDiscount" type="number" class="w-full" min="0" placeholder="Không giới hạn" />
          </UFormField>
        </div>
        <UFormField label="Giới hạn lượt dùng">
          <UInput v-model.number="form.usageLimit" type="number" class="w-full" min="1" placeholder="Không giới hạn" />
        </UFormField>
        <UCheckbox v-model="form.isActive" label="Kích hoạt" />
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Huỷ" color="neutral" variant="ghost" @click="isFormOpen = false" />
        <UButton :label="selected ? 'Lưu' : 'Tạo'" :loading="createCoupon.isPending.value || updateCoupon.isPending.value" @click="save" />
      </div>
    </template>
  </UModal>

  <UModal v-model:open="isDeleteOpen" title="Xoá mã giảm giá">
    <template #body>
      <p class="text-sm text-muted">Xoá mã <span class="font-medium text-default">{{ selected?.code }}</span>? Không thể hoàn tác.</p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Huỷ" color="neutral" variant="ghost" @click="isDeleteOpen = false" />
        <UButton label="Xoá" color="error" :loading="deleteCoupon.isPending.value" @click="confirmDelete" />
      </div>
    </template>
  </UModal>
</template>
