<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { Row } from '@tanstack/table-core'
import type { Customer } from '~/types'

definePageMeta({ middleware: 'auth' })

const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const table = useTemplateRef('table')

// ─── Filters & Pagination ─────────────────────────────────────────────────────
const search = ref('')
const statusFilter = ref<'all' | 'active' | 'inactive'>('all')
const pagination = ref({ pageIndex: 0, pageSize: 10 })

const queryParams = computed(() => ({
  search: search.value || undefined,
  page: pagination.value.pageIndex + 1,
  pageSize: pagination.value.pageSize
}))

// ─── API ──────────────────────────────────────────────────────────────────────
const { customersQuery } = useCustomers(queryParams)
const toggleActive = useToggleCustomerActive()

const customers = computed(() => customersQuery.data.value?.items ?? [])
const total = computed(() => customersQuery.data.value?.total ?? 0)

// ─── Client-side status filter ────────────────────────────────────────────────
const filteredCustomers = computed(() => {
  if (statusFilter.value === 'all') return customers.value
  const active = statusFilter.value === 'active'
  return customers.value.filter(c => c.isActive === active)
})

// ─── Row selection ────────────────────────────────────────────────────────────
const rowSelection = ref<Record<string, boolean>>({})

function getRowItems(row: Row<Customer>) {
  return [[{
    label: 'Copy ID',
    icon: 'i-lucide-copy',
    onSelect() {
      navigator.clipboard.writeText(row.original.id)
      toast.add({ title: 'Đã copy ID', color: 'success' })
    }
  }], [{
    label: row.original.isActive ? 'Vô hiệu hóa' : 'Kích hoạt',
    icon: row.original.isActive ? 'i-lucide-user-x' : 'i-lucide-user-check',
    onSelect() {
      toggleActive.mutate(row.original.id)
    }
  }]]
}

const columns: TableColumn<Customer>[] = [
  {
    id: 'select',
    header: ({ table: t }) =>
      h(UCheckbox, {
        'modelValue': t.getIsSomePageRowsSelected() ? 'indeterminate' : t.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (v: boolean | 'indeterminate') => t.toggleAllPageRowsSelected(!!v),
        'ariaLabel': 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (v: boolean | 'indeterminate') => row.toggleSelected(!!v),
        'ariaLabel': 'Select row'
      })
  },
  {
    accessorKey: 'fullName',
    header: 'Khách hàng',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          src: row.original.avatar ?? undefined,
          alt: row.original.fullName,
          size: 'md'
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted' }, row.original.fullName),
          h('p', { class: 'text-sm text-muted' }, row.original.email)
        ])
      ])
  },
  {
    accessorKey: 'phone',
    header: 'Điện thoại',
    cell: ({ row }) => row.original.phone ?? '—'
  },
  {
    accessorKey: '_count',
    header: 'Đơn hàng',
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original._count.orders)
  },
  {
    accessorKey: 'isActive',
    header: 'Trạng thái',
    cell: ({ row }) =>
      h(UBadge, {
        variant: 'subtle',
        color: row.original.isActive ? 'success' : 'error'
      }, () => row.original.isActive ? 'Hoạt động' : 'Bị khóa')
  },
  {
    accessorKey: 'createdAt',
    header: 'Ngày tạo',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('vi-VN')
  },
  {
    id: 'actions',
    cell: ({ row }) =>
      h('div', { class: 'text-right' },
        h(UDropdownMenu, {
          content: { align: 'end' },
          items: getRowItems(row)
        }, () => h(UButton, {
          icon: 'i-lucide-ellipsis-vertical',
          color: 'neutral',
          variant: 'ghost',
          class: 'ml-auto'
        }))
      )
  }
]
</script>

<template>
  <UDashboardPanel id="customers">
    <template #header>
      <UDashboardNavbar title="Khách hàng">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <CustomersAddModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-4">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Tìm theo tên, email..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'Tất cả', value: 'all' },
              { label: 'Hoạt động', value: 'active' },
              { label: 'Bị khóa', value: 'inactive' }
            ]"
            placeholder="Trạng thái"
            class="min-w-32"
          />
          <UDropdownMenu
            :items="table?.tableApi?.getAllColumns()
              .filter((col: any) => col.getCanHide())
              .map((col: any) => ({
                label: upperFirst(col.id),
                type: 'checkbox' as const,
                checked: col.getIsVisible(),
                onUpdateChecked: (v: boolean) => col.toggleVisibility(!!v),
                onSelect: (e?: Event) => e?.preventDefault()
              }))"
            :content="{ align: 'end' }"
          >
            <UButton label="Hiển thị" color="neutral" variant="outline" trailing-icon="i-lucide-settings-2" />
          </UDropdownMenu>
        </div>
      </div>

      <UTable
        ref="table"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        class="shrink-0"
        :data="filteredCustomers"
        :columns="columns"
        :loading="customersQuery.isPending.value"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0'
        }"
      />

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <p class="text-sm text-muted">
          Tổng {{ total }} khách hàng
        </p>
        <UPagination
          :default-page="pagination.pageIndex + 1"
          :items-per-page="pagination.pageSize"
          :total="total"
          @update:page="(p: number) => pagination.pageIndex = p - 1"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
