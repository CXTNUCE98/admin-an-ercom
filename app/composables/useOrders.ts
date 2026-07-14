import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Order, OrdersResponse, OrderStatus } from '~/types'

interface OrderQuery {
  status?: OrderStatus | 'all'
  page?: number
  pageSize?: number
}

/** Danh sách đơn hàng (Admin) — GET /orders/admin */
export const useOrders = (query?: Ref<OrderQuery>) => {
  const { token } = useAuth()

  const authHeaders = computed(() => ({
    Authorization: `Bearer ${token.value}`
  }))

  const ordersQuery = useQuery({
    queryKey: ['orders', query],
    queryFn: async (): Promise<OrdersResponse> => {
      const q = query?.value ?? {}
      const data = await $anErcom('/orders/admin', {
        query: {
          status: (q.status && q.status !== 'all') ? q.status : undefined,
          page: q.page ?? 1,
          pageSize: q.pageSize ?? 20
        },
        headers: authHeaders.value
      })
      return data as unknown as OrdersResponse
    },
    enabled: computed(() => !!token.value)
  })

  return { ordersQuery }
}

/** Chi tiết 1 đơn — GET /orders/{id} */
export const useOrder = (id: Ref<string | null>) => {
  const { token } = useAuth()

  const orderQuery = useQuery({
    queryKey: ['order', id],
    queryFn: async (): Promise<Order> => {
      const data = await $anErcom('/orders/{id}', {
        path: { id: id.value! },
        headers: { Authorization: `Bearer ${token.value}` }
      })
      return data as unknown as Order
    },
    enabled: computed(() => !!token.value && !!id.value)
  })

  return { orderQuery }
}

/** Cập nhật trạng thái đơn — PATCH /orders/{id}/status */
export const useOrderMutations = () => {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string, status: OrderStatus }) =>
      $anErcom('/orders/{id}/status', {
        method: 'PATCH',
        path: { id },
        body: { status },
        headers: { Authorization: `Bearer ${token.value}` }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
      toast.add({ title: 'Đã cập nhật trạng thái đơn', color: 'success', icon: 'i-lucide-circle-check' })
    },
    onError: (err: any) => {
      toast.add({
        title: 'Cập nhật thất bại',
        description: err?.data?.message || 'Có lỗi xảy ra',
        color: 'error',
        icon: 'i-lucide-circle-x'
      })
    }
  })

  return { updateStatus }
}

// ─── Helpers dùng chung ─────────────────────────────────────────────────────
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã huỷ'
}

export const ORDER_STATUS_COLOR: Record<OrderStatus, 'warning' | 'info' | 'primary' | 'success' | 'error'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  SHIPPING: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'error'
}

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  COD: 'Thanh toán khi nhận (COD)',
  BANK_TRANSFER: 'Chuyển khoản',
  MOMO: 'Ví MoMo'
}
