<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Product } from '~/types'

const props = defineProps<{
  product?: Product | null
}>()

const open = defineModel<boolean>('open', { default: false })
const { createProduct, updateProduct } = useProductMutations()
const { categoryOptions } = useCategories()
const { uploadImages, uploading } = useUpload()

const isEdit = computed(() => !!props.product)

const schema = z.object({
  name: z.string().min(1, 'Bắt buộc'),
  slug: z.string().min(1, 'Bắt buộc'),
  brand: z.string().min(1, 'Bắt buộc'),
  categoryId: z.string().optional().nullable(),
  price: z.number().min(0, 'Phải >= 0'),
  salePrice: z.number().min(0).optional().nullable(),
  stock: z.number().min(0).default(0),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']).default('ACTIVE'),
  description: z.string().optional().nullable(),
  videoUrl: z.string().url('URL không hợp lệ').optional().nullable().or(z.literal('')),
  isNew: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isLuxury: z.boolean().default(false)
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: '', slug: '', brand: '', categoryId: null,
  price: 0, salePrice: null, stock: 0, status: 'ACTIVE',
  description: '', videoUrl: '',
  isNew: false, isBestSeller: false, isLuxury: false
})

// ─── Images ───────────────────────────────────────────────────────────────────
const imageUrls = ref<string[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)

async function onFileChange(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  if (!files.length) return
  if (fileInputRef.value) fileInputRef.value.value = ''

  const newUrls = await uploadImages(files)
  imageUrls.value.push(...newUrls)
}

function removeImage(index: number) {
  imageUrls.value.splice(index, 1)
}

// ─── Giá tiền ─────────────────────────────────────────────────────────────────
const priceDisplay = ref('')
const salePriceDisplay = ref('')

function formatVND(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return ''
  return new Intl.NumberFormat('vi-VN').format(val)
}

function onPriceInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\./g, '')
  const num = Number(raw)
  if (!isNaN(num)) { state.price = num; priceDisplay.value = formatVND(num) }
}

function onSalePriceInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\./g, '')
  if (raw === '') { state.salePrice = null; salePriceDisplay.value = ''; return }
  const num = Number(raw)
  if (!isNaN(num)) { state.salePrice = num; salePriceDisplay.value = formatVND(num) }
}

// ─── Populate form khi edit ───────────────────────────────────────────────────
watch(() => props.product, (p) => {
  if (p) {
    Object.assign(state, {
      name: p.name, slug: p.slug, brand: p.brand,
      categoryId: p.categoryId ?? null, price: p.price,
      salePrice: p.salePrice ?? null, stock: p.stock, status: p.status,
      description: p.description ?? '', videoUrl: p.videoUrl ?? '',
      isNew: p.isNew, isBestSeller: p.isBestSeller, isLuxury: p.isLuxury
    })
    imageUrls.value = [...(p.images ?? [])]
    priceDisplay.value = formatVND(p.price)
    salePriceDisplay.value = formatVND(p.salePrice)
  } else {
    Object.assign(state, {
      name: '', slug: '', brand: '', categoryId: null, price: 0,
      salePrice: null, stock: 0, status: 'ACTIVE', description: '',
      videoUrl: '', isNew: false, isBestSeller: false, isLuxury: false
    })
    imageUrls.value = []
    priceDisplay.value = ''
    salePriceDisplay.value = ''
  }
}, { immediate: true })

// ─── Auto slug ────────────────────────────────────────────────────────────────
watch(() => state.name, (name) => {
  if (!isEdit.value && name) {
    state.slug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '')
      .trim().replace(/\s+/g, '-')
  }
})

const loading = computed(() =>
  createProduct.isPending.value || updateProduct.isPending.value
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const body = {
    ...event.data,
    images: imageUrls.value,
    videoUrl: event.data.videoUrl || undefined,
    tags: [],
    highlights: []
  }

  if (isEdit.value && props.product) {
    await updateProduct.mutateAsync({ id: props.product.id, body })
  } else {
    await createProduct.mutateAsync(body as any)
  }
  open.value = false
}

const statusOptions = [
  { label: 'Đang bán', value: 'ACTIVE' },
  { label: 'Tạm ẩn', value: 'INACTIVE' },
  { label: 'Hết hàng', value: 'OUT_OF_STOCK' }
]
</script>

<template>
  <UModal
    v-model:open="open"
    :title="isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <div class="grid grid-cols-2 gap-4">

          <UFormField label="Tên sản phẩm" name="name" class="col-span-2">
            <UInput v-model="state.name" class="w-full" placeholder="Seiko 5 Xanh Lá" />
          </UFormField>

          <UFormField label="Slug" name="slug">
            <UInput v-model="state.slug" class="w-full" placeholder="seiko-5-xanh-la" />
          </UFormField>

          <UFormField label="Thương hiệu" name="brand">
            <UInput v-model="state.brand" class="w-full" placeholder="Seiko" />
          </UFormField>

          <UFormField label="Danh mục" name="categoryId" class="col-span-2">
            <USelect v-model="state.categoryId" :items="categoryOptions" class="w-full" placeholder="Chọn danh mục..." />
          </UFormField>

          <UFormField label="Giá bán (VND)" name="price">
            <UInput :model-value="priceDisplay" class="w-full" placeholder="3.000.000" inputmode="numeric" @input="onPriceInput" />
          </UFormField>

          <UFormField label="Giá khuyến mãi (VND)" name="salePrice">
            <UInput :model-value="salePriceDisplay" class="w-full" placeholder="2.500.000" inputmode="numeric" @input="onSalePriceInput" />
          </UFormField>

          <UFormField label="Tồn kho" name="stock">
            <UInput v-model.number="state.stock" type="number" class="w-full" min="0" />
          </UFormField>

          <UFormField label="Trạng thái" name="status">
            <USelect v-model="state.status" :items="statusOptions" class="w-full" />
          </UFormField>

          <UFormField label="Mô tả" name="description" class="col-span-2">
            <UTextarea v-model="state.description" class="w-full" :rows="3" />
          </UFormField>

          <!-- Ảnh sản phẩm -->
          <div class="col-span-2 space-y-2">
            <p class="text-sm font-medium">Ảnh sản phẩm</p>

            <div v-if="imageUrls.length" class="flex flex-wrap gap-2">
              <div
                v-for="(url, i) in imageUrls"
                :key="url"
                class="relative group size-20 rounded-lg overflow-hidden border border-default"
              >
                <img :src="url" :alt="`image-${i}`" class="w-full h-full object-cover" />
                <button
                  type="button"
                  class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  @click="removeImage(i)"
                >
                  <UIcon name="i-lucide-trash" class="text-white size-4" />
                </button>
              </div>
            </div>

            <div>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                multiple
                class="hidden"
                @change="onFileChange"
              />
              <UButton
                type="button"
                icon="i-lucide-image-plus"
                label="Chọn ảnh"
                color="neutral"
                variant="outline"
                size="sm"
                :loading="uploading"
                @click="fileInputRef?.click()"
              />
              <p class="text-xs text-muted mt-1">
                Tối đa 10 ảnh. Ảnh được upload ngay khi chọn.
              </p>
            </div>
          </div>

          <!-- Video URL -->
          <UFormField label="Video URL" name="videoUrl" class="col-span-2">
            <UInput
              v-model="state.videoUrl"
              class="w-full"
              placeholder="https://youtube.com/watch?v=..."
              icon="i-lucide-video"
            />
          </UFormField>

          <div class="col-span-2 flex gap-6">
            <UCheckbox v-model="state.isNew" label="Hàng mới" />
            <UCheckbox v-model="state.isBestSeller" label="Bán chạy" />
            <UCheckbox v-model="state.isLuxury" label="Cao cấp" />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <UButton label="Huỷ" color="neutral" variant="ghost" @click="open = false" />
          <UButton type="submit" :label="isEdit ? 'Lưu' : 'Tạo'" :loading="loading" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
