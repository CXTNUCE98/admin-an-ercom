import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Customer } from '~/types'

interface CustomersResponse {
  items: Customer[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const useCustomers = (query?: Ref<{ search?: string, page?: number, pageSize?: number }>) => {
  const { token } = useAuth()

  const authHeaders = computed(() => ({
    Authorization: `Bearer ${token.value}`
  }))

  // Query: danh sách customers
  const customersQuery = useQuery({
    queryKey: ['customers', query],
    queryFn: async (): Promise<CustomersResponse> => {
      const q = query?.value ?? {}
      const data = await $anErcom('/users/customers', {
        query: {
          search: q.search || undefined,
          page: q.page ?? 1,
          pageSize: q.pageSize ?? 10
        },
        headers: authHeaders.value
      })
      return data as unknown as CustomersResponse
    },
    enabled: computed(() => !!token.value)
  })

  return { customersQuery }
}

export const useToggleCustomerActive = () => {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) =>
      $anErcom('/users/{id}/toggle-active', {
        method: 'PATCH',
        path: { id },
        headers: { Authorization: `Bearer ${token.value}` }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.add({
        title: 'Cập nhật thành công',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    },
    onError: () => {
      toast.add({
        title: 'Cập nhật thất bại',
        color: 'error',
        icon: 'i-lucide-circle-x'
      })
    }
  })
}
