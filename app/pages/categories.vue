<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { ProductCategory } from '~/types'

definePageMeta({ middleware: 'auth' })

const { categoriesQuery } = useCategories()
const { createCategory, updateCategory, deleteCategory } = useCategoryMutations()

const categories = computed(() => categoriesQuery.data.value ?? [])

// ─── Modal state ──────────────────────────────────────────────────────────────
const isFormOpen = ref(false)
const isDeleteOpen = ref(false)
const selected = ref<ProductCategory | null>(null)

function openCreate() {
  selected.value = null
  isFormOpen.value = true
}

function openEdit(cat: ProductCategory) {
  selected.value = cat
  isFormOpen.value = true
}

function openDelete(cat: ProductCategory) {
  selected.value = cat
  isDeleteOpen.value = true
}

async function confirmDelete() {
  if (!selected.value) return
  await deleteCategory.mutateAsync(selected.value.id)
  isDeleteOpen.value = false
  selected.value = null
}

// ─── Form ─────────────────────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(1, 'Bắt buộc'),
  slug: z.string().min(1, 'Bắt buộc'),
  description: z.string().optional().nullable()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: '',
  slug: '',
  description: ''
})

watch(isFormOpen, (open) => {
  if (!open) return
  if (selected.value) {
    state.name = selected.value.name
    state.slug = selected.value.slug
    state.description = selected.value.description ?? ''
  } else {
    state.name = ''
    state.slug = ''
    state.description = ''
  }
})

// Auto-generate slug
watch(() => state.name, (name) => {
  if (!selected.value && name) {
    state.slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
  }
})

const formLoading = computed(() =>
  createCategory.isPending.value || updateCategory.isPending.value
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (selected.value) {
    await updateCategory.mutateAsync({ id: selected.value.id, body: event.data })
  } else {
    await createCategory.mutateAsync(event.data)
  }
  isFormOpen.value = false
}

// ─── Table columns ────────────────────────────────────────────────────────────
const columns = [
  { id: 'name', accessorKey: 'name', header: 'Tên danh mục' },
  { id: 'slug', accessorKey: 'slug', header: 'Slug' },
  { id: 'description', accessorKey: 'description', header: 'Mô tả' },
  { id: 'actions', header: '' }
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Danh mục sản phẩm">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-plus" label="Thêm danh mục" color="primary" @click="openCreate" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UTable
        :data="categories"
        :columns="columns"
        :loading="categoriesQuery.isPending.value"
        class="w-full"
      >
        <template #name-cell="{ row }">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-tag" class="text-primary size-4 shrink-0" />
            <span class="font-medium">{{ row.original.name }}</span>
          </div>
        </template>

        <template #slug-cell="{ row }">
          <UBadge variant="subtle" color="neutral">
            {{ row.original.slug }}
          </UBadge>
        </template>

        <template #description-cell="{ row }">
          <span class="text-sm text-muted">{{ row.original.description || '—' }}</span>
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
    </template>
  </UDashboardPanel>

  <!-- Form Modal -->
  <UModal
    v-model:open="isFormOpen"
    :title="selected ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'"
  >
    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Tên danh mục" name="name">
          <UInput v-model="state.name" class="w-full" placeholder="Đồng hồ" />
        </UFormField>

        <UFormField label="Slug" name="slug">
          <UInput v-model="state.slug" class="w-full" placeholder="dong-ho" />
        </UFormField>

        <UFormField label="Mô tả" name="description">
          <UTextarea v-model="state.description" class="w-full" :rows="2" placeholder="Mô tả ngắn..." />
        </UFormField>

        <div class="flex justify-end gap-2 pt-1">
          <UButton label="Huỷ" color="neutral" variant="ghost" @click="isFormOpen = false" />
          <UButton type="submit" :label="selected ? 'Lưu' : 'Tạo'" :loading="formLoading" />
        </div>
      </UForm>
    </template>
  </UModal>

  <!-- Delete Modal -->
  <UModal v-model:open="isDeleteOpen" title="Xoá danh mục">
    <template #body>
      <p class="text-sm text-muted">
        Bạn có chắc muốn xoá danh mục
        <span class="font-medium text-default">{{ selected?.name }}</span>?
        Các sản phẩm thuộc danh mục này sẽ không còn được phân loại.
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Huỷ" color="neutral" variant="ghost" @click="isDeleteOpen = false" />
        <UButton
          label="Xoá"
          color="error"
          :loading="deleteCategory.isPending.value"
          @click="confirmDelete"
        />
      </div>
    </template>
  </UModal>
</template>
